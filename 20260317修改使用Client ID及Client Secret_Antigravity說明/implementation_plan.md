# 從網頁 UI 輸入 clientId 和 clientSecret

## 背景

目前 [app/smart/launch/page.tsx](file:///c:/Users/zyj/Downloads/20251212_smart-on-fhir/asus-icd-cm_smartonfhir/app/smart/launch/page.tsx) 的 `clientId` 和 `clientSecret` 是透過 **URL search params** 讀取，並使用硬編碼的 fallback 值。使用者希望能在網頁上直接輸入這兩個值。

## 研究結論

根據 [SMART client-js API 文件](https://docs.smarthealthit.org/client-js/api.html) 和 [GitHub repo](https://github.com/smart-on-fhir/client-js)：

- `FHIR.oauth2.authorize()` 本身**只接受程式傳入的 options 物件**（包括 `clientId`、`clientSecret`）
- **SMART client-js 沒有內建任何 UI 介面**來讓使用者在網頁上輸入 credentials
- 目前的做法（從 URL params 讀取）已經是該 library 支援的標準用法之一

> [!IMPORTANT]
> 要達到「從網頁輸入」的需求，必須**自己建一個表單 UI**，在使用者送出後再呼叫 `authorize()`。

## Proposed Changes

### [Component] SMART Launch Page

#### [MODIFY] [page.tsx](file:///c:/Users/zyj/Downloads/20251212_smart-on-fhir/asus-icd-cm_smartonfhir/app/smart/launch/page.tsx)

將目前的「自動 launch」改為以下流程：

1. **先顯示表單**：包含 `clientId` 和 `clientSecret` 兩個輸入欄位，預填目前的預設值
2. **使用者按下「Launch」按鈕後**，才將值代入 `FHIR.oauth2.authorize()` 執行
3. **保留 URL params 快速啟動**：如果 URL 中已帶 `client_id` 和 `client_secret` 參數，則自動跳過表單直接 launch（向下相容）

具體改動：
- 新增 React state：`clientId`、`clientSecret`、`autoLaunch`（判斷是否走 URL 自動啟動）
- 新增表單 UI（兩個 input + 一個 submit button）
- 將原本 `useEffect` 的 authorize 邏輯搬到 `handleLaunch()` 函數
- `useEffect` 中判斷：若 URL 帶有 `client_id` 參數 → 自動 launch；否則 → 顯示表單

```diff
- // 自動執行 authorize
- useEffect(() => { (async () => { ... authorize() })() }, [])
+ // 有 URL params 時自動 launch，否則顯示表單等使用者輸入
+ const [showForm, setShowForm] = useState(true)
+ const [clientId, setClientId] = useState("cc344727-...")
+ const [clientSecret, setClientSecret] = useState("79f04b56b...")
+
+ useEffect(() => {
+   const url = new URL(window.location.href)
+   if (url.searchParams.has("client_id")) {
+     // URL 已帶 client_id → 自動 launch
+     handleLaunch(url.searchParams.get("client_id")!, ...)
+   }
+ }, [])
+
+ async function handleLaunch(id: string, secret: string) { ... }
+
+ if (showForm) return <form>...</form>
+ return <p>Launching SMART…</p>
```

## Verification Plan

### Manual Verification

1. **本機啟動開發伺服器**：`npm run dev`
2. **測試表單模式**：直接瀏覽 `/smart/launch?iss=YOUR_ISS` （不帶 `client_id`）→ 應顯示表單
3. **測試表單送出**：在表單中輸入 clientId 和 clientSecret 並按 Launch → 應觸發 SMART authorize 流程
4. **測試自動模式**：瀏覽 `/smart/launch?iss=YOUR_ISS&client_id=xxx&client_secret=yyy` → 應跳過表單直接 launch
5. **檢查 console log** 確認 clientId 正確帶入
