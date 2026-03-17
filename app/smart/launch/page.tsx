"use client"
import { useEffect } from "react"

export default function SmartLaunchPage() {
  useEffect(() => {
    (async () => {
      const FHIR = (await import("fhirclient")).default

      const url = new URL(window.location.href)
      const iss = url.searchParams.get("iss") || undefined
      const launch = url.searchParams.get("launch") || undefined

      // 🔒 自動偵測 GitHub Pages 的 repo 路徑
      // 支援 /asus-icd-cm_smartonfhir 或其他 repo 名稱
      const pathname = window.location.pathname
      // 檢查是否在 GitHub Pages 子路徑下 (格式: /repo-name/...)
      const ghPagesMatch = pathname.match(/^(\/[^/]+)\//)
      const isGhPages = ghPagesMatch && window.location.hostname.includes('github.io')
      const prefix = isGhPages ? ghPagesMatch[1] : "" // 本機(或根域名)為空字串

      const baseUrl = `${window.location.origin}${prefix}`.replace(/\/+$/, "")
      const redirectUri = `${baseUrl}/smart/callback` // 無結尾斜線（和 Pages 設定一致）

      console.log("[SMART] href=", window.location.href)
      console.log("[SMART] pathname=", pathname)
      console.log("[SMART] isGhPages=", isGhPages, "prefix=", prefix)
      console.log("[SMART] baseUrl=", baseUrl, "redirectUri=", redirectUri)

      // 嘗試從 launch 參數 (Base64 JSON) 中解碼 clientId 和 clientSecret
      let launchClientId: string | undefined
      let launchClientSecret: string | undefined
      if (launch) {
        try {
          const decoded = JSON.parse(atob(launch))
          if (Array.isArray(decoded)) {
            launchClientId = decoded[9] || undefined   // index 9 = Client ID
            launchClientSecret = decoded[10] || undefined // index 10 = Client Secret
            console.log("[SMART] decoded launch → clientId=", launchClientId, "clientSecret=", launchClientSecret ? "***" : "(empty)")
          }
        } catch (e) {
          console.warn("[SMART] Could not decode launch param:", e)
        }
      }

      // 優先順序: URL query param → launch 解碼值 → 硬編碼預設值
      const clientId = url.searchParams.get("client_id")
        || launchClientId

      const clientSecret = url.searchParams.get("client_secret")
        || launchClientSecret

      await FHIR.oauth2.authorize({
        // clientId: "my_web_app",        
        clientId: clientId,
        clientSecret: clientSecret,
        scope: "launch openid fhirUser patient/*.read online_access",
        redirectUri,
        iss,
        launch,
        completeInTarget: true,
      })
    })()
  }, [])

  return <p className="p-6 text-sm text-muted-foreground">Launching SMART…</p>
}
