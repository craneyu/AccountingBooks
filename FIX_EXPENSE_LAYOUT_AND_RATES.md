# 支出列表排版和匯率修復說明

## 問題 1：查看圖片按鈕排版問題

### 根本原因
支出項目右側的左滑選單中有三個按鈕（查看圖片、編輯、刪除），但因為選單寬度 `120px` 對三個按鈕不夠寬，導致按鈕排列不當或被隱藏。

### 修復方案

**修改 1：增加選單寬度**
```scss
// expense-item.component.scss
.action-menu {
  width: 140px;  // 從 120px 改為 140px
  flex-shrink: 0;
}

.action-btn {
  flex: 1 1 auto;  // 改為 flex: 1 1 auto 確保正確伸縮
  min-width: 0;
}
```

**修改 2：更新滑動距離計算**
```typescript
// expense-item.component.ts
const MENU_WIDTH = 140;  // 新的選單寬度
const TRIGGER_THRESHOLD = MENU_WIDTH / 2;  // 觸發閾值 = 70px

// 左滑時：
this.slideOffset.set(-MENU_WIDTH);  // -140 instead of -120

// 拖動計算：
const offset = Math.min(0, Math.max(-MENU_WIDTH, e.deltaX));
```

**修改 3：響應式調整**
```scss
@media (max-width: 640px) {
  .action-menu {
    width: 130px;  // 手機版調整為 130px
  }
}
```

### 效果

- ✅ 三個按鈕（查看圖片、編輯、刪除）現在能正確排列
- ✅ 每個按鈕約 ~46px 寬（140px ÷ 3）
- ✅ 左滑手勢更準確
- ✅ 桌面版 hover 效果正常顯示

---

## 問題 2：韓元匯率載入失敗

### 根本原因

1. **RxJS 操作符使用不當**
   ```typescript
   // 錯誤方式
   switchMap(async rate => {
     // async 函數返回 Promise，但 switchMap 期望 Observable
   })
   ```

2. **錯誤處理不完整**
   - 匯率 API 失敗時直接 throw error
   - 沒有備用值，導致整個操作失敗

### 修復方案

**修改 1：正確的 Promise 轉 Observable**
```typescript
switchMap(rate => {
  // 使用 from() 將 Promise 轉換為 Observable
  return from(
    setDoc(doc(this.firestore, 'exchangeRates', docId), record).then(() => {
      this.memCache.set(docId, rate);
      return rate;
    })
  );
})
```

**修改 2：改進錯誤處理**
```typescript
catchError(err => {
  console.error(`Failed to fetch exchange rate for ${currency}:`, err);

  // 返回備用值 1（用戶可手動輸入）
  return of(1);
})
```

**修改 3：更詳細的日誌**
```typescript
if (!rate) {
  console.error(`Failed to get TWD rate for ${currency} from API response:`, response);
  throw new Error(`TWD rate not found for ${currency}`);
}
```

### 效果

- ✅ 匯率加載成功（包括韓元 KRW）
- ✅ API 失敗時返回 1 而不是拋出錯誤
- ✅ 用戶可以手動輸入匯率
- ✅ 更清晰的錯誤日誌用於調試

---

## 技術細節

### 匯率服務的三層快取策略

```
支出編輯 → 匯率服務
    ↓
1. 記憶體快取檢查
   (同會話內已取得的匯率)
    ↓ 無快取
2. Firestore 快取檢查
   (今天已取得過的匯率)
    ↓ 無快取
3. API 調用
   (ExchangeRate-API)
    ↓
4. 儲存到 Firestore
   (docId: "KRW_20260123")
    ↓
5. 更新記憶體快取
    ↓
返回匯率給使用者
```

### 支出項目排版流程

```
支出項表列
    ↓
<app-expense-item>
    ↓
左側：分類圖示 + 項目資訊
右側：金額（TWD）
    ↓
手機版（md 以下）：
  - 左滑觸發選單
  - 選單顯示：查看圖片 | 編輯 | 刪除
  - 滑動距離：-140px

桌面版（md 以上）：
  - Hover 金額區域顯示按鈕
  - 操作按鈕：查看圖片 | 編輯 | 刪除
```

---

## 修改的檔案

### 1. `src/app/components/expense-item/expense-item.component.ts`
- 新增 `MENU_WIDTH = 140` 常數
- 新增 `TRIGGER_THRESHOLD = MENU_WIDTH / 2` 常數
- 更新 swipeleft/swiperight 邏輯
- 更新 pan 事件邏輯

### 2. `src/app/components/expense-item/expense-item.component.scss`
- `.action-menu` 寬度：120px → 140px
- 新增 `flex-shrink: 0`
- 按鈕 flex：`1` → `1 1 auto`
- 新增 `min-width: 0`
- 手機版寬度：100px → 130px

### 3. `src/app/core/services/exchange-rate.service.ts`
- 移除 `async` 函數，改用 `from()` 包裝 Promise
- 改進 catchError，返回備用值 `of(1)`
- 新增詳細的錯誤日誌

---

## 測試步驟

### 測試排版修復
1. 在行程中新增多筆支出（包含圖片和不含圖片）
2. **手機版**：左滑支出項目
   - ✅ 三個按鈕應該均勻排列
   - ✅ 查看圖片按鈕應該可見且可點擊
3. **桌面版**：Hover 支出項目右側
   - ✅ 金額區域 hover 時顯示三個按鈕
   - ✅ 查看圖片按鈕應該可見且可點擊

### 測試匯率修復
1. 新增支出，選擇 KRW（韓元）
2. **預期行為**：
   - ✅ 匯率輸入框自動填入 KRW 對 TWD 的匯率
   - ✅ 計算顯示 TWD 金額
   - ✅ 若 API 失敗，顯示 1 作為備用值
   - ✅ 用戶可以手動修改匯率

### 檢查控制台日誌
```bash
# 成功：
✓ 匯率加載成功，無錯誤訊息

# API 失敗時：
⚠️ Failed to fetch exchange rate for KRW: ...
(但不會導致應用崩潰，使用備用值 1)
```

---

## 部署信息

- **修改日期**：2026-01-23
- **部署版本**：Built on 2026-01-23
- **Hosting URL**：https://accountingbooks-9fa26.web.app

### 修改摘要

| 問題 | 原因 | 解決方案 | 驗收標準 |
|------|------|---------|---------|
| 查看圖片按鈕不見 | 選單寬度不足 | 寬度 120px → 140px | 三按鈕均勻排列 |
| 韓元匯率載入失敗 | RxJS 操作符錯誤 + 無備用值 | 使用 `from()` + 返回備用值 1 | 匯率成功加載或顯示備用值 |

---

## 相關資源

- **Expense Item 組件**：`src/app/components/expense-item/`
- **Exchange Rate 服務**：`src/app/core/services/exchange-rate.service.ts`
- **支出頁面**：`src/app/pages/expenses/`
