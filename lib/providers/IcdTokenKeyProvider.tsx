// lib/providers/IcdTokenKeyProvider.tsx
"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

// 預設的 ICD Token Key
const DEFAULT_TOKEN_KEY = "Smart50#2"

type Ctx = {
  tokenKey: string
  setTokenKey: (k: string) => void
  clearTokenKey: () => void
}

const IcdTokenKeyContext = createContext<Ctx | null>(null)

export function IcdTokenKeyProvider({
  children,
  storageKey = "ICD_TOKEN_KEY",
}: {
  children: React.ReactNode
  storageKey?: string
}) {
  const isBrowser = typeof window !== "undefined"

  const store: Storage | null = useMemo(() => {
    if (!isBrowser) return null
    return window.localStorage
  }, [isBrowser])

  // 初始化時先設為預設值
  const [tokenKey, setTokenKeyState] = useState(DEFAULT_TOKEN_KEY)

  useEffect(() => {
    if (!store) return
    try {
      const v = store.getItem(storageKey)
      // 如果 localStorage 有存值就用存的，否則保持預設值
      if (v) setTokenKeyState(v)
    } catch {}
  }, [store, storageKey])

  const setTokenKey = (k: string) => {
    setTokenKeyState(k)
    if (!store) return
    try {
      if (k) store.setItem(storageKey, k)
      else store.removeItem(storageKey)
    } catch {}
  }

  const clearTokenKey = () => {
    setTokenKeyState("")
    if (!store) return
    try {
      store.removeItem(storageKey)
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

