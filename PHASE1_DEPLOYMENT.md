# Phase 1 部署指南：安全性與權限基礎

本文件說明如何部署 Phase 1 的所有功能。

## 前置需求

- Firebase 專案已設置
- Firebase CLI 已安裝
- Node.js 16+ 已安裝
- 項目依賴已安裝：`npm install`

## 部署步驟

### 1. 部署 Firestore 和 Storage 規則

#### 步驟 1a：測試規則（在 Emulator 中）

```bash
# 啟動 Firebase Emulator
firebase emulators:start --only firestore,storage

# 在另一個終端進行測試
# 應用將連接到 emulator 進行測試
```

#### 步驟 1b：部署規則到生產環境

```bash
# 確保已登入 Firebase
firebase login

# 部署 Firestore 和 Storage 規則
firebase deploy --only firestore:rules,storage

# 驗證部署成功
firebase rules:test firestore.rules --database=default
```

### 2. 執行資料遷移

**警告**：在執行遷移前，請備份 Firestore 資料庫。

#### 步驟 2a：準備 Firebase Admin SDK 認證

需要一個 Firebase Service Account Key 檔案：

1. 訪問 [Firebase Console](https://console.firebase.google.com)
2. 選擇您的項目
3. 進入 **設置 > 服務帳戶**
4. 點擊 **生成新私密金鑰**
5. 將下載的 JSON 檔案放到項目根目錄，命名為 `service-account-key.json`

```bash
# 將檔案放到項目根目錄
cp /path/to/service-account-key.json ./service-account-key.json
```

#### 步驟 2b：安裝遷移腳本的依賴

```bash
# firebase-admin 已包含在 Cloud Functions 依賴中
npm install --save-dev firebase-admin
```

#### 步驟 2c：執行遷移腳本

```bash
# 編譯 TypeScript 腳本
npx ts-node scripts/migrate-trip-members.ts

# 或使用 npx 直接執行
npx ts-node --project tsconfig.json scripts/migrate-trip-members.ts
```

**預期輸出**：
```
開始資料遷移...

找到 X 個旅程

✓ 已遷移 trip-id-1
✓ 已遷移 trip-id-2
✓ 跳過 trip-id-3（已遷移）

--- 遷移完成 ---
已遷移: X
已跳過: Y
```

### 3. 驗證 Phase 1 功能

#### 步驟 3a：Admin Guard 檢查

1. 以非 admin 使用者身份登入
2. 嘗試訪問 `/admin/dashboard`
3. 應該被重導向至 `/trips`

#### 步驟 3b：成員權限檢查

1. 以旅程 owner 身份登入
2. 訪問旅程詳情
3. 應能看到成員管理按鈕
4. 可新增/移除/更改成員角色

#### 步驟 3c：Firestore 規則驗證

```bash
# 啟動 Emulator 進行規則測試
firebase emulators:start --only firestore

# 在瀏覽器中訪問 Emulator UI：http://localhost:4000
# 測試非成員無法讀取旅程的規則
```

## 回滾計畫

如果部署失敗，可以進行以下操作：

### 回滾規則部署

```bash
# 恢復到上一個版本（如果有版本控制）
git checkout HEAD^ firestore.rules storage.rules
firebase deploy --only firestore:rules,storage
```

### 恢復資料遷移

如果遷移失敗或需要恢復：

1. 從備份恢復 Firestore 資料庫
2. 或手動刪除 `trips/{tripId}/members` 集合中的文件

## 故障排除

### 規則部署失敗

**錯誤**：`Error: PERMISSION_DENIED`

**解決方案**：
- 確保使用的 Firebase 帳戶有適當的權限
- 檢查 `.firebaserc` 中的項目 ID 是否正確
- 驗證規則語法：`firebase rules:test firestore.rules`

### 遷移腳本無法找到 service account

**錯誤**：`找不到 service account key 檔案`

**解決方案**：
- 確保 `service-account-key.json` 放在項目根目錄
- 檢查檔案權限：`chmod 600 service-account-key.json`
- 或使用環境變數：`FIREBASE_CONFIG=./service-account-key.json npx ts-node scripts/migrate-trip-members.ts`

### 成員對話框無法加載

**錯誤**：成員列表為空或顯示錯誤

**解決方案**：
- 驗證 Firestore 規則已部署
- 檢查瀏覽器控制台錯誤信息
- 確認 `TripMembersService` 已正確注入
- 驗證 `trips/{tripId}/members` 集合中有文件

## 環境變數配置

如果使用環境變數進行 Firebase 認證：

```bash
# .env 檔案
FIREBASE_PROJECT_ID=accountingbooks-9fa26
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@accountingbooks-9fa26.iam.gserviceaccount.com
```

然後在遷移腳本中讀取：

```typescript
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL
};
```

## 生產環境檢查清單

部署前：
- [ ] 備份 Firestore 資料庫
- [ ] 在 Staging 環境測試規則
- [ ] 驗證所有現有功能仍可正常運作
- [ ] 檢查 Firestore 索引需求（檢查瀏覽器控制台）

部署後：
- [ ] 驗證 Admin Guard 運作
- [ ] 測試成員管理功能
- [ ] 確認非成員無法查看旅程
- [ ] 監控 Firebase 控制台的規則使用情況
- [ ] 檢查錯誤日誌

## 下一步

Phase 1 完成後，可以進行 Phase 2（核心功能擴充）：

1. 幣別管理系統
2. 時間驗證
3. 統計與圖表

請參考 `PHASE2_DEPLOYMENT.md` 了解詳細信息。

## 支援

如有任何問題，請參考：
- [Firebase 規則文檔](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Admin SDK 文檔](https://firebase.google.com/docs/database/admin/start)
- 項目中的 `CLAUDE.md` 和 `SPEC.md`
