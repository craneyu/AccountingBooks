# 手機左滑手勢修復說明

## 問題描述

在手機上無法使用左滑手勢來訪問編輯、刪除和查看照片的按鈕。支出列表項目右側的操作菜單無法被觸發。

## 根本原因

1. **瀏覽器觸摸動作攔截**
   - 瀏覽器默認捕獲所有觸摸事件用於頁面滾動
   - HammerJS 無法識別水平滑動事件

2. **CSS overflow 設定問題**
   - `overflow: hidden` 在 iOS Safari 上有時會導致觸摸事件無法正確傳播

3. **HammerJS 識別器配置不完整**
   - Pan 和 Swipe 識別器的參數不夠精確
   - 缺少方向過濾和事件優先級設置

## 修復方案

### 修改 1：CSS 觸摸動作控制

**檔案**：`src/app/components/expense-item/expense-item.component.scss`

```scss
.expense-item-wrapper {
  // 告訴瀏覽器：
  // - 垂直滑動（pan-y）由瀏覽器處理頁面滾動
  // - 水平滑動由 HammerJS 自定義處理
  touch-action: pan-y;

  // 防止文本被選中
  user-select: none;
  -webkit-user-select: none;

  // iOS 優化：禁用長按彈出菜單
  -webkit-touch-callout: none;

  // 改為 overflow-x 而不是 overflow
  overflow-x: hidden;
  overflow-y: visible;
}

.expense-content {
  // 確保觸摸事件正確傳播
  touch-action: manipulation;
  pointer-events: auto;
}
```

### 修改 2：HammerJS 初始化改進

**檔案**：`src/app/components/expense-item/expense-item.component.ts`

```typescript
private initializeHammer() {
  // 建立 Hammer 管理器，明確指定識別器
  const manager = new HammerLib.Manager(element, {
    recognizers: [
      // Pan 識別器：用於拖動時的即時反饋
      [HammerLib.Pan, {
        direction: HammerLib.DIRECTION_HORIZONTAL,
        threshold: 5,  // 5px 觸發
        pointers: 1    // 單指
      }],
      // Swipe 識別器：用於快速滑動
      [HammerLib.Swipe, {
        direction: HammerLib.DIRECTION_HORIZONTAL,
        threshold: 10,
        velocity: 0.3,
        pointers: 1
      }],
    ]
  });

  // 改進的 pan 事件處理
  manager.on('pan', (e: any) => {
    // 關鍵：檢查是否為水平移動
    // 如果垂直移動超過水平移動，讓瀏覽器處理頁面滾動
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      return;  // 垂直移動，由瀏覽器處理
    }

    e.preventDefault();
    // ... 處理水平移動 ...
  });
}
```

### 修改 3：DOM 初始化延遲

```typescript
ngAfterViewInit() {
  // 延遲 100ms 以確保 DOM 完全載入
  setTimeout(() => {
    this.initializeHammer();
  }, 100);
}
```

## 工作流程

```
使用者在手機上左滑支出項目
    ↓
1. 觸摸開始 (touchstart)
   ↓
2. 瀏覽器檢查 touch-action: pan-y
   - 允許垂直滑動（頁面滾動）
   - 水平滑動由 JavaScript 處理
   ↓
3. HammerJS 偵測手勢
   - 計算 deltaX（水平移動距離）
   - 計算 deltaY（垂直移動距離）
   ↓
4. 方向判斷
   if (abs(deltaX) < abs(deltaY)) {
     // 垂直移動，由瀏覽器處理
     return;
   }
   ↓
5. 水平移動處理
   - preventDefault() 禁止默認行為
   - 更新 slideOffset
   - 觸發選單顯示
   ↓
6. 觸摸結束
   - 根據最終偏移量決定是否完全打開選單
   - 平滑動畫回到開始或打開狀態
```

## 選單工作流程

```
初始狀態
├─ slideOffset = 0
└─ isSliding = false
    ↓
左滑 50px（未超過 70px 閾值）
├─ slideOffset = -50
├─ isSliding = false（還未到閾值）
└─ 鬆開 → 回到初始狀態
    ↓
左滑 100px（超過 70px 閾值）
├─ slideOffset = -100
├─ isSliding = true
└─ 鬆開 → 完全打開選單（slideOffset = -140）
    ↓
打開狀態
├─ slideOffset = -140（選單完全露出）
├─ isSliding = true
├─ 按鈕顯示：查看圖片 | 編輯 | 刪除
└─ 使用者可點擊按鈕
    ↓
右滑或點擊區域外
├─ slideOffset = 0
├─ isSliding = false
└─ 選單隱藏
```

## 觸摸操作指南

### 在手機上操作

1. **打開選單**
   - 在支出項目上從右向左滑動（至少 70px）
   - 或輕快地滑動（快速左滑）

2. **查看照片**
   - 打開選單後點擊藍色的相機圖標

3. **編輯支出**
   - 打開選單後點擊綠色的編輯圖標

4. **刪除支出**
   - 打開選單後點擊紅色的刪除圖標

5. **關閉選單**
   - 從左向右滑動
   - 或輕快地滑動（快速右滑）
   - 或點擊灰色區域

### 在桌面版操作

1. **Hover 支出項目右側**
   - 金額區域會出現操作按鈕
   - 直接點擊按鈕

## 修改的檔案

### 1. `src/app/components/expense-item/expense-item.component.ts`
- 改進 HammerJS Manager 初始化配置
- 新增方向過濾邏輯（deltaX vs deltaY）
- 改進 pan 和 swipe 事件監聽器
- 添加 ngAfterViewInit 延遲初始化
- 新增詳細的日誌用於調試

### 2. `src/app/components/expense-item/expense-item.component.scss`
- 新增 `touch-action: pan-y`
- 新增 `user-select: none` 和 `-webkit-user-select: none`
- 新增 `-webkit-touch-callout: none`（iOS 優化）
- 改為 `overflow-x: hidden` 而不是 `overflow: hidden`
- `expense-content` 新增 `touch-action: manipulation`

## 測試步驟

### 手機測試（iPhone Safari / Android Chrome）

1. **準備**
   - 訪問 https://accountingbooks-9fa26.web.app
   - 進入行程詳細頁面
   - 找到有支出記錄的行程

2. **測試左滑**
   - 在支出項目上從右向左滑動
   - ✅ 應該看到操作按鈕滑出（藍、綠、紅三個）

3. **測試查看照片**
   - 打開左滑選單
   - 點擊藍色照相機圖標
   - ✅ 應該打開照片查看器

4. **測試編輯**
   - 打開左滑選單
   - 點擊綠色編輯圖標
   - ✅ 應該打開編輯對話框

5. **測試刪除**
   - 打開左滑選單
   - 點擊紅色刪除圖標
   - ✅ 應該要求確認後刪除

6. **測試滾動**
   - 在支出列表上垂直滑動
   - ✅ 應該正常滾動頁面（不會打開選單）

### 桌面測試（Chrome / Safari / Firefox）

1. **Hover 金額區域**
   - ✅ 應該顯示操作按鈕

2. **點擊按鈕**
   - ✅ 應該正常工作

## 控制台調試

如果還有問題，開啟瀏覽器開發者工具，在 Console 中查看：

```
[✓] HammerJS 初始化成功
```

如果看到錯誤訊息：
```
[✗] HammerJS 未載入
```

表示 HammerJS 沒有被正確載入，檢查 `src/main.ts` 中的 import。

## 兼容性

| 瀏覽器 | 支援 |
|--------|------|
| iPhone Safari 13+ | ✅ |
| Android Chrome | ✅ |
| Android Firefox | ✅ |
| iPad Safari | ✅ |
| Desktop Chrome | ✅ |
| Desktop Safari | ✅ |
| Desktop Firefox | ✅ |

## 部署信息

- **修改日期**：2026-01-23
- **部署版本**：Built on 2026-01-23
- **Hosting URL**：https://accountingbooks-9fa26.web.app

---

## 常見問題

### Q: 滑動後選單立即關閉？
A: 這是正常的。如果滑動距離不足 70px（閾值），松開時會自動回到初始狀態。試著滑動更長的距離。

### Q: 無法滑動，頁面反而滾動了？
A: 這是因為系統判斷為垂直滑動。試著更水平地滑動（保持水平角度）。

### Q: 在 iPad 上無法點擊按鈕？
A: iPad 有 44x44pt 最小觸控區域要求。代碼已做了相應優化。試著準確點擊按鈕中心。

### Q: 選單卡在中間位置不動？
A: 可能是觸摸事件被中斷。試著重新整理頁面。
