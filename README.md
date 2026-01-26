# AccountingBooks (分帳軟體)

**AccountingBooks** 是一款專為團體旅遊設計的支出追蹤與分帳應用程式。採用現代化的 **Soft UI Evolution** 設計風格，結合 Angular 與 Firebase 的強大功能，提供直觀、流暢且即時的協作體驗。

## ✨ 主要功能

- **🔐 安全登入**：整合 Firebase Authentication (Google 登入)，確保帳戶安全。
- **🗺️ 旅程管理**：建立多個旅遊行程，邀請朋友加入並共同編輯。
- **👥 成員權限**：精細的角色管理系統 (Owner, Editor, Viewer)，保障資料安全。
- **💰 支出追蹤**：輕鬆記錄每一筆消費，支援自動匯率轉換 (TWD, USD, JPY 等)。
- **📸 收據雲端**：直接上傳收據照片至 Firebase Storage，整合 **Swiper.js** 支援多圖瀏覽、流暢滑動與縮放。
- **📊 統計分析**：透過直觀的圓餅圖與折線圖，即時掌握支出分佈與趨勢。
- **📱 響應式設計**：完美適配手機、平板與桌面裝置。

## 🛠️ 技術棧

本專案採用以下技術構建：

### 前端 (Frontend)
- **Framework**: Angular 19+ (Standalone Components, Signals)
- **Language**: TypeScript 5.9+
- **Styling**: Tailwind CSS 3.4 + SCSS (Soft UI Design)
- **UI Libraries**:
  - `Swiper.js 12` (流暢的收據圖片瀏覽與相簿功能)
  - `SweetAlert2` (精美的互動對話框與圖片彈窗容器)
  - `Hammer.js` (支援行動端清單項目的滑動手勢操作)
  - `Font Awesome` (豐富的系統圖標)
  - `Chart.js` / `ng2-charts` (專業的支出統計圖表)

### 後端與雲端 (Backend & Cloud)
- **Platform**: Firebase
- **Database**: Cloud Firestore (NoSQL, Realtime)
- **Authentication**: Firebase Auth (Google Provider)
- **Storage**: Cloud Storage for Firebase (圖片儲存)
- **Hosting**: Firebase Hosting (靜態網站託管)
- **Functions**: Cloud Functions for Firebase (後端邏輯與觸發器)

## 🚀 快速開始

### 環境需求
- Node.js 18.19.0 或更高版本
- npm 10.x 或更高版本
- Angular CLI (`npm install -g @angular/cli`)

### 安裝步驟

1. **複製專案**
   ```bash
   git clone https://github.com/craneyu/AccountingBooks.git
   cd AccountingBooks
   ```

2. **安裝依賴套件**
   ```bash
   npm install
   # 同時安裝 Cloud Functions 的依賴
   cd functions && npm install && cd ..
   ```

3. **設定環境變數**
   請在 `src/environments/` 目錄下建立 `environment.ts` 與 `environment.prod.ts`，並填入您的 Firebase 設定資訊：
   ```typescript
   export const environment = {
     production: false, // 生產環境請設為 true
     firebase: {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
       messagingSenderId: "...",
       appId: "..."
     }
   };
   ```

4. **啟動開發伺服器**
   ```bash
   npm start
   ```
   瀏覽器將自動開啟 `http://localhost:4200`。

## 🚢 部署指南

本專案已設定為使用 Firebase Hosting 進行部署。

### 部署至生產環境

1. **登入 Firebase**
   ```bash
   npx firebase login
   ```

2. **建置並部署**
   此指令會同時建置 Angular 應用程式並部署 Hosting、Functions、Firestore Rules 與 Indexes。
   ```bash
   npm run build
   npx firebase deploy
   ```

### 僅部署 Hosting (前端更新)
```bash
npm run build
npx firebase deploy --only hosting
```

### 資料庫索引 (Indexes)
若您在開發過程中看到 "The query requires an index" 的錯誤，請點擊錯誤訊息中的連結以自動建立索引，或將 `firestore.indexes.json` 部署至雲端：
```bash
npx firebase deploy --only firestore:indexes
```

## 📂 專案結構

```
src/
├── app/
│   ├── components/      # 共用 UI 元件 (Dialogs, Panels)
│   ├── core/            # 核心服務 (Services, Models, Guards, Utils)
│   ├── layout/          # 版面佈局 (Main Layout)
│   └── pages/           # 頁面路由 (Login, Trips, Expenses, Admin)
├── assets/              # 靜態資源
└── styles.scss          # 全域樣式 (Tailwind imports)
functions/               # Cloud Functions (Backend logic)
firestore.rules          # 資料庫安全規則
storage.rules            # 檔案儲存安全規則
```

## 🤝 貢獻與授權

本專案為個人開發作品，歡迎提交 Issue 或 Pull Request 協助改進。
Licensed under the MIT License.