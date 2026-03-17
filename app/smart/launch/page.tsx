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

      // || process.env.NEXT_PUBLIC_SMART_CLIENT_ID
      const clientId = url.searchParams.get("client_id")
        || "cc344727-6f90-496c-94fd-c7829aa9a51d"

      console.log("[SMART] clientId=", clientId)

      const clientSecret = url.searchParams.get("client_secret")
        || "79f04b56b33491716c0880af72cdef7d3f0629111421cedd18353651cd313d9e"

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
