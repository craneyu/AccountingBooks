## 1. 修正 Storage Rules 跨服務 Firestore 語法

- [x] 1.1 在 `storage.rules` 中，將 `isAuthorizedUser()` 函式內的 `exists()` 改為 `firestore.exists()`，`get()` 改為 `firestore.get()`，路徑中的 `/databases/default/documents/` 改為 `/databases/(default)/documents/`（對應 spec: Storage rules SHALL use cross-service Firestore syntax）
- [x] 1.2 在 `storage.rules` 中，將 `isSystemAdmin()` 函式內的 `get()` 改為 `firestore.get()`，路徑修正為 `/databases/(default)/documents/`
- [x] 1.3 在 `storage.rules` 中，修正 `receipts/{tripId}` 的 read 與 write 規則內所有 `exists()` 和 `get()` 呼叫，加上 `firestore.` 前綴並修正路徑格式
- [x] 1.4 在 `storage.rules` 中，修正 `trip-covers/{tripId}` 的 read 與 write 規則內所有 `exists()` 和 `get()` 呼叫，加上 `firestore.` 前綴並修正路徑格式
- [x] 1.5 在 `storage.rules` 中，修正 `avatars/{userId}` 規則區塊內所有跨服務呼叫（如有），確保語法一致

## 2. 修正旅程封面上傳路徑

- [x] 2.1 在 `src/app/components/trip-dialog/trip-dialog.ts` 的 `uploadFile()` 方法中，將上傳路徑從 `covers/${timestamp}_${filename}.jpg` 改為 `trip-covers/${tripId}/${timestamp}_${filename}.jpg`，使路徑匹配 storage.rules 的 `trip-covers/{tripId}/{allPaths=**}` 規則（對應 spec: Trip cover upload path SHALL match storage rules）
- [x] 2.2 重構新建旅程時的封面上傳流程：先建立旅程與 owner member，取得 tripId 後再上傳封面，最後更新旅程的 coverImage 欄位

## 3. 驗證

- [x] 3.1 TypeScript 編譯通過（`tsc --noEmit` 無錯誤）。`npm run build` 因既有的 Tailwind CSS PostCSS 設定問題而失敗，與本次修改無關
- [x] 3.2 已確認 `storage.rules` 中所有 5 處 `firestore.exists()` 和 4 處 `firestore.get()` 的路徑格式皆為 `/databases/(default)/documents/...`，無遺漏
