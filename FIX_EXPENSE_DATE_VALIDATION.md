# 支出日期驗證修復說明

## 問題描述

編輯支出時，日期欄位**沒有被限制在行程的日期範圍內**。使用者可以任意選擇超出行程日期範圍的日期。

## 根本原因

### 程式碼檢查

1. **日期驗證邏輯已實作**
   - `expense-dialog.ts` 中有 `tripDateRangeValidator()` 方法
   - 驗證邏輯正確，會檢查日期是否在 `tripStartDate` 和 `tripEndDate` 範圍內

2. **但是日期參數沒有傳入**
   - `expenses.html` 中調用 `app-expense-dialog` 時，只傳入了：
     - `tripId`
     - `tripCurrency`
     - `expense`
   - **缺少**：
     - `tripStartDate` ❌
     - `tripEndDate` ❌

3. **結果**
   - `expense-dialog` 接收不到行程日期
   - 驗證器條件 `if (this.tripStartDate && this.tripEndDate)` 返回 false
   - 驗證器沒有被套用
   - 日期驗證形同虛設

## 修復方案

### 修改 1：傳入日期參數
**檔案**：`src/app/pages/expenses/expenses.html`

```html
<!-- 之前 -->
<app-expense-dialog
  [tripId]="tripId"
  [tripCurrency]="(trip$ | async)?.currency || 'TWD'"
  [expense]="selectedExpense">
</app-expense-dialog>

<!-- 之後 -->
<app-expense-dialog
  [tripId]="tripId"
  [tripCurrency]="(trip$ | async)?.currency || 'TWD'"
  [tripStartDate]="(trip$ | async)?.startDate"      <!-- ✅ 新增 -->
  [tripEndDate]="(trip$ | async)?.endDate"          <!-- ✅ 新增 -->
  [expense]="selectedExpense">
</app-expense-dialog>
```

### 修改 2：顯示驗證錯誤訊息
**檔案**：`src/app/components/expense-dialog/expense-dialog.html`

在日期欄下方新增錯誤提示：

```html
<div>
  <label class="block text-sm font-medium text-text-light mb-1">日期</label>
  <input type="date" formControlName="expenseDate"
         class="soft-input"
         [class.border-danger]="isDateInvalid()">

  <!-- 驗證錯誤提示 -->
  <div class="mt-2 text-sm text-danger font-medium" *ngIf="isDateInvalid()">
    @if (form.get('expenseDate')?.hasError('required')) {
      <p>日期為必填欄位</p>
    } @else if (form.get('expenseDate')?.hasError('dateOutOfRange')) {
      <p>支出日期必須在 {{ dateRangeError()?.start }} 至 {{ dateRangeError()?.end }} 之間</p>
    }
  </div>
</div>
```

### 修改 3：輔助方法
**檔案**：`src/app/components/expense-dialog/expense-dialog.ts`

新增兩個方法：

```typescript
/**
 * 檢查日期欄位是否無效
 */
isDateInvalid(): boolean {
  const control = this.form.get('expenseDate');
  return !!(control && control.invalid && (control.dirty || control.touched));
}

/**
 * 取得日期範圍錯誤的詳細資訊
 */
dateRangeError(): { start: string; end: string } | null {
  const control = this.form.get('expenseDate');
  if (!control || !control.hasError('dateOutOfRange')) {
    return null;
  }
  const error = control.getError('dateOutOfRange');
  return {
    start: error?.start || '',
    end: error?.end || ''
  };
}
```

## 修復效果

### 新增支出
✅ 日期欄位受限於行程日期範圍（起始日期 ~ 結束日期）
✅ 輸入超出範圍的日期時，顯示紅色提示框
✅ 提示訊息：「支出日期必須在 YYYY-MM-DD 至 YYYY-MM-DD 之間」
✅ 提交按鈕禁用直到日期有效

### 編輯支出
✅ 同樣受限於行程日期範圍
✅ 修改日期到無效範圍時，立即顯示驗證錯誤

## 日期驗證流程

```
使用者選擇日期
    ↓
Angular FormControl 監聽變更
    ↓
tripDateRangeValidator() 執行檢查
    ↓
比較：expenseDate vs [tripStartDate, tripEndDate]
    ↓
if (expenseDate < startDate || expenseDate > endDate) {
  return { dateOutOfRange: { start, end } }
}
    ↓
如果無效：
  • HTML class 變為 border-danger（紅色邊框）
  • 錯誤訊息顯示在欄位下方
  • 提交按鈕 disabled
    ↓
使用者修正日期或取消
```

## 測試步驟

1. **新增支出**
   - 打開行程詳細頁面
   - 點擊「新增支出」
   - 嘗試選擇行程開始日期之前的日期
   - 預期：出現紅色提示訊息

2. **編輯支出**
   - 編輯現有支出
   - 修改日期到行程結束日期之後
   - 預期：出現紅色提示訊息

3. **有效日期**
   - 選擇行程日期範圍內的日期
   - 預期：提示消失，提交按鈕啟用

## 部署信息

- **修改日期**：2026-01-23
- **部署版本**：Built on 2026-01-23
- **Hosting URL**：https://accountingbooks-9fa26.web.app

## 相關規範

此修復實現了 PHASE 2.2 中的「時間驗證」需求：

> **2.2 時間驗證（1 天）**
> - Expense Dialog 日期驗證：必須在 `trip.startDate` ~ `trip.endDate` 範圍內
> - Trip Dialog 修改日期時：檢查現有支出衝突，顯示 SweetAlert2 確認框
