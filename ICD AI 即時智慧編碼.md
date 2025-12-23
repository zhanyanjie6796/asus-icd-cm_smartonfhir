# ICD AI 即時智慧編碼 - 技術說明文件

**版本**: 1.2  
**日期**: 2024年12月  
**專案**: asus-icd-cm_smartonfhir

---

## 📋 目錄

1. [功能概述](#1-功能概述)
2. [系統架構](#2-系統架構)
3. [API 整合詳解](#3-api-整合詳解)
4. [資料流程](#4-資料流程)
5. [技術實現細節](#5-技術實現細節)
6. [錯誤處理與狀態管理](#6-錯誤處理與狀態管理)
7. [UI/UX 設計](#7-uiux-設計)
8. [附錄](#附錄)

---

## 1. 功能概述

### 1.1 核心功能

ICD AI 即時智慧編碼整合了 ASUS ICD-10 編碼 AI 查詢服務，提供以下核心功能：

- **AI 智慧查詢**: 從 FHIR Condition 資源中提取診斷名稱，AI 自動查詢對應的 ICD-10 編碼
- **即時編碼**: 即時顯示編碼結果，無需等待，提升工作效率
- **多環境支援**: 同時支援本地開發環境與 GitHub Pages 靜態部署環境
- **雙語顯示**: 同時顯示英文與中文診斷名稱
- **申報標記**: 標示可申報的編碼，方便醫療人員判斷

### 1.2 業務價值

- **提升編碼效率**: ICD AI 即時智慧編碼自動化 ICD-10 編碼查詢，大幅減少人工查詢時間
- **提高準確性**: 使用 AI 技術與 NHI-2023 模型（健保 ICD-10-CM），確保編碼符合健保規範
- **改善使用者體驗**: 無需手動查詢，ICD AI 即時智慧編碼自動顯示編碼結果於診斷列表中

### 1.3 技術特點

- **AI 驅動**: 採用先進的 AI 技術進行智慧編碼查詢
- **即時回應**: 實現即時查詢與結果顯示，無需等待
- **智慧快取**: 實現查詢結果快取機制，提升即時回應速度
- **狀態管理**: 採用 React Hooks 進行高效狀態管理
- **批次處理**: AI 智慧批次查詢多個診斷，提升效率
- **錯誤處理**: 優雅的錯誤處理與降級策略

---

## 2. 系統架構

### 2.1 元件架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    DiagnosisIcdCard                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  ClinicalDataProvider (取得診斷資料)                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  1. getSessionToken()                                  │  │
│  │     ├─ GitHub Pages → Flask Server 直接呼叫          │  │
│  │     └─ 本地開發 → /api/asus-auth 代理                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  2. fetchAllIcdCodes()                                 │  │
│  │     └─ 對每個診斷執行 searchIcdCode()                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  3. searchIcdCode()                                    │  │
│  │     └─ 呼叫 ASUS ICD API                               │  │
│  └───────────────────────────────────────────────────────┘  │
│                          │                                   │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  4. IcdResultList (顯示結果)                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 檔案結構

```
features/right-panel/components/
└── DiagnosisIcdCard.tsx          # 主要元件

app/api/asus-auth/
└── route.ts                      # Token 代理 API (僅本地開發)
```

### 2.3 技術棧

- **前端框架**: React 19.1 + TypeScript 5
- **狀態管理**: React Hooks (useState, useEffect, useMemo, useCallback)
- **UI 元件**: shadcn/ui (Card 元件)
- **API 整合**: Fetch API
- **部署環境**: Next.js 16 (App Router)

---

## 3. API 整合詳解

### 3.1 ASUS ICD API 端點

#### 3.1.1 Session Token 取得 API

**端點 1: Flask Server (生產環境)**

```
GET https://asus-icd-api.azurewebsites.net/api/token
```

**端點 2: Next.js API Route (本地開發)**

```
GET /api/asus-auth
```

**請求格式:**

```http
GET /api/token HTTP/1.1
Host: asus-icd-api.azurewebsites.net
Accept: application/json
```

**回應格式:**

```json
{
  "success": true,
  "session": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**錯誤回應:**

```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

#### 3.1.2 ICD 編碼查詢 API

**端點:**

```
POST https://aics-api-tw.asus.com/miraico/search
```

**請求 Headers:**

```http
POST /miraico/search HTTP/1.1
Host: aics-api-tw.asus.com
accept: application/json
ocp-apim-session-token: {session_token}
Content-Type: application/json
```

**請求 Body:**

```json
{
  "query": "高血壓",
  "target": "CM",
  "model": "NHI-2023",
  "useSpecifiedModel": true
}
```

**參數說明:**

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `query` | string | ✅ | 診斷名稱（中文或英文） |
| `target` | string | ✅ | 固定為 "CM" (ICD-10-CM) |
| `model` | string | ✅ | 模型版本，固定為 "NHI-2023" |
| `useSpecifiedModel` | boolean | ✅ | 是否使用指定模型，固定為 `true` |

**回應格式:**

```json
{
  "children": [
    {
      "icd10_list": [
        {
          "code": "I10",
          "english_name": "Essential (primary) hypertension",
          "chinese_name": "原發性高血壓",
          "billable": true
        },
        {
          "code": "I11.9",
          "english_name": "Hypertensive heart disease without heart failure",
          "chinese_name": "高血壓性心臟病，未提及心臟衰竭",
          "billable": true
        }
      ]
    }
  ]
}
```

**回應欄位說明:**

| 欄位 | 類型 | 說明 |
|------|------|------|
| `children` | array | 查詢結果群組陣列 |
| `children[].icd10_list` | array | ICD-10 編碼列表 |
| `icd10_list[].code` | string | ICD-10 編碼 |
| `icd10_list[].english_name` | string | 英文診斷名稱 |
| `icd10_list[].chinese_name` | string | 中文診斷名稱 |
| `icd10_list[].billable` | boolean | 是否可申報 |

### 3.2 環境判斷邏輯

系統會自動判斷執行環境，並選擇對應的 API 端點：

**GitHub Pages 環境:**
- 直接呼叫 Flask Server: `https://asus-icd-api.azurewebsites.net/api/token`
- 原因: 靜態部署無法使用 Next.js API Routes

**本地開發環境:**
- 透過 Next.js API Route 代理: `/api/asus-auth`
- 原因: 避免 CORS 跨域問題

**實作程式碼:**

```typescript
// 判斷是否在 GitHub Pages 環境
function isGitHubPages(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname.includes('github.io')
}

// Token 取得策略
if (isGitHubPages()) {
  // 生產環境：直接呼叫 Flask server
  fetch('https://asus-icd-api.azurewebsites.net/api/token')
} else {
  // 本地開發：透過 Next.js API route 代理（避免 CORS）
  fetch('/api/asus-auth')
}
```

---

## 4. 資料流程

### 4.1 完整流程圖

```
┌──────────────────────────────────────────────────────────────┐
│ 1. 元件初始化                                                  │
│    DiagnosisIcdCard 載入                                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. 取得診斷資料                                                │
│    useClinicalData() → diagnoses[]                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. 取得 Session Token                                         │
│    useEffect(() => getSessionToken())                        │
│    ├─ 檢查環境 (GitHub Pages vs 本地)                        │
│    ├─ 呼叫對應端點                                            │
│    └─ 儲存 token 至 state                                     │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. 轉換診斷資料                                                │
│    useMemo(() => rows[])                                     │
│    ├─ 提取診斷名稱 (code.text || coding[0].display)          │
│    ├─ 提取臨床狀態與驗證狀態                                  │
│    └─ 翻譯狀態標籤                                            │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. 自動觸發 ICD 查詢                                          │
│    useEffect(() => fetchAllIcdCodes())                      │
│    條件: !isLoading && !tokenLoading && sessionToken         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. 批次查詢每個診斷                                            │
│    for (const row of rows) {                                 │
│      ├─ 檢查是否已查詢過                                      │
│      ├─ 設定 loading 狀態                                    │
│      ├─ 呼叫 searchIcdCode(row.title, sessionToken)         │
│      └─ 儲存結果至 icdResults[row.id]                       │
│    }                                                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. 解析 API 回應                                               │
│    data.children.forEach(child => {                          │
│      child.icd10_list.forEach(icd => {                       │
│        icdList.push({                                         │
│          code, english_name, chinese_name, billable           │
│        })                                                     │
│      })                                                       │
│    })                                                         │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ 8. 顯示查詢結果                                                │
│    <IcdResultList icdList={icdResults[row.id]} />          │
│    ├─ 預設顯示前 2 筆                                          │
│    ├─ 支援展開/收起功能                                       │
│    └─ 顯示可申報標記                                          │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 關鍵步驟說明

**步驟 1: 元件初始化**
- ICD AI 即時智慧編碼元件載入時，從 `ClinicalDataProvider` 取得診斷資料

**步驟 2: Token 取得**
- ICD AI 即時智慧編碼使用 `useEffect` 在元件載入時取得 session token
- 使用 `useRef` 確保只執行一次，提升即時回應效率

**步驟 3: 資料轉換**
- ICD AI 即時智慧編碼使用 `useMemo` 將 FHIR Condition 轉換為內部 Row 格式
- AI 智慧提取診斷名稱、狀態、分類等資訊

**步驟 4: AI 即時查詢**
- ICD AI 即時智慧編碼當所有條件滿足時，自動觸發 AI 批次查詢
- 使用 `useCallback` 快取查詢函數，提升即時回應效能

**步驟 5: 即時結果顯示**
- ICD AI 即時智慧編碼為每個診斷獨立顯示 AI 查詢結果
- 支援展開/收起功能，方便查看多個編碼選項

---

## 5. 技術實現細節

### 5.1 狀態管理

```typescript
// 主要狀態
const [sessionToken, setSessionToken] = useState<string | null>(null)
const [tokenLoading, setTokenLoading] = useState(true)
const [icdResults, setIcdResults] = useState<Record<string, IcdInfo[]>>({})
const [loadingIcd, setLoadingIcd] = useState<Record<string, boolean>>({})

// 防止重複取得 token
const tokenFetched = useRef(false)
```

**狀態說明:**

| 狀態 | 類型 | 用途 |
|------|------|------|
| `sessionToken` | `string \| null` | 儲存 ASUS API session token |
| `tokenLoading` | `boolean` | Token 取得中狀態 |
| `icdResults` | `Record<string, IcdInfo[]>` | 以診斷 ID 為 key 的查詢結果 |
| `loadingIcd` | `Record<string, boolean>` | 各診斷的查詢中狀態 |
| `tokenFetched` | `Ref<boolean>` | 防止重複取得 token |

### 5.2 資料轉換邏輯

#### 5.2.1 FHIR Condition → Row 轉換

```typescript
const rows = useMemo<Row[]>(() => {
  return diagnoses.map(condition => {
    // 1. 提取診斷名稱（優先順序）
    const title = 
      condition.code?.text ||                    // 優先：text 欄位
      condition.code?.coding?.[0]?.display ||   // 次選：coding.display
      'Unknown'                                 // 預設值
    
    // 2. 提取現有 ICD 編碼（如果有）
    const icdCode = condition.code?.coding?.[0]?.code || ''
    
    // 3. 提取臨床狀態
    const clinical = 
      condition.clinicalStatus?.coding?.[0]?.display ||
      condition.clinicalStatus?.coding?.[0]?.code || ''
    
    // 4. 提取驗證狀態
    const verification = 
      condition.verificationStatus?.coding?.[0]?.display ||
      condition.verificationStatus?.coding?.[0]?.code || ''
    
    // 5. 提取分類並翻譯
    const categories: string[] = []
    const categoriesZh: string[] = []
    condition.category?.forEach(cat => {
      cat.coding?.forEach(coding => {
        const catText = coding.display || coding.code || ''
        if (catText) {
          categories.push(catText)
          const zhText = categoryTranslations[catText.toLowerCase()] || ''
          if (zhText) categoriesZh.push(zhText)
        }
      })
    })
    
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
```

#### 5.2.2 API 回應解析

```typescript
async function searchIcdCode(query: string, sessionToken: string): Promise<IcdInfo[]> {
  const response = await fetch("https://aics-api-tw.asus.com/miraico/search", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "ocp-apim-session-token": sessionToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: query,
      target: "CM",
      model: "NHI-2023",
      useSpecifiedModel: true
    })
  })
  
  const data = await response.json()
  
  // 扁平化處理：從巢狀結構提取所有 ICD 編碼
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
}
```

### 5.3 批次查詢策略

```typescript
const fetchAllIcdCodes = useCallback(async () => {
  if (rows.length === 0 || !sessionToken) return

  // 順序查詢（避免 API 限流）
  for (const row of rows) {
    // 1. 檢查是否已查詢過或正在查詢
    if (icdResults[row.id] || loadingIcd[row.id]) continue

    // 2. 設定查詢中狀態
    setLoadingIcd(prev => ({ ...prev, [row.id]: true }))
    
    // 3. 執行查詢
    const results = await searchIcdCode(row.title, sessionToken)
    
    // 4. 儲存結果
    setIcdResults(prev => ({ ...prev, [row.id]: results }))
    
    // 5. 清除查詢中狀態
    setLoadingIcd(prev => ({ ...prev, [row.id]: false }))
  }
}, [rows, sessionToken, icdResults, loadingIcd])
```

**設計考量:**

- **順序查詢**: 避免 API 限流問題
- **去重機制**: 已查詢過或正在查詢的診斷會跳過
- **獨立狀態**: 每個診斷有獨立的 loading 狀態，不影響其他診斷

### 5.4 自動觸發機制

```typescript
useEffect(() => {
  // 觸發條件：
  // 1. 診斷資料已載入 (!isLoading)
  // 2. Token 已取得 (!tokenLoading)
  // 3. Token 存在 (sessionToken)
  // 4. 有診斷資料 (rows.length > 0)
  if (!isLoading && !tokenLoading && sessionToken && rows.length > 0) {
    fetchAllIcdCodes()
  }
}, [rows, isLoading, tokenLoading, sessionToken, fetchAllIcdCodes])
```

---

## 6. 錯誤處理與狀態管理

### 6.1 Token 取得錯誤處理

```typescript
async function getSessionToken(): Promise<string | null> {
  try {
    // ... API 呼叫 ...
    
    if (!response.ok) {
      console.error("Token API error:", response.status)
      return null  // 返回 null，不拋出錯誤
    }
    
    const data = await response.json()
    
    if (data.success && data.session) {
      return data.session
    } else {
      console.error("取得 token 失敗:", data.error)
      return null
    }
  } catch (error) {
    console.error("Error getting session token:", error)
    return null  // 優雅降級
  }
}
```

### 6.2 ICD 查詢錯誤處理

```typescript
async function searchIcdCode(query: string, sessionToken: string): Promise<IcdInfo[]> {
  try {
    // ... API 呼叫 ...
    
    if (!response.ok) {
      console.error("ICD search API error:", response.status)
      return []  // 返回空陣列，不中斷流程
    }
    
    // ... 解析回應 ...
    
    return icdList
  } catch (error) {
    console.error("Error searching ICD code:", error)
    return []  // 優雅降級
  }
}
```

### 6.3 UI 狀態顯示

```typescript
const renderContent = () => {
  // 1. 載入中
  if (loading) {
    return <div>載入診斷中…</div>
  }
  
  // 2. 錯誤狀態
  if (err) {
    return <div className="text-red-600">{err}</div>
  }
  
  // 3. Token 取得失敗
  if (!sessionToken) {
    return <div className="text-yellow-600">
      無法取得 API Token，ICD AI 即時智慧編碼暫時無法使用。
    </div>
  }
  
  // 4. 無診斷資料
  if (rows.length === 0) {
    return <div>目前無診斷資料。</div>
  }
  
  // 5. 正常顯示
  return (
    <ul>
      {rows.map(r => (
        <li key={r.id}>
          {/* 診斷資訊 */}
          <div>{r.title}</div>
          
          {/* ICD AI 即時智慧編碼查詢狀態 */}
          {loadingIcd[r.id] && (
            <div>ICD AI 即時智慧編碼查詢中...</div>
          )}
          
          {/* 查詢結果 */}
          {icdResults[r.id] && icdResults[r.id].length > 0 && (
            <IcdResultList icdList={icdResults[r.id]} />
          )}
          
          {/* 無結果 */}
          {icdResults[r.id] && icdResults[r.id].length === 0 && !loadingIcd[r.id] && (
            <div>ICD AI 即時智慧編碼未找到相關編碼</div>
          )}
        </li>
      ))}
    </ul>
  )
}
```

---

## 7. UI/UX 設計

### 7.1 ICD 結果顯示元件

```typescript
function IcdResultList({ icdList }: { icdList: IcdInfo[] }) {
  const [expanded, setExpanded] = useState(false)
  const DEFAULT_SHOW_COUNT = 2
  
  const hasMore = icdList.length > DEFAULT_SHOW_COUNT
  const displayList = expanded ? icdList : icdList.slice(0, DEFAULT_SHOW_COUNT)
  
  return (
    <div className="bg-blue-50 rounded-md p-2 mt-1">
      {/* 標題與展開按鈕 */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-blue-700">
          ICD AI 即時智慧編碼查詢結果：
        </span>
        {hasMore && (
          <button onClick={() => setExpanded(!expanded)}>
            {expanded ? "收起" : `展開 (共 ${icdList.length} 筆)`}
          </button>
        )}
      </div>
      
      {/* 編碼列表 */}
      <div className="space-y-1">
        {displayList.map((icd, idx) => (
          <div key={idx} className="border-l-2 border-blue-300 pl-2 py-0.5">
            {/* 編碼與可申報標記 */}
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-800">
                {icd.code}
              </span>
              {icd.billable && (
                <span className="bg-green-100 text-green-700 px-1 rounded">
                  可申報
                </span>
              )}
            </div>
            
            {/* 英文名稱 */}
            <div className="text-gray-700">{icd.english_name}</div>
            
            {/* 中文名稱 */}
            <div className="text-gray-600">{icd.chinese_name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 7.2 視覺設計特點

| 元素 | 樣式 | 說明 |
|------|------|------|
| 結果容器 | `bg-blue-50` | 淺藍色背景，區分查詢結果 |
| 編碼 | `font-mono font-bold text-blue-800` | 等寬字體，藍色粗體 |
| 可申報標記 | `bg-green-100 text-green-700` | 綠色標籤，醒目提示 |
| 左側邊框 | `border-l-2 border-blue-300` | 藍色左側邊框，視覺層次 |
| 展開按鈕 | `text-blue-600 hover:underline` | 藍色連結樣式，hover 效果 |

### 7.3 狀態標籤設計

```typescript
// 臨床狀態標籤
{r.clinical && (
  <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
    {r.clinical}
    {r.clinicalZh && <span className="text-emerald-600">({r.clinicalZh})</span>}
  </span>
)}

// 驗證狀態標籤
{r.verification && (
  <span className="bg-sky-50 text-sky-700 ring-1 ring-sky-200">
    {r.verification}
    {r.verificationZh && <span className="text-sky-600">({r.verificationZh})</span>}
  </span>
)}
```

---

## 附錄 A: 翻譯對照表

### A.1 臨床狀態翻譯

| 英文 | 中文 |
|------|------|
| active | 進行中 |
| recurrence | 復發 |
| relapse | 復發 |
| inactive | 非活動 |
| remission | 緩解 |
| resolved | 已解決 |

### A.2 驗證狀態翻譯

| 英文 | 中文 |
|------|------|
| unconfirmed | 未確認 |
| provisional | 暫定 |
| differential | 鑑別診斷 |
| confirmed | 已確認 |
| refuted | 已排除 |
| entered-in-error | 輸入錯誤 |

### A.3 分類翻譯

| 英文 | 中文 |
|------|------|
| problem-list-item | 問題列表項目 |
| encounter-diagnosis | 就診診斷 |
| health-concern | 健康關注 |

---

## 附錄 B: API 回應範例

### B.1 Token API 成功回應

```json
{
  "success": true,
  "session": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
```

### B.2 ICD 查詢 API 回應範例

```json
{
  "children": [
    {
      "icd10_list": [
        {
          "code": "I10",
          "english_name": "Essential (primary) hypertension",
          "chinese_name": "原發性高血壓",
          "billable": true
        },
        {
          "code": "I11.9",
          "english_name": "Hypertensive heart disease without heart failure",
          "chinese_name": "高血壓性心臟病，未提及心臟衰竭",
          "billable": true
        },
        {
          "code": "I12.9",
          "english_name": "Hypertensive chronic kidney disease with stage 1 through stage 4 chronic kidney disease, or unspecified chronic kidney disease",
          "chinese_name": "高血壓性慢性腎臟病，伴有第1至第4期慢性腎臟病或未明示慢性腎臟病",
          "billable": true
        }
      ]
    }
  ]
}
```

---

## 附錄 C: 效能優化

### C.1 查詢去重機制

```typescript
// 檢查是否已查詢過
if (icdResults[row.id] || loadingIcd[row.id]) continue
```

### C.2 批次查詢策略

- **順序執行**: 避免 API 限流
- **獨立狀態**: 每個診斷獨立管理 loading 狀態
- **快取結果**: 已查詢結果直接顯示，不重複查詢

### C.3 記憶體管理

- 使用 `useMemo` 快取轉換後的診斷資料
- 使用 `useCallback` 快取查詢函數
- 使用 `useRef` 防止重複執行 token 取得

---

## 附錄 D: 故障排除

### D.1 常見問題

**問題 1: Token 取得失敗**

- **原因**: Flask Server 無法連線或 API 端點變更
- **解決**: 檢查網路連線，確認 API 端點是否正確

**問題 2: ICD AI 即時智慧編碼查詢無結果**

- **原因**: 診斷名稱格式不正確或 AI API 無法識別
- **解決**: 檢查診斷名稱是否為標準醫學術語，確認 ICD AI 即時智慧編碼能正確識別

**問題 3: CORS 錯誤（本地開發）**

- **原因**: 直接呼叫外部 API 導致跨域問題
- **解決**: 確認 ICD AI 即時智慧編碼使用 `/api/asus-auth` 代理端點

### D.2 除錯技巧

1. 開啟瀏覽器開發者工具，查看 Console 日誌
2. 檢查 Network 標籤，確認 API 請求與回應
3. 使用 React DevTools 檢查元件狀態

---

## 附錄 E: 未來改進方向

### E.1 功能擴充

- ICD AI 即時智慧編碼支援手動重新查詢特定診斷
- 支援匯出 ICD 編碼結果
- 支援編碼歷史記錄與 AI 查詢統計
- 新增 AI 編碼建議與相似診斷推薦

### E.2 效能優化

- 實作查詢結果快取（localStorage）
- 支援並行查詢（使用 Promise.all）
- 實作查詢結果分頁

### E.3 使用者體驗

- ICD AI 即時智慧編碼新增即時查詢進度條
- 支援批量操作（全選/取消全選）
- 新增 AI 編碼比較功能與收藏功能
- 新增 AI 智慧提示與編碼準確度評分

---

**文件結束**

---

*本文檔由 asus-icd-cm_smartonfhir 專案自動生成*  
*最後更新: 2024年12月*

