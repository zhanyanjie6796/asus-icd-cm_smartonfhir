// app/api/asus-auth/route.ts
// 代理 Flask server 的 token API（用於本地開發，避免 CORS 問題）
// 注意：此檔案在 GitHub Pages 靜態導出時會被刪除
import { NextRequest, NextResponse } from 'next/server'

const FLASK_SERVER_URL = 'https://asus-icd-api.azurewebsites.net'

// 從 Flask server 取得 token（使用 tokenkey API）
async function getTokenFromFlask(tokenKey: string): Promise<{ success: boolean; session?: string; error?: string }> {
  const url = new URL(`${FLASK_SERVER_URL}/api/tokenkey`)
  url.searchParams.set('key', tokenKey)
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })
  
  // 不論狀態碼，都嘗試解析 JSON 取得 error 訊息
  const data = await response.json()
  return data
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tokenKey = searchParams.get('key')
    
    if (!tokenKey) {
      return NextResponse.json(
        { success: false, error: '缺少 key 參數' },
        { status: 400 }
      )
    }
    
    const result = await getTokenFromFlask(tokenKey)
    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: errorMessage }, 
      { status: 500 }
    )
  }
}


