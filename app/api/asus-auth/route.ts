// app/api/asus-auth/route.ts
// 代理 Flask server 的 token API（用於本地開發，避免 CORS 問題）
// 注意：此檔案在 GitHub Pages 靜態導出時會被忽略
import { NextResponse } from 'next/server'

const FLASK_SERVER_URL = 'https://asus-icd-api.azurewebsites.net'

// 強制使用 Node.js runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 從 Flask server 取得 token
async function getTokenFromFlask(): Promise<{ success: boolean; session?: string; error?: string }> {
  const response = await fetch(`${FLASK_SERVER_URL}/api/token`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  })
  
  if (!response.ok) {
    throw new Error(`Flask API error: ${response.status}`)
  }
  
  return response.json()
}

export async function GET() {
  try {
    const result = await getTokenFromFlask()
    return NextResponse.json(result)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { success: false, error: errorMessage }, 
      { status: 500 }
    )
  }
}

