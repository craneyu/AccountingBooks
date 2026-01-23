# 快速開始指南

## 📋 本文件用途

本指南提供 AccountingBooks 系統改動的快速參考。如需詳細信息，請參考相應的完整文件。

---

## 🚀 立即開始：Phase 1 部署

### 前置準備
```bash
# 1. 確保已安裝 Firebase CLI
firebase --version

# 2. 登入 Firebase
firebase login

# 3. 確認專案設置
firebase use accountingbooks-9fa26
```

### 部署步驟
```bash
# 1. 備份 Firestore（Firebase Console 手動操作）
# 訪問 Cloud Firestore > 資料 > 右上方 ⋮ > 匯出集合

# 2. 部署規則到生產環境
firebase deploy --only firestore:rules,storage

# 3. 驗證規則部署成功
firebase rules:test firestore.rules --database=default

# 4. 執行資料遷移（建立成員記錄）
npx ts-node scripts/migrate-trip-members.ts

# 5. 在 Firebase Console 驗證
# 訪問 Firestore > trips/{tripId}/members
# 應該能看到每個旅程都有一條 owner member 記錄
```

### 驗證功能
```bash
# 1. 啟動開發伺服器
npm start

# 2. 以非 admin 使用者登入
# 3. 嘗試訪問 /admin/dashboard
#    應被重導向至 /trips ✓

# 4. 進入旅程編輯支出
# 5. 點擊成員管理按鈕（👥）
#    應顯示成員列表 ✓

# 6. 作為非成員，嘗試訪問其他旅程
#    應被阻止並看到錯誤訊息 ✓
```

---

## 📁 重要文件位置

### 安全規則
```
firestore.rules              ← Firestore 安全規則
storage.rules               ← Storage 安全規則
firebase.json               ← Firebase 配置
```

### 核心代碼
```
src/app/core/
  ├── guards/admin.guard.ts              ← Admin 路由守衛
  ├── models/trip-member.model.ts        ← 成員資料模型
  ├── services/trip-members.service.ts   ← 成員管理服務
  └── models/currency.model.ts           ← 幣別模型（Phase 2）

src/app/components/
  └── trip-members-dialog/               ← 成員管理 UI

src/app/pages/
  ├── expenses/expenses.ts               ← 支出頁面（修改）
  └── trips/trips.ts                     ← 旅程列表（修改）
```

### 文件
```
PHASE1_DEPLOYMENT.md                ← 部署指南（必讀）
PHASE1_VERIFICATION_CHECKLIST.md    ← 驗收清單（QA 必讀）
PHASE2_DEPLOYMENT.md                ← Phase 2 計劃
IMPLEMENTATION_PROGRESS.md          ← 進度報告
SESSION_SUMMARY.md                  ← 本次會話摘要
```

---

## 🔐 權限模型速查

### 三層角色
```
Owner (所有者)
  ├── 讀取旅程：✓
  ├── 編輯旅程：✓
  ├── 刪除旅程：✓
  ├── 新增支出：✓
  ├── 編輯支出：✓
  ├── 刪除支出：✓
  └── 管理成員：✓

Editor (編輯者)
  ├── 讀取旅程：✓
  ├── 編輯旅程：✗
  ├── 刪除旅程：✗
  ├── 新增支出：✓
  ├── 編輯支出：✓（自己的）或 ✓（所有）
  ├── 刪除支出：✓（自己的）或 ✓（所有）
  └── 管理成員：✗

Viewer (檢視者)
  ├── 讀取旅程：✓
  ├── 編輯旅程：✗
  ├── 刪除旅程：✗
  ├── 新增支出：✗
  ├── 編輯支出：✗（僅自己的）
  ├── 刪除支出：✗（僅自己的）
  └── 管理成員：✗
```

### 路由權限
```
/login              公開
/trips              需身份驗證
/trip/:id/expenses  需身份驗證 + 是成員
/admin/*            需身份驗證 + isAdmin=true
```

---

## 📊 資料遷移說明

### 遷移內容
```
舊資料結構：
  trips/
    ├── createdBy: "user123"
    └── expenses/...

新資料結構：
  trips/
    ├── createdBy: "user123"
    ├── ownerId: "user123"      ← 新增
    ├── memberCount: 1           ← 新增
    ├── members/                 ← 新增 subcollection
    │   └── user123/
    │       ├── userId: "user123"
    │       ├── role: "owner"
    │       ├── displayName: "..."
    │       └── email: "..."
    └── expenses/...
```

### 回滾方法
```bash
# 1. 如遷移失敗，從備份恢復
firebase firestore:delete [path]

# 2. 或恢復整個 Firestore
# 訪問 Firebase Console > Firestore > 重新開啟備份
```

---

## 🛠️ Phase 2 開發指南

### 幣別管理（Priority 1）

#### 已完成
- ✅ Currency 模型和常數
- ✅ CurrencyService（完整 CRUD）

#### 待開發
```bash
# 1. 建立 Admin 組件
ng generate component pages/admin/currencies --standalone

# 2. 新增到路由
# src/app/app.routes.ts 中添加：
// { path: 'admin/currencies', component: CurrenciesComponent }

# 3. 安裝 CDK 拖曳
npm install @angular/cdk

# 4. 實現拖曳排序和 CRUD
# 參考 PHASE2_DEPLOYMENT.md
```

### 時間驗證（Priority 2）
```typescript
// 在 ExpenseDialog 中添加：
const isWithinRange =
  expenseDate >= trip.startDate &&
  expenseDate <= trip.endDate;

// 在 TripDialog 中檢查衝突：
const conflictingExpenses =
  expenses.filter(e => e.date > newEndDate)
```

### 統計圖表（Priority 3）
```bash
# 1. 安裝圖表庫
npm install chart.js ng2-charts

# 2. 建立 StatisticsService
# 3. 建立 StatisticsComponent
# 4. 添加 4 種圖表類型
```

---

## 🧪 測試檢查清單

### Phase 1 測試
```
□ Admin Guard
  □ Admin 可訪問 /admin/dashboard
  □ 非 admin 被重導向至 /trips

□ 成員管理
  □ Owner 可新增成員
  □ Owner 可編輯成員角色
  □ Owner 可移除成員
  □ 非 owner 看不到管理選項

□ 權限控制
  □ Viewer 無法編輯支出
  □ Editor 可編輯支出
  □ Owner 可編輯所有支出
  □ 非成員無法訪問旅程

□ 資料遷移
  □ 所有旅程都有 owner member
  □ ownerId 正確設置
  □ memberCount 正確
```

---

## 📞 常見問題

### Q: 規則部署失敗
**A**: 執行 `firebase rules:test firestore.rules` 檢查語法

### Q: 資料遷移卡住
**A**: 檢查 service-account-key.json 是否存在和有效

### Q: 非 admin 無法查看自己的旅程
**A**: 檢查 Firestore 是否有 trips/{tripId}/members/{userId} 記錄

### Q: 支出無法編輯
**A**: 確認使用者角色為 owner、editor，或是支出提交者

---

## 📚 文件導航

### 給不同角色的文件
```
開發者：
  → PHASE1_DEPLOYMENT.md（如何部署）
  → SESSION_SUMMARY.md（做了什麼）
  → PHASE2_DEPLOYMENT.md（下一步做什麼）

QA/測試人員：
  → PHASE1_VERIFICATION_CHECKLIST.md（測試什麼）
  → PHASE1_IMPLEMENTATION_SUMMARY.md（功能清單）

管理層/決策者：
  → IMPLEMENTATION_PROGRESS.md（進度和里程碑）
  → SESSION_SUMMARY.md（本次成果摘要）

架構師：
  → CLAUDE.md（專案架構）
  → firestore.rules（安全設計）
  → PHASE2_DEPLOYMENT.md（未來計劃）
```

---

## 🎯 下一步行動

### 本週
1. 部署 Phase 1 到 Staging
2. 執行驗收測試
3. 開始 Phase 2.1（幣別管理）開發

### 本月
1. 完成 Phase 2.1
2. 實施 Phase 2.2（時間驗證）
3. 開始 Phase 2.3（統計圖表）

### 下月
1. 完成 Phase 2
2. 開始 Phase 3（匯出、搜尋、通知）

---

## 💡 有用的命令

```bash
# Firebase 相關
firebase emulators:start --only firestore,storage  # 本地開發
firebase deploy --only firestore:rules             # 部署規則
firebase rules:test firestore.rules                # 測試規則
firebase login                                      # 登入

# Angular CLI
npm start                   # 開發伺服器
npm run build              # 生產構建
npm test                   # 運行測試

# 資料遷移
npx ts-node scripts/migrate-trip-members.ts       # 執行遷移

# Git 相關
git log --oneline | head -10   # 查看提交歷史
git status                     # 查看變更
git show 1e29cab              # 查看提交詳情
```

---

## 📖 推薦閱讀順序

**首次部署者**：
1. PHASE1_DEPLOYMENT.md
2. PHASE1_VERIFICATION_CHECKLIST.md
3. 本文件（QUICK_START.md）

**繼續開發者**：
1. SESSION_SUMMARY.md
2. PHASE2_DEPLOYMENT.md
3. 本文件（QUICK_START.md）

**管理層**：
1. IMPLEMENTATION_PROGRESS.md
2. SESSION_SUMMARY.md
3. PHASE2_DEPLOYMENT.md

---

## ✅ 部署檢查清單（最小版）

```
□ Firebase CLI 已安裝
□ 已登入 Firebase
□ Firestore 已備份
□ 規則語法已驗證（firebase rules:test）
□ 規則已部署（firebase deploy）
□ 資料遷移已執行
□ 本地測試通過
□ 驗收清單所有項已檢查
□ 使用者已通知更新
```

---

**更新日期**：2026-01-23
**狀態**：Phase 1 完成，Phase 2 進行中
**下一更新**：2026-02-06（Phase 2 進度檢查）

---

🚀 祝部署順利！如有任何問題，請參考完整文件或相關的 GitHub issue。
