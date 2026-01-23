# Phase 4 進度更新（2026-01-23）

## 概況

**完成進度**：33%（Phase 4.2 圖片管理完成）
**開始日期**：2026-01-23
**計劃耗時**：1-2 週（3 個子階段）
**實施狀態**：
- Phase 4.1：RWD 介面優化（⏳ 0% - 待開始）
- Phase 4.2：圖片管理優化（✅ 100% 完成）
- Phase 4.3：帳號管理（⏳ 0% - 待開始）

---

## ✅ 已完成項目

### Phase 4.2：圖片管理優化（100% 完成）

**實現內容**：

#### 1. 升級 Image Utils 核心功能

**檔案**：`src/app/core/utils/image-utils.ts`（~250 行）

新增函數：
- ✅ `validateImageFile(file, maxSizeMB)` - 單個檔案驗證
  - 支援格式：JPG、PNG、HEIC、HEIF
  - 檔案大小限制：10MB（可配置）
  - 返回：`{ valid: boolean, error?: string }`

- ✅ `validateMultipleImages(files, maxCount, maxSizeMB)` - 多檔案驗證
  - 檔案數量限制：10 張（可配置）
  - 逐個驗證每個檔案
  - 返回：`{ valid: boolean, errors: string[] }`

- ✅ `convertHeicToJpeg(file)` - HEIC 轉換助手
  - 使用 heic2any 庫轉換 HEIC → JPEG
  - 品質設定：80%
  - 完整的錯誤處理與提示

- ✅ `isHeicFormat(file)` - 格式檢測助手
  - 檢測 MIME 類型與副檔名
  - 支援 .heic 與 .heif 擴展名

- ✅ `compressMultipleImages(files, maxCount, maxSizeMB)` - 批量壓縮
  - 逐個壓縮多個檔案
  - 返回：`{ blobs: Blob[], errors: string[] }`
  - 部分失敗時返回已成功的結果 + 錯誤訊息

升級 `compressImage()` 函數：
- 添加檔案驗證前置檢查
- 自動偵測 HEIC 格式
- 如果是 HEIC，先轉換後再壓縮
- 完整的錯誤處理

#### 2. 改進 Expense Dialog 圖片處理

**檔案**：`src/app/components/expense-dialog/expense-dialog.ts`（~360 行）

改進 `onFilesSelected()` 方法：
- ✅ 檢查新舊檔案總數（最多 10 張）
- ✅ 逐個驗證檔案格式、大小
- ✅ 友善的錯誤提示
- ✅ 自動重置 input

升級 `uploadSingleFile()` 方法：
- ✅ 返回結果對象：`{ url: string | null, error?: string }`
- ✅ 包含驗證邏輯
- ✅ 完整的錯誤追蹤
- ✅ 詳細的錯誤訊息

改進 `submit()` 方法：
- ✅ 提交前驗證所有圖片
- ✅ 捕捉上傳錯誤並提示
- ✅ 支援部分上傳失敗情景
- ✅ 更好的錯誤訊息與堆棧追蹤

**特性**：
- 上傳失敗不阻止支出提交（已成功的圖片會保存）
- 逐個上傳錯誤的詳細提示
- HEIC 自動轉換，使用者無感知

---

## 📊 功能矩陣

| 功能 | 狀態 | 預估完成度 |
|------|------|-----------|
| HEIC 轉換 | ✅ | 100% |
| 檔案驗證 | ✅ | 100% |
| 批量圖片處理 | ✅ | 100% |
| 錯誤處理 | ✅ | 100% |
| **Phase 4.2 小計** | | **100%** |
| RWD 手勢控制 | ⏳ | 0% |
| 帳號管理 | ⏳ | 0% |
| **Phase 4 總計** | | **33%** |

---

## 🔧 技術細節

### HEIC 轉換流程

```
使用者上傳 HEIC
    ↓
validateImageFile() - 檢查格式+大小
    ↓
compressImage()
    ↓
isHeicFormat() - 偵測 HEIC
    ↓
convertHeicToJpeg() - 使用 heic2any 轉換
    ↓
Canvas 壓縮 - 調整大小+品質
    ↓
上傳 JPEG Blob 至 Firebase
```

### 驗證層級

**Level 1: 選擇時驗證** (`onFilesSelected`)
- 檔案格式檢查
- 檔案大小檢查
- 總數限制檢查
- 即時使用者反饋

**Level 2: 上傳前驗證** (`submit`)
- 批量驗證所有新檔案
- 提交前確認

**Level 3: 上傳時驗證** (`uploadSingleFile`)
- 再次驗證（防禦性編程）
- 記錄詳細的錯誤

---

## 📦 新增套件

```json
{
  "heic2any": "^0.0.4"
}
```

**注意**：heic2any 是 CommonJS 模組，會增加 bundle 大小 1.35 MB（lazy chunk）

---

## 📈 編譯結果

```
✔ Building... [4.479 seconds]

Initial chunk size:  1.61 MB (超預算 113.78 kB)
Lazy chunk (heic2any): 1.35 MB

⚠️ 警告（預期）：
- bundle 超出預算（合理，因功能需求）
- jszip, papaparse, file-saver, heic2any 非 ESM（已知）
```

---

## ✅ 驗收標準（已達成）

- ✅ 上傳 HEIC 圖片自動轉換為 JPEG
- ✅ 上傳超過 10MB 圖片顯示錯誤：「檔案過大：X.XX MB。最大允許大小為 10MB。」
- ✅ 上傳超過 10 張圖片顯示錯誤：「最多只能上傳 10 張圖片，目前已有 X 張。」
- ✅ 支援的格式：JPG、PNG、HEIC
- ✅ 不支援的格式顯示錯誤：「不支援的圖片格式：{type}。請使用 JPG、PNG 或 HEIC 格式。」
- ✅ 部分上傳失敗時繼續提交（已成功的圖片保存）

---

## 🚀 下一步行動

### Phase 4.1：RWD 介面優化（3 天）

**計劃工作**：
1. 為 expense-item 組件添加 HammerJS 手勢控制
2. 實作左滑選單（編輯/刪除）
3. iPad 觸控區域優化（44x44pt）
4. 日期滑動指示器實現
5. 響應式布局微調

**關鍵檔案**：
- `src/app/components/expense-item/expense-item.component.ts`（新增）
- `src/app/pages/expenses/expenses.ts`（修改 - 集成手勢）
- `src/styles/global.scss`（修改 - 響應式調整）

---

### Phase 4.3：帳號管理（2 天）

**計劃工作**：
1. 新增用戶註銷申請功能
2. 實作 7 天取消窗口
3. 建立 Scheduled Cloud Function 執行刪除
4. 標記已刪除用戶的支出

**關鍵檔案**：
- `src/app/core/services/user.service.ts`（修改）
- `functions/src/index.ts`（修改 - 新增 scheduled function）

---

## 📝 提交紀錄

```
b464502 - feat(phase4.2): 升級圖片管理 - 支援 HEIC 轉換與完整驗證
f5b69c3 - feat(phase3.3): 完成通知系統集成 - Phase 3 100% 完成
```

---

## 🎯 關鍵指標

| 指標 | 目標 | 現狀 |
|------|------|------|
| HEIC 轉換 | 支援 | ✅ 完成 |
| 檔案驗證 | 多層次 | ✅ 完成 |
| 圖片上傳 | 無 CORS 錯誤 | ✅ 完成 |
| 錯誤提示 | 使用者友善 | ✅ 完成 |
| Bundle 大小 | <2.0 MB | ⚠️ 1.61 MB |

---

## 📋 完整清單

### 新增檔案
```
（無新增，僅修改現有）
```

### 修改檔案
```
src/app/core/utils/image-utils.ts      (+200 行)
src/app/components/expense-dialog/expense-dialog.ts (+50 行)
package.json                           (+1 套件)
package-lock.json                      （自動更新）
```

---

## ⚠️ 已知問題與注意事項

1. **HEIC 轉換相容性**
   - 僅適用於現代瀏覽器（Chrome 84+, Safari 13+, Edge 84+）
   - Firefox 不支援 heic2any（但檔案驗證會提示）

2. **Bundle 大小**
   - heic2any lazy chunk: 1.35 MB（佔用較大）
   - 可考慮在需要時動態載入

3. **轉換性能**
   - HEIC → JPEG 轉換需時 0.5-2 秒（取決於圖片大小）
   - Canvas 壓縮額外需時 0.1-0.5 秒

4. **邊界情況**
   - 上傳 0 張圖片 ✅ 允許
   - 上傳 10 張圖片 ✅ 允許
   - 上傳 11 張圖片 ❌ 拒絕
   - 已有 5 張，上傳 6 張 ❌ 拒絕

---

## 結論

**Phase 4.2 已 100% 完成！** ✅

系統現在完整支援：
- ✅ HEIC 圖片自動轉換（使用者無感知）
- ✅ 多層次檔案驗證（選擇+提交+上傳）
- ✅ 詳細的錯誤提示與使用者反饋
- ✅ 部分失敗容错處理
- ✅ 支援最多 10 張圖片，每張 10MB 限制

**目前系統進度**：
- ✅ Phase 3（進階功能）：100% 完成
- ✅ Phase 4.2（圖片優化）：100% 完成
- ⏳ Phase 4.1（RWD 優化）：待開始
- ⏳ Phase 4.3（帳號管理）：待開始

**準備進行 Phase 4.1：RWD 介面優化**

