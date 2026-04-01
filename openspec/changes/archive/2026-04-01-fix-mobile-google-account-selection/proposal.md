## Problem

在手機瀏覽器上登出後重新登入時，Google OAuth 自動選擇上次登入的帳號，不顯示帳號選擇器，導致使用者無法切換到其他 Google 帳號。桌面端不受影響，因為桌面版 Google OAuth 預設會顯示帳號選擇器。

## Root Cause

`auth.service.ts` 的 `loginWithGoogle()` 方法中，`GoogleAuthProvider` 沒有設定 `prompt: 'select_account'` 參數：

```typescript
const provider = new GoogleAuthProvider();
// 缺少：provider.setCustomParameters({ prompt: 'select_account' });
```

Google OAuth 的預設行為在手機端會自動選擇最近使用的帳號（single sign-on），跳過帳號選擇畫面。`prompt: 'select_account'` 可強制每次登入都顯示帳號選擇器。

## Proposed Solution

在 `loginWithGoogle()` 中，建立 `GoogleAuthProvider` 後加上 `setCustomParameters({ prompt: 'select_account' })`，強制 Google OAuth 每次都顯示帳號選擇器。

## Non-Goals

- 不改為 `signInWithRedirect`（目前 popup 方式在此專案中運作穩定）
- 不修改 `logout()` 流程（Firebase `signOut()` 的行為正確，問題在登入端）
- 不撤銷 Google OAuth token（那會影響使用者在其他網站的 Google 登入狀態）

## Success Criteria

- 手機瀏覽器上登出後重新登入時，顯示 Google 帳號選擇器
- 使用者可以選擇不同的 Google 帳號登入
- 桌面端行為不受影響（仍正常顯示帳號選擇器）
- 已登入的使用者不受影響（自動恢復 session 不需重新選擇帳號）

## Impact

- 受影響檔案：`src/app/core/services/auth.service.ts`（僅 `loginWithGoogle()` 方法，1 行新增）
