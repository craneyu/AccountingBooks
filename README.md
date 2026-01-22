# AccountingBooks (PayState)

旅遊記帳應用程式，採用 Soft UI Evolution 設計風格，提供直觀的支出追蹤與統計功能。

## ✨ 主要功能

- **🔐 身份驗證**：Google 帳號登入（Firebase Authentication）
- **🗺️ 旅遊主題管理**：建立與管理多個旅遊行程
- **💰 支出追蹤**：記錄支出並即時貨幣轉換
- **📊 統計報表**：視覺化支出分析與統計
- **📸 收據管理**：上傳收據照片，使用 Swiper.js 流暢查看（支援 iOS 滑動）
- **👥 使用者管理**：管理者可管理使用者權限
- **🎨 現代化設計**：Soft UI Evolution（柔和介面、高對比度、無障礙設計）

## 🚀 快速開始

### 環境需求

- Node.js 18+
- npm 10+
- Firebase 專案

### 安裝與設定

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Create a Firebase project.
   - Enable Authentication (Google Provider).
   - Enable Firestore Database.
   - Copy your Firebase configuration.
   - Open `src/environments/environment.ts` and paste the config:
     ```typescript
     export const environment = {
       production: false,
       firebase: {
         apiKey: '...',
         authDomain: '...',
         projectId: '...',
         storageBucket: '...',
         messagingSenderId: '...',
         appId: '...',
       },
       // ...
     };
     ```

3. **Run Application**

   ```bash
   npm start
   ```

   Navigate to `http://localhost:4200`.

4. **Firestore Indexes**
   - When you access the Trips page, check the browser console.
   - If a composite index is required (e.g., for sorting trips by date), Firebase SDK will print a link.
   - Click the link to create the index automatically.

## 🛠️ 技術棧

### 前端框架

- **Angular 21+** - Standalone Components, Signals
- **TypeScript 5.9+** - 型別安全開發
- **RxJS 7.8** - 響應式程式設計

### UI/UX

- **Tailwind CSS 3.4** - 實用優先的 CSS 框架
- **SCSS** - CSS 預處理器
- **Font Awesome 7** - 圖示函式庫
- **SweetAlert2** - 精美的對話框
- **Swiper 12** - 觸控友善的輪播/相簿元件（iOS 優化）

### 後端服務

- **Firebase Authentication** - Google 登入
- **Cloud Firestore** - NoSQL 資料庫
- **Firebase Storage** - 檔案儲存（收據圖片）
- **Firebase Hosting** - 靜態網站託管

### 開發工具

- **Angular CLI 21** - 專案建構工具
- **Prettier** - 程式碼格式化
- **Firebase Tools** - Firebase CLI

### 外部 API

- **ExchangeRate-API** - 即時匯率查詢

## 📱 功能特色

### 收據圖片查看

使用 **Swiper.js** 提供流暢的圖片瀏覽體驗：

- ✅ iOS 原生滑動支援
- ✅ 左右導航按鈕
- ✅ 分頁指示器
- ✅ 鍵盤控制（方向鍵、ESC）
- ✅ 響應式設計（手機/平板/桌面）
- ✅ 縮放功能支援

### 即時匯率轉換

- 自動查詢並快取匯率
- 顯示匯率更新時間
- 支援手動調整折合金額
- 離線模式使用快取匯率

### 管理者功能

- 使用者權限管理
- 旅遊主題 CRUD
- 類別與支付方式管理
- 系統設定

## 📦 安裝套件清單

```bash
# Angular 核心
npm install @angular/core@^21.1.0 @angular/common@^21.1.0 @angular/forms@^21.1.0

# Firebase
npm install firebase@^11.10.0 @angular/fire@^20.0.1

# UI 元件
npm install sweetalert2@^11.26.17 swiper@^12.0.3

# Font Awesome
npm install @fortawesome/angular-fontawesome@^4.0.0 \
  @fortawesome/fontawesome-svg-core@^7.1.0 \
  @fortawesome/free-solid-svg-icons@^7.1.0 \
  @fortawesome/free-regular-svg-icons@^7.1.0 \
  @fortawesome/free-brands-svg-icons@^7.1.0

# 其他
npm install crypto-js@^4.2.0 rxjs@~7.8.0

# 開發工具
npm install -D tailwindcss@^3.4.17 autoprefixer@^10.4.23 postcss@^8.5.6
npm install -D @types/crypto-js@^4.2.2
npm install -D firebase-tools@^15.3.1
```

## 🔧 專案結構

```
src/
├── app/
│   ├── components/          # 共用元件
│   │   ├── expense-dialog/  # 支出對話框
│   │   ├── trip-dialog/     # 旅遊主題對話框
│   │   ├── user-dialog/     # 使用者對話框
│   │   └── category-dialog/ # 類別對話框
│   ├── core/                # 核心功能
│   │   ├── guards/          # 路由守衛
│   │   ├── models/          # 資料模型
│   │   ├── services/        # 服務層
│   │   └── utils/           # 工具函式
│   ├── layout/              # 版面配置
│   │   └── main-layout/     # 主版面
│   ├── pages/               # 頁面元件
│   │   ├── admin/           # 管理者頁面
│   │   ├── expenses/        # 支出頁面
│   │   ├── login/           # 登入頁面
│   │   └── trips/           # 旅遊主題頁面
│   └── environments/        # 環境設定
├── styles.scss              # 全域樣式
└── index.html               # HTML 入口
```

## 🎨 設計系統

### Soft UI Evolution

本專案採用 Soft UI Evolution 設計語言：

- **柔和陰影**：多層次陰影營造深度感
- **高對比度**：提升可讀性與無障礙性
- **現代美學**：簡潔、直觀的介面
- **響應式設計**：手機優先，跨裝置支援

### 配色方案

```scss
--bg-color: #e0e5ec; // 背景色
--text-color: #2d3748; // 文字色
--primary: #4fd1c5; // 主色調
--surface: #e0e5ec; // 卡片表面
```

## 🚢 部署

### Firebase Hosting

```bash
# 建構生產版本
npm run build

# 部署到 Firebase
firebase deploy

# 僅部署 Hosting
firebase deploy --only hosting
```

### 環境變數設定

在 `src/environments/` 中設定：

```typescript
// environment.ts (開發環境)
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
```

## 📄 授權

本專案僅供個人及家庭使用，不開放商業用途。

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

## 📞 聯絡資訊

如有問題或建議，請透過 GitHub Issues 聯繫。
