## 1. 修正 Google OAuth 帳號選擇行為

- [x] 1.1 在 `src/app/core/services/auth.service.ts` 的 `loginWithGoogle()` 方法中，於 `new GoogleAuthProvider()` 之後加上 `provider.setCustomParameters({ prompt: 'select_account' })`，強制每次登入都顯示帳號選擇器（對應 spec: Google login SHALL always show account selector）

## 2. 驗證

- [x] 2.1 執行 `npx tsc --noEmit` 確認 TypeScript 編譯無錯誤
