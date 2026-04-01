## Context

`auth.service.ts` 的 `loginWithGoogle()` 使用 `GoogleAuthProvider` + `signInWithPopup()` 進行 Google 登入。桌面端 Google OAuth 預設顯示帳號選擇器，但手機端會自動選擇最近使用的帳號（single sign-on 行為），導致使用者登出後無法切換帳號。

這是一個單行修正，不涉及架構變動、資料模型、新依賴或安全規則調整。

## Goals / Non-Goals

**Goals:**

- 透過設定 `GoogleAuthProvider.setCustomParameters({ prompt: 'select_account' })` 強制每次觸發 `loginWithGoogle()` 時都顯示 Google 帳號選擇器

**Non-Goals:**

- 不變更認證流程（維持 `signInWithPopup`）
- 不修改 `logout()` 邏輯
- 不撤銷 OAuth token

## Decisions

### 使用 `prompt: 'select_account'` 參數

在 `GoogleAuthProvider` 建立後、呼叫 `signInWithPopup()` 前，加入 `setCustomParameters({ prompt: 'select_account' })`。

**Rationale:** 這是 Google OAuth 2.0 標準參數，專門用於強制顯示帳號選擇器。相較其他替代方案（如 `prompt: 'consent'` 會要求重新授權、`prompt: 'login'` 會要求重新輸入密碼），`select_account` 僅顯示帳號清單，對使用者體驗影響最小。

**替代方案：**
- `signInWithRedirect` — 雖然行動端可能更穩定，但目前 popup 方式運作良好，切換會引入不必要的複雜度與測試負擔
- 登出時呼叫 `google.accounts.id.revoke()` — 會影響使用者在其他網站的 Google 登入狀態，副作用過大

## Risks / Trade-offs

- **[每次登入多一步操作]** → 已登入的 session 不受影響（自動恢復不經過 `loginWithGoogle()`），只有明確登出後重新登入才需要選擇帳號，屬合理預期行為
- **[Google OAuth 行為變更]** → `prompt: 'select_account'` 是 Google OAuth 2.0 正式規格的一部分，穩定性高，風險極低
