# 開發計畫：旅遊記帳系統 (AccountingBooks)

根據 `SPEC.md`，我將為您建置這個旅遊記帳網站。

## 1. 專案架構與技術
*   **前端框架**: Angular (Latest) + Standalone Components + Signals。
    *   **樣式**: Tailwind CSS (Soft UI Evolution 風格 - 更好的對比度、現代美學、微妙的深度) + SCSS。*   **後端服務**: Firebase (Authentication, Firestore, Storage) - *需由您提供 Firebase 設定檔，開發階段將預留設定位置*。
*   **其他套件**: Font Awesome, SweetAlert2, ExchangeRate-API 整合。

## 2. 實作步驟
1.  **專案初始化**: 在當前目錄建立 Angular 專案，並安裝 Tailwind CSS 與相關套件。
2.  **核心設置**:
    *   設定 Firebase (AngularFire)。
    *   實作 `AuthService` (Google 登入)。
    *   實作 `ExchangeRateService` (匯率轉換)。
3.  **UI/UX 設計**:
    *   建立全域 SCSS 變數與 Glassmorphism 樣式類別。
    *   實作共用元件 (Layout, Cards, Loaders)。
4.  **功能開發**:
    *   **登入頁面**: Google 登入整合。
    *   **主題列表**: 顯示與管理旅遊主題。
    *   **記帳功能**: 支出列表、新增/編輯表單 (含即時匯率換算)。
    *   **報表頁面**: 統計圖表 (使用 Chart.js 或 ECharts)。
5.  **管理者功能**: 簡單的使用者與主題管理介面。

## 3. 注意事項
*   由於我無法建立實際的 Firebase 專案，我將會生成 `src/environments/environment.ts` 檔案，請您後續填入您的 Firebase Config。
*   目前 Angular 最新穩定版為 v19 (spec 提及 v21+ 可能是未來目標)，我將使用最新穩定版進行開發。

請問是否同意此計畫？同意請輸入 "Yes" 或直接按 Enter，我將開始執行。