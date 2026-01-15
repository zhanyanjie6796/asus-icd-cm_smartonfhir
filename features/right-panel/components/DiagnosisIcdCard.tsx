// features/right-panel/components/DiagnosisIcdCard.tsx
"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useClinicalData } from "@/lib/providers/ClinicalDataProvider"
import { useIcdTokenKey, DEFAULT_TOKEN_KEY } from "@/lib/providers/IcdTokenKeyProvider"

// FHIR R4 Type Definitions
interface Coding {
  system?: string
  code?: string
  display?: string
}

interface CodeableConcept {
  coding?: Coding[]
  text?: string
}

interface Category {
  coding?: Coding[]
  text?: string
}

interface Condition {
  id?: string
  code?: CodeableConcept
  clinicalStatus?: CodeableConcept
  verificationStatus?: CodeableConcept
  category?: Category[]
  onsetDateTime?: string
  recordedDate?: string
  encounter?: { reference?: string }
}

interface IcdInfo {
  code: string
  english_name: string
  chinese_name: string
  billable?: boolean
}

interface Row {
  id: string
  title: string
  icdCode?: string
  when?: string
  verification?: string
  verificationZh?: string
  clinical?: string
  clinicalZh?: string
  categories: string[]
  categoriesZh: string[]
}

// 臨床狀態翻譯
const clinicalStatusTranslations: Record<string, string> = {
  "active": "進行中",
  "recurrence": "復發",
  "relapse": "復發",
  "inactive": "非活動",
  "remission": "緩解",
  "resolved": "已解決",
}

// 驗證狀態翻譯
const verificationStatusTranslations: Record<string, string> = {
  "unconfirmed": "未確認",
  "provisional": "暫定",
  "differential": "鑑別診斷",
  "confirmed": "已確認",
  "refuted": "已排除",
  "entered-in-error": "輸入錯誤",
}

// 分類翻譯
const categoryTranslations: Record<string, string> = {
  "problem-list-item": "問題列表項目",
  "encounter-diagnosis": "就診診斷",
  "health-concern": "健康關注",
}

function fmtDate(d?: string): string {
  if (!d) return ""
  try { return new Date(d).toLocaleDateString() } catch { return d }
}

// Flask server URL
const FLASK_SERVER_URL = 'https://asus-icd-api.azurewebsites.net'

// 判斷是否在 GitHub Pages 環境
function isGitHubPages(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname.includes('github.io')
}

// 驗證結果型別
interface TokenValidationResult {
  success: boolean
  session: string | null
  error?: string
}

// 取得 session token（使用傳入的 tokenKey）
// - GitHub Pages：直接呼叫 Flask server
// - 本地開發：透過 Next.js API route 代理（避免 CORS 問題）
async function getSessionToken(tokenKey: string): Promise<TokenValidationResult> {
  try {
    // GitHub Pages 靜態部署：直接呼叫 Flask server
    if (isGitHubPages()) {
      const url = new URL(`${FLASK_SERVER_URL}/api/tokenkey`)
      url.searchParams.set('key', tokenKey)
      
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "Accept": "application/json" }
      })

      // 不論狀態碼，都嘗試解析 JSON 取得 error 訊息
      const data = await response.json()
      
      if (response.ok && data.success && data.session) {
        console.log("Session token obtained from Flask server")
        return { success: true, session: data.session }
      } else {
        console.error("取得 token 失敗:", data.error)
        return { success: false, session: null, error: data.error || "Token 驗證失敗" }
      }
    }

    // 本地開發：透過 Next.js API route 代理（需要傳遞 tokenKey）
    const response = await fetch(`/api/asus-auth?key=${encodeURIComponent(tokenKey)}`, {
      method: "GET"
    })

    // 不論狀態碼，都嘗試解析 JSON 取得 error 訊息
    const data = await response.json()
    
    if (response.ok && data.success && data.session) {
      console.log("Session token obtained via API route")
      return { success: true, session: data.session }
    } else {
      console.error("取得 token 失敗:", data.error)
      return { success: false, session: null, error: data.error || "Token 驗證失敗" }
    }
  } catch (error) {
    console.error("Error getting session token:", error)
    return { success: false, session: null, error: "網路錯誤，請稍後再試" }
  }
}

// 查詢 ICD 編碼的 API
async function searchIcdCode(query: string, sessionToken: string): Promise<IcdInfo[]> {
  try {
    const response = await fetch("https://aics-api-tw.asus.com/miraico/search", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "ocp-apim-session-token": sessionToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: query,
        // query: "高血壓",
        target: "CM",
        model: "NHI-2023",
        useSpecifiedModel: true               
      })
    })

    if (!response.ok) {
      console.error("ICD search API error:", response.status)
      return []
    }

    const data = await response.json()
    
    // 從 children 中提取所有 icd10_list 的項目
    const icdList: IcdInfo[] = []
    if (data.children && Array.isArray(data.children)) {
      data.children.forEach((child: any) => {
        if (child.icd10_list && Array.isArray(child.icd10_list)) {
          child.icd10_list.forEach((icd: any) => {
            icdList.push({
              code: icd.code || '',
              english_name: icd.english_name || '',
              chinese_name: icd.chinese_name || '',
              billable: icd.billable
            })
          })
        }
      })
    }
    
    return icdList
  } catch (error) {
    console.error("Error searching ICD code:", error)
    return []
  }
}

// ICD 結果顯示組件（支援展開/收起）
function IcdResultList({ icdList }: { icdList: IcdInfo[] }) {
  const [expanded, setExpanded] = useState(false)
  const DEFAULT_SHOW_COUNT = 2
  
  const hasMore = icdList.length > DEFAULT_SHOW_COUNT
  const displayList = expanded ? icdList : icdList.slice(0, DEFAULT_SHOW_COUNT)
  
  return (
    <div className="bg-blue-50 rounded-md p-2 mt-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-blue-700">ICD-10-CM 編碼查詢結果：</span>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            {expanded ? "收起" : `展開 (共 ${icdList.length} 筆)`}
          </button>
        )}
      </div>
      <div className="space-y-1">
        {displayList.map((icd, idx) => (
          <div key={idx} className="text-xs border-l-2 border-blue-300 pl-2 py-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-800">{icd.code}</span>
              {icd.billable && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">可申報</span>
              )}
            </div>
            <div className="text-gray-700">{icd.english_name}</div>
            <div className="text-gray-600">{icd.chinese_name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ICD Token Key 輸入區塊組件
function IcdTokenKeyInput({ 
  onValidationSuccess 
}: { 
  onValidationSuccess: (session: string) => void 
}) {
  const { tokenKey, setTokenKey, clearTokenKey } = useIcdTokenKey()
  const [inputValue, setInputValue] = useState(tokenKey || DEFAULT_TOKEN_KEY)
  const [validating, setValidating] = useState(false)
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  
  // 當 tokenKey 改變時同步到 inputValue
  useEffect(() => {
    if (tokenKey) {
      setInputValue(tokenKey)
    }
  }, [tokenKey])

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setValidationMessage({ type: 'error', text: '請輸入 ICD tokenkey' })
      return
    }

    setValidating(true)
    setValidationMessage({ type: 'info', text: '正在驗證 tokenkey...' })

    const result = await getSessionToken(inputValue.trim())

    if (result.success && result.session) {
      // 驗證成功，儲存到 localStorage
      setTokenKey(inputValue.trim())
      setValidationMessage({ type: 'success', text: '✅ 取得 Token 成功！正在載入 ICD 編碼預測...' })
      onValidationSuccess(result.session)
    } else {
      // 直接顯示 API 回傳的 error 訊息
      setValidationMessage({ type: 'error', text: `❌ 失敗：${result.error}` })
    }

    setValidating(false)
  }

  const handleClear = () => {
    setInputValue(DEFAULT_TOKEN_KEY)
    clearTokenKey()
    setValidationMessage(null)
  }

  return (
    <div className="max-w-xl space-y-2 mb-4 p-3 bg-gray-50 rounded-lg border">
      <label className="text-xs text-muted-foreground block">
        請輸入ICD tokenkey（僅保存在本機瀏覽器），如果不知請洽承辦人。
      </label>
      
      <div className="flex gap-1.5">
        <Input
          type="text"
          placeholder="請輸入 ICD tokenkey..."
          className="h-8 text-sm flex-1"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={validating}
        />
        <Button 
          size="sm" 
          onClick={handleSave} 
          disabled={!inputValue.trim() || validating}
        >
          {validating ? '驗證中...' : 'Save'}
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleClear}
          disabled={validating}
        >
          Clear
        </Button>
      </div>
      <label className="text-xs text-muted-foreground block">
        輸入後請按下「Save」按鈕儲存，並執行ICD編碼預測。
      </label>      
      {validationMessage && (
        <p className={`text-xs ${
          validationMessage.type === 'success' ? 'text-green-600' : 
          validationMessage.type === 'error' ? 'text-red-600' : 
          'text-blue-600'
        }`}>
          {validationMessage.text}
        </p>
      )}
    </div>
  )
}

export function DiagnosisIcdCard() {
  const { diagnoses = [], isLoading, error } = useClinicalData()
  const { tokenKey } = useIcdTokenKey()
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [icdResults, setIcdResults] = useState<Record<string, IcdInfo[]>>({})
  const [loadingIcd, setLoadingIcd] = useState<Record<string, boolean>>({})
  const [tokenValidated, setTokenValidated] = useState(false)
  
  // 當驗證成功時的回調
  const handleValidationSuccess = useCallback((session: string) => {
    setSessionToken(session)
    setTokenValidated(true)
    // 清除之前的 ICD 結果，重新查詢
    setIcdResults({})
    setLoadingIcd({})
  }, [])

  const rows = useMemo<Row[]>(() => {
    if (!diagnoses || !Array.isArray(diagnoses)) return []
    
    return (diagnoses as Condition[]).map(condition => {
      // Extract categories safely
      const categories: string[] = []
      const categoriesZh: string[] = []
      if (condition.category) {
        condition.category.forEach((cat: Category) => {
          if (cat.coding) {
            cat.coding.forEach((coding: Coding) => {
              const catText = coding.display || coding.code || ''
              if (catText) {
                categories.push(catText)
                const zhText = categoryTranslations[catText.toLowerCase()] || ''
                if (zhText) categoriesZh.push(zhText)
              }
            })
          }
        })
      }

      const title = condition.code?.text || condition.code?.coding?.[0]?.display || 'Unknown'
      const icdCode = condition.code?.coding?.[0]?.code || ''
      const clinical = condition.clinicalStatus?.coding?.[0]?.display || condition.clinicalStatus?.coding?.[0]?.code || ''
      const verification = condition.verificationStatus?.coding?.[0]?.display || condition.verificationStatus?.coding?.[0]?.code || ''

      return {
        id: condition.id || Math.random().toString(36),
        title,
        icdCode,
        when: fmtDate(condition.onsetDateTime || condition.recordedDate),
        clinical,
        clinicalZh: clinicalStatusTranslations[clinical.toLowerCase()] || '',
        verification,
        verificationZh: verificationStatusTranslations[verification.toLowerCase()] || '',
        categories,
        categoriesZh,
      }
    })
  }, [diagnoses])

  // 查詢所有診斷的 ICD 編碼
  const fetchAllIcdCodes = useCallback(async () => {
    if (rows.length === 0 || !sessionToken) return

    for (const row of rows) {
      // 如果已經查詢過或正在查詢，跳過
      if (icdResults[row.id] || loadingIcd[row.id]) continue

      setLoadingIcd(prev => ({ ...prev, [row.id]: true }))
      
      const results = await searchIcdCode(row.title, sessionToken)
      
      setIcdResults(prev => ({ ...prev, [row.id]: results }))
      setLoadingIcd(prev => ({ ...prev, [row.id]: false }))
    }
  }, [rows, sessionToken, icdResults, loadingIcd])

  // 當 rows 變化且有 token 時自動查詢 ICD 編碼
  useEffect(() => {
    if (!isLoading && !tokenLoading && sessionToken && rows.length > 0) {
      fetchAllIcdCodes()
    }
  }, [rows, isLoading, tokenLoading, sessionToken, fetchAllIcdCodes])

  const loading = isLoading
  const err = error ? String(error) : null
  const CARD_TITLE = "Diagnosis / Problem List / ICD-10-CM Code"

  // 根據不同狀態顯示診斷列表內容
  const renderDiagnosisList = () => {
    if (loading) {
      return <div className="text-sm text-muted-foreground">載入診斷中…</div>
    }
    
    if (err) {
      return <div className="text-sm text-red-600">{err}</div>
    }
    
    if (!tokenValidated || !sessionToken) {
      return <div className="text-sm text-yellow-600">請先輸入並驗證 ICD tokenkey 後，才能執行 ICD 編碼預測。</div>
    }
    
    if (rows.length === 0) {
      return <div className="text-sm text-muted-foreground">目前無診斷資料。</div>
    }

    return (
        <ul className="space-y-2">
          {rows.map(r => (
            <li key={r.id} className="rounded-md border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-medium">{r.title}</span>
                  </div>
                </div>
                {r.when && <div className="text-xs text-muted-foreground whitespace-nowrap">{r.when}</div>}
              </div>

              {/* ICD 查詢結果 */}
              <div className="mt-2">
                {loadingIcd[r.id] && (
                  <div className="text-xs text-gray-400">查詢 ICD 編碼中...</div>
                )}
                {icdResults[r.id] && icdResults[r.id].length > 0 && (
                  <IcdResultList icdList={icdResults[r.id]} />
                )}
                {icdResults[r.id] && icdResults[r.id].length === 0 && !loadingIcd[r.id] && (
                  <div className="text-xs text-gray-400 mt-1">未找到相關 ICD 編碼</div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {r.clinical && (
                  <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
                    {r.clinical}
                    {r.clinicalZh && <span className="ml-1 text-emerald-600">({r.clinicalZh})</span>}
                  </span>
                )}
                {r.verification && (
                  <span className="inline-flex items-center rounded bg-sky-50 px-2 py-0.5 text-sky-700 ring-1 ring-sky-200">
                    {r.verification}
                    {r.verificationZh && <span className="ml-1 text-sky-600">({r.verificationZh})</span>}
                  </span>
                )}
                {r.categories?.map((c, i) => (
                  <span key={i} className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-gray-700 ring-1 ring-gray-200">
                    {c}
                    {r.categoriesZh[i] && <span className="ml-1 text-gray-500">({r.categoriesZh[i]})</span>}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>{CARD_TITLE}</CardTitle></CardHeader>
      <CardContent>
        <IcdTokenKeyInput onValidationSuccess={handleValidationSuccess} />
        {renderDiagnosisList()}
      </CardContent>
    </Card>
  )
}
