// lib/providers/IcdTokenKeyProvider.tsx
"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

// 預設的 ICD Token Key
const DEFAULT_TOKEN_KEY = "OpenTest@Smart50"

type Ctx = {
  tokenKey: string
  setTokenKey: (k: string) => void
  clearTokenKey: () => void
}

const IcdTokenKeyContext = createContext<Ctx | null>(null)

// Cookie 工具函數
// 設定 Cookie (名稱, 值, 存活小時數)
function setCookie(name: string, value: string, hours: number) {
  const maxAge = hours * 60 * 60 // 把小時換算成秒
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/`
}

function getCookie(name: string): string | null {
  const nameEQ = `${name}=`
  const cookies = document.cookie.split(';')
  for (let c of cookies) {
    c = c.trim()
    if (c.startsWith(nameEQ)) {
      return decodeURIComponent(c.substring(nameEQ.length))
    }
  }
  return null
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`
}

export function IcdTokenKeyProvider({
  children,
  storageKey = "ICD_TOKEN_KEY",
}: {
  children: React.ReactNode
  storageKey?: string
}) {
  const isBrowser = typeof window !== "undefined"

  // 初始化時先設為預設值
  const [tokenKey, setTokenKeyState] = useState(DEFAULT_TOKEN_KEY)

  useEffect(() => {
    if (!isBrowser) return
    try {
      const v = getCookie(storageKey)
      // 如果 Cookie 有存值就用存的，否則保持預設值
      if (v) setTokenKeyState(v)
    } catch {}
  }, [isBrowser, storageKey])

  const setTokenKey = (k: string) => {
    setTokenKeyState(k)
    if (!isBrowser) return
    try {
      if (k) {
        // 儲存到 Cookie，有效期 2 小時
        setCookie(storageKey, k, 2)
      } else {
        deleteCookie(storageKey)
      }
    } catch {}
  }

  const clearTokenKey = () => {
    // 回到預設值
    setTokenKeyState(DEFAULT_TOKEN_KEY)
    if (!isBrowser) return
    try {
      deleteCookie(storageKey)
    } catch {}
  }

  const value = useMemo(() => ({ tokenKey, setTokenKey, clearTokenKey }), [tokenKey])

  return <IcdTokenKeyContext.Provider value={value}>{children}</IcdTokenKeyContext.Provider>
}

export function useIcdTokenKey() {
  const ctx = useContext(IcdTokenKeyContext)
  if (!ctx) throw new Error("useIcdTokenKey must be used inside <IcdTokenKeyProvider>")
  return ctx
}

export { DEFAULT_TOKEN_KEY }

