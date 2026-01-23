# Phase 2 部署指南：核心功能擴充

## 概述

Phase 2 包括三個主要功能：

1. **幣別管理系統** - 系統幣別 CRUD 和自訂幣別
2. **時間驗證** - 支出日期和旅程日期範圍驗證
3. **統計與圖表** - 多種可視化統計圖表

預計時程：3-4 週

## Phase 2.1：幣別管理系統（3 天）

### 新增檔案

```
src/app/core/models/currency.model.ts          # 幣別資料模型
src/app/core/services/currency.service.ts      # 幣別服務
src/app/pages/admin/currencies/               # 幣別管理後台（待開發）
  ├── currencies.component.ts
  ├── currencies.component.html
  └── currencies.component.scss
```

### 已完成

- ✅ `currency.model.ts` - 包含 8 個系統預設幣別
- ✅ `currency.service.ts` - 完整的幣別 CRUD 操作
  - 自動初始化系統幣別
  - 快取管理
  - 批量排序更新
  - 軟刪除支援

### 待開發

1. **CurrenciesComponent** (管理員後台)
   - 顯示所有幣別列表
   - 拖曳排序功能（使用 @angular/cdk/drag-drop）
   - 新增自訂幣別表單
   - 編輯和刪除功能

2. **集成到 ExpenseDialog**
   - 顯示系統幣別 + 旅程自訂幣別
   - 幣別選擇器下拉選單

3. **集成到 TripDialog**
   - 新增自訂幣別欄位
   - 保存自訂幣別到 Trip.customCurrencies

### 實施步驟

```bash
# 1. 安裝拖曳排序依賴
npm install @angular/cdk

# 2. 建立 CurrenciesComponent
ng generate component pages/admin/currencies --standalone

# 3. 更新路由
# 在 app.routes.ts 中添加 /admin/currencies 路由

# 4. 測試幣別管理
# 訪問 /admin/currencies 進行管理
```

## Phase 2.2：時間驗證（1 天）

### 驗證規則

1. **支出日期驗證**
   ```
   支出日期必須在 trip.startDate 至 trip.endDate 之間
   ```

2. **旅程日期衝突檢查**
   ```
   修改旅程日期時，若現有支出超出新日期範圍：
   - 顯示衝突支出列表
   - 使用 SweetAlert2 確認對話框
   ```

### 修改檔案

- `src/app/components/expense-dialog/expense-dialog.ts`
  - 添加日期範圍驗證
  - 顯示錯誤提示

- `src/app/components/trip-dialog/trip-dialog.ts`
  - 檢查日期衝突
  - 顯示衝突支出
  - 要求使用者確認

### 實施步驟

```typescript
// expense-dialog.ts - 日期驗證
const isWithinRange =
  expenseDate >= trip.startDate &&
  expenseDate <= trip.endDate;

if (!isWithinRange) {
  // 顯示錯誤
}

// trip-dialog.ts - 日期衝突檢查
if (dateRangeChanged) {
  const conflictingExpenses = await this.findConflictingExpenses();
  if (conflictingExpenses.length > 0) {
    // 顯示衝突確認對話框
  }
}
```

## Phase 2.3：統計與圖表（5 天）

### 新增檔案

```
src/app/core/services/statistics.service.ts    # 統計服務（新增）
src/app/pages/expenses/statistics/             # 統計頁面（新增）
  ├── statistics.component.ts
  ├── statistics.component.html
  └── statistics.component.scss
```

### 套件安裝

```bash
npm install chart.js ng2-charts
```

### 統計服務（StatisticsService）

待開發功能：
- 分類支出統計（用於圓餅圖）
- 每日支出統計（用於折線圖）
- 成員支出統計（用於長條圖）
- 支出方式統計（用於長條圖）
- 幣別換算功能

### 圖表類型

#### 1. 圓餅圖 - 支出分類佔比
```
顯示：各分類支出佔總額的百分比
特性：互動式，點擊查看詳細
```

#### 2. 折線圖 - 每日支出趨勢
```
顯示：按日期的支出額變化
特性：RWD 優化，手機版橫向滑動
```

#### 3. 長條圖 - 個人支出佔比
```
顯示：各成員的支出額
特性：排序，篩選
```

#### 4. 長條圖 - 支出方式統計
```
顯示：各支出方式的使用頻率
特性：互動式選擇
```

### 幣別換算功能

```typescript
// 使用者可選擇目標幣別
selectedCurrency: 'TWD' | 'USD' | ...

// 統計會自動換算至該幣別
// 使用 ExchangeRateService 進行轉換
```

### RWD 優化

```html
<!-- 手機版橫向滑動容器 -->
<div class="overflow-x-auto md:overflow-visible">
  <div class="min-w-[600px] md:min-w-auto">
    <canvas ...></canvas>
  </div>
</div>
```

### 實施步驟

```bash
# 1. 安裝圖表庫
npm install chart.js ng2-charts

# 2. 建立 StatisticsService
# - 實現數據聚合邏輯
# - 實現幣別換算

# 3. 建立 StatisticsComponent
# - 使用 ng2-charts 建立圖表
# - 整合幣別選擇器
# - 實現 RWD 設計

# 4. 集成到 ExpensesComponent
# - 添加統計標籤
# - 在需要時顯示統計頁面
```

## 技術細節

### ExchangeRateService 整合

```typescript
// 使用現有的匯率快取
const rate = await this.exchangeRateService.getRate(
  'USD',
  'TWD',
  new Date()
);

const amountInTWD = amount * rate;
```

### 性能考慮

```typescript
// 對大量支出進行採樣
const MAX_DATA_POINTS = 30;
if (expenses.length > MAX_DATA_POINTS) {
  // 使用聚合或採樣
  expenses = this.downsampleExpenses(expenses, MAX_DATA_POINTS);
}
```

### 快取策略

```typescript
// StatisticsService 應快取計算結果
private statisticsCache = new Map();

// 當支出或篩選變更時清空快取
invalidateCache() {
  this.statisticsCache.clear();
}
```

## 驗收標準

### 幣別管理
- [ ] Admin 可 CRUD 系統幣別
- [ ] 拖曳排序功能正常
- [ ] 旅程可新增自訂幣別
- [ ] ExpenseDialog 幣別下拉正確顯示

### 時間驗證
- [ ] 支出日期必須在行程範圍內
- [ ] 修改行程日期時顯示衝突確認

### 統計圖表
- [ ] 所有 4 種圖表顯示正確數據
- [ ] 幣別選擇器功能正常
- [ ] RWD 設計適配各尺寸
- [ ] 互動功能（點擊、懸停）正常

## 部署檢查清單

- [ ] Phase 1 驗收清單所有項目已完成
- [ ] 新增的 npm 套件已安裝
- [ ] CurrencyService 初始化邏輯測試通過
- [ ] 時間驗證邏輯測試通過
- [ ] 統計資料聚合邏輯正確
- [ ] 圖表在各尺寸上正確顯示
- [ ] 性能測試通過（大量支出場景）
- [ ] 無編譯錯誤：`npm run build`

## 後續步驟

### Phase 3（預計 2-3 週）
- 匯出功能（CSV、ZIP）
- 搜尋與篩選
- 通知機制

### 監控指標
- 圖表渲染時間
- API 呼叫次數
- 快取命中率
- 記憶體使用量

## 相關資源

- Chart.js 文檔：https://www.chartjs.org/docs
- ng2-charts 文檔：https://valor-software.com/ng2-charts/
- Angular CDK 拖曳文檔：https://material.angular.io/cdk/drag-drop
- Firebase 複合查詢：https://firebase.google.com/docs/firestore/query-data/queries

---

**版本**：1.0
**預計開始日期**：2026-01-24
**預計完成日期**：2026-02-15
