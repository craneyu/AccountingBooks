## Problem

部署至正式環境後，所有照片上傳功能（收據圖片、旅程封面、使用者頭像）均失敗，回報權限錯誤（permission denied）。此問題影響所有角色的使用者，使得核心記帳功能無法正常運作。

## Root Cause

`storage.rules` 中存在兩個問題：

### 1. 跨服務語法錯誤（影響所有上傳操作）

Storage Security Rules 中的 `isAuthorizedUser()`、`isSystemAdmin()` 及所有成員角色檢查，使用了 `exists()` 和 `get()` 來存取 Firestore 文件。然而在 Storage Rules 語境中，這兩個函式是針對 Storage 物件操作，不是 Firestore 文件。

錯誤寫法（目前）：
```javascript
exists(/databases/default/documents/users/$(request.auth.uid))
get(/databases/default/documents/users/$(request.auth.uid)).data.status == 'active'
```

正確寫法應使用 `firestore.exists()` / `firestore.get()` 前綴，且路徑中 `default` 須加括號 `(default)`：
```javascript
firestore.exists(/databases/(default)/documents/users/$(request.auth.uid))
firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.status == 'active'
```

此錯誤導致所有依賴使用者驗證或角色檢查的 write/read 規則全部失敗。

### 2. 旅程封面上傳路徑不匹配（影響封面上傳）

`trip-dialog.ts` 上傳封面至 `covers/{timestamp}_{filename}.jpg`，但 `storage.rules` 定義的匹配路徑為 `trip-covers/{tripId}/{allPaths=**}`。差異有二：
- 目錄名不同：程式用 `covers/`，規則定義 `trip-covers/`
- 缺少 `{tripId}` 路徑段：規則需要 tripId 來驗證成員身份

## Proposed Solution

### 修正 storage.rules 跨服務語法

將 `storage.rules` 中所有 `exists()` 改為 `firestore.exists()`、所有 `get()` 改為 `firestore.get()`，並將路徑中的 `/databases/default/documents/` 修正為 `/databases/(default)/documents/`。

受影響的函式與規則：
- `isAuthorizedUser()` — 2 處呼叫（exists + get）
- `isSystemAdmin()` — 1 處呼叫（get）
- `receipts/{tripId}` read 規則 — 1 處（exists）
- `receipts/{tripId}` write 規則 — 2 處（exists + get）
- `trip-covers/{tripId}` read 規則 — 1 處（exists）
- `trip-covers/{tripId}` write 規則 — 2 處（exists + get）

所有角色的讀寫權限邏輯不變，僅修正語法使其能正確存取 Firestore 文件。

### 修正旅程封面上傳路徑

將 `trip-dialog.ts` 中的上傳路徑從 `covers/{timestamp}_{filename}.jpg` 改為 `trip-covers/{tripId}/{timestamp}_{filename}.jpg`，使其符合 `storage.rules` 的匹配規則。

## Non-Goals

- 不修改任何角色權限邏輯（Owner/Editor/Viewer/Admin 的權限維持不變）
- 不修改 Firestore 安全規則（firestore.rules）
- 不修改檔案大小或類型驗證邏輯
- 不新增任何套件

## Success Criteria

- Owner/Editor 角色可成功上傳收據圖片至 `receipts/{tripId}/` 路徑
- Owner 角色可成功上傳旅程封面至 `trip-covers/{tripId}/` 路徑
- 使用者可成功上傳頭像至 `avatars/{userId}/` 路徑
- Viewer 角色仍無法上傳收據圖片（權限邏輯不變）
- 非成員仍無法存取旅程相關檔案
- 部署 storage.rules 後 `npx firebase deploy --only storage` 無報錯

## Impact

- 受影響檔案：
  - `storage.rules` — 修正所有跨服務函式呼叫語法（約 12 處）
  - `src/app/components/trip-dialog/trip-dialog.ts` — 修正封面上傳路徑（1 處）
- 部署需求：需執行 `npx firebase deploy --only storage` 部署修正後的 Storage 安全規則
