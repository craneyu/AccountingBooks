# 旅遊記帳系統規格說明

## 專案概述

本專案為旅遊記帳應用程式，專為個人及家庭成員使用，不開放商業用途。

### 核心特性

- **使用者認證**：所有使用者需使用 Google Email 登入才能存取系統
- **權限管理**：管理者可管理旅遊主題與使用者，一般使用者僅能記帳
- **主要功能**：選擇旅遊主題、新增/修改/刪除支出資料、查看統計報表

---

## 技術架構

### 前端技術棧

| 技術領域     | 採用技術                        | 版本    |
| ------------ | ------------------------------- | ------- |
| 框架         | Angular (Standalone Components) | 21+     |
| 狀態管理     | Angular Signals                 | 21+     |
| HTTP 客戶端  | Angular HttpClient              | -       |
| UI 框架      | Tailwind CSS                    | 3.4+    |
| CSS 預處理器 | Sass                            | @latest |
| 圖標函式庫   | Font Awesome (Angular)          | 7.x     |
| 對話框元件   | SweetAlert2                     | 11.x    |
| 輪播/相簿    | Swiper.js                       | 12.x    |
| 加解密函式庫 | crypto-js                       | 4.x     |

### 後端服務

| 服務類型 | 採用技術                               |
| -------- | -------------------------------------- |
| 資料庫   | Firebase Firestore                     |
| 認證系統 | Firebase Authentication (Google Email) |
| 檔案儲存 | Firebase Storage                       |
| 網站託管 | Firebase Hosting                       |
| API 通訊 | Firebase SDK                           |
| 匣率 API | ExchangeRate-API 或 Fixer.io           |
| 通訊協定 | HTTPS                                  |

### 開發與部署

- **版本控制**：Git
- **部署平台**：Firebase Hosting
- **套件管理**：npm
- **CI/CD**：GitHub Actions + Firebase CLI

---

## 設計原則

### UI/UX 設計

- **設計風格**：Soft UI Evolution
- **設計理念**：現代化、簡潔、直觀
- **響應式設計**：手機優先（Mobile-First），支援桌面與平板
- **導航結構**：清晰的資訊架構與操作流程
- **無障礙設計**：符合 WCAG 2.1 AA 標準

### 效能目標

- 首次內容繪製（FCP）< 1.8 秒
- 最大內容繪製（LCP）< 2.5 秒
- 累計版面配置位移（CLS）< 0.1
- 首次輸入延遲（FID）< 100 毫秒

---

## 套件安裝指令

```bash
# Tailwind CSS
npm install -D tailwindcss@latest postcss autoprefixer
npx tailwindcss init

# Font Awesome
npm install @fortawesome/angular-fontawesome@latest \
  @fortawesome/fontawesome-svg-core \
  @fortawesome/free-solid-svg-icons \
  @fortawesome/free-brands-svg-icons \
  @fortawesome/free-regular-svg-icons

# SweetAlert2
npm install sweetalert2@latest

# Swiper.js（圖片輪播與相簿功能）
npm install swiper@latest

# crypto-js
npm install crypto-js@latest
npm install -D @types/crypto-js@latest

# Firebase SDK
npm install firebase@latest
npm install @angular/fire@latest

# Firebase CLI（全域安裝）
npm install -g firebase-tools
```

---

## 系統架構

### 使用者流程

```
使用者進入 → Google 登入 → 選擇旅遊主題 → 記帳頁面 ⇄ 報表頁面
                                           ↓
                                    新增/編輯/刪除支出
```

### 管理者流程

```
管理者登入 → 後台管理介面 → 管理旅遊主題 / 管理使用者
                              ↓
                        設定使用者為管理者
```

---

## 功能規格

### 一、管理者功能

#### 1.1 使用者登入頁面

**路由**：`/login`

**功能需求**：

- 使用 Firebase Authentication（Google 帳號）進行身份驗證
- 提供「使用 Google 帳號登入」按鈕
- 首次登入自動建立使用者資料
- 驗證使用者是否在授權清單中
- 登入後依權限導向：
  - 管理者 → 後台管理介面或主題選擇頁
  - 一般使用者 → 主題選擇頁

**安全性需求**：

- 檢查使用者是否存在於 users 集合中
- Session 管理與自動登出機制（30 分鐘無活動）
- HTTPS 加密通訊
- 未授權使用者無法存取系統

#### 1.2 後台管理介面

**路由**：`/admin/dashboard`

**功能模組**：

**A. 旅遊主題管理**

- 新增旅遊主題
- 編輯旅遊主題資訊
- 啟用/停用旅遊主題
- 刪除旅遊主題
- 檢視主題使用統計

**B. 使用者管理**

- 新增使用者（Google Email）
- 編輯使用者資訊
- 設定/取消使用者管理者權限（勾選框）
- 啟用/停用使用者帳號
- 移除使用者
- 檢視使用者列表（顯示姓名、Email、角色、狀態）
- 檢視使用者活動記錄

---

### 二、使用者功能

#### 2.1 主題選擇頁面

**路由**：`/` 或 `/trips`

**權限需求**：需登入

**功能需求**：

- 列出所有已啟用的旅遊主題
- 顯示主題名稱與旅遊日期
- 點擊主題進入該主題的記帳頁面
- 無可用主題時顯示提示訊息
- 顯示目前登入使用者資訊
- 提供登出按鈕
- 管理者可看到「進入後台」按鈕

**UI 設計**：

- 卡片式布局，每個主題一張卡片
- 包含主題圖示、名稱、日期、狀態標籤

#### 2.2 記帳頁面

**路由**：`/trip/:tripId/expenses`

**權限需求**：需登入

**功能需求**：

**A. 支出列表**

- 顯示所有支出紀錄（依日期降序排列）
- 每筆紀錄顯示：日期、項目、金額、支付方式
- 支援篩選與搜尋功能
- 顯示總計金額

**B. 新增支出**

- 表單欄位：
  - 支出項目（必填）
  - 支出日期（必填，預設今日）
  - 支出金額（必填）
  - 幣別（下拉選單，如：JPY, USD, EUR, KRW 等）
  - 折合台幣（自動計算並顯示，也可手動調整）
    - 當輸入支出金額或選擇幣別後，立即呼叫匣率 API
    - 顯示即時匣率與換算結果（例：1 JPY = 0.21 TWD）
    - 顯示匣率更新時間
    - 提供「重新查詢匣率」按鈕
  - 支付類別（下拉選單）
  - 支付方式（下拉選單）
  - 收據圖片（選填，支援上傳）
  - 備註（選填）
- 自動記錄提交者（目前登入使用者）
- 自動記錄當下匣率與匣率查詢時間
- 表單驗證與錯誤提示
- 提交成功提示

**C. 編輯支出**

- 點擊紀錄進入編輯模式
- 表單與新增相同
- 支援取消編輯

**D. 刪除支出**

- 確認對話框（使用 SweetAlert2）
- 刪除成功提示

**E. 查看收據圖片**

- 支援多張圖片上傳與查看
- 使用 **Swiper.js** 實現流暢的圖片瀏覽體驗
- 功能特色：
  - iOS 原生滑動支援（解決觸控問題）
  - 左右導航按鈕
  - 分頁指示器（可點擊）
  - 鍵盤控制（方向鍵、ESC）
  - 響應式設計（手機/平板/桌面）
  - 縮放功能支援
- 點擊圖片圖示開啟相簿
- 顯示圖片數量提示

#### 2.3 報表頁面

**路由**：`/trip/:tripId/reports`

**權限需求**：需登入

**功能需求**：

**A. 支出統計**

- 總支出金額
- 平均每日支出
- 支出天數統計

**B. 圖表分析**

- 依類別統計圓餅圖
- 依支付方式統計圓餅圖
- 每日支出趨勢折線圖
- 支出項目排行榜（長條圖）

**C. 資料匯出**

- 匯出 CSV 格式
- 匯出 PDF 報表

#### 2.4 導航列

**功能需求**：

- 返回主題選擇
- 記帳頁面
- 報表頁面
- 設定頁面
- 顯示目前主題名稱

---

## 資料結構設計

### Firebase Firestore 集合結構

#### Collection: `trips` (旅遊主題)

```typescript
interface Trip {
  id: string; // 文件 ID
  name: string; // 主題名稱
  startDate: Timestamp; // 起始日期
  endDate: Timestamp; // 結束日期
  status: 'active' | 'inactive'; // 狀態
  createdAt: Timestamp; // 建立時間
  createdBy: string; // 建立者 Email
  updatedAt: Timestamp; // 更新時間
  currency: string; // 主要幣別（如：TWD）
  coverImage?: string; // 封面圖片 URL
  description?: string; // 主題描述
}
```

#### Collection: `trips/{tripId}/expenses` (支出紀錄)

```typescript
interface Expense {
  id: string; // 文件 ID
  tripId: string; // 所屬旅遊主題 ID
  item: string; // 支出項目
  expenseDate: Timestamp; // 支出日期
  amount: number; // 支出金額
  currency: string; // 幣別（如：JPY, USD）
  exchangeRate: number; // 匯率（對 TWD）
  exchangeRateTime: Timestamp; // 匯率查詢時間
  amountInTWD: number; // 折合台幣
  category: string; // 支付類別
  paymentMethod: string; // 支付方式
  receiptImageUrl?: string; // 單張收據圖片 URL（向下相容）
  receiptImageUrls?: string[]; // 多張收據圖片 URLs
  note?: string; // 備註
  submittedAt: Timestamp; // 提交時間
  submittedBy: string; // 提交者 UID（必填）
  submittedByName: string; // 提交者顯示名稱
  submittedByEmail: string; // 提交者 Email
  updatedAt: Timestamp; // 更新時間
  updatedBy?: string; // 最後更新者 UID
}
```

#### Collection: `users` (使用者)

```typescript
interface User {
  id: string; // 文件 ID（Firebase UID）
  email: string; // Google Email
  displayName: string; // 顯示名稱
  photoURL?: string; // 大頭照 URL
  isAdmin: boolean; // 是否為管理者
  status: 'active' | 'inactive'; // 帳號狀態
  createdAt: Timestamp; // 建立時間
  createdBy?: string; // 建立者 Email（管理者新增時）
  lastLoginAt: Timestamp; // 最後登入時間
  updatedAt: Timestamp; // 更新時間
}
```

#### Collection: `categories` (支付類別)

```typescript
interface Category {
  id: string; // 文件 ID
  name: string; // 類別名稱（如：餐飲、交通、住宿）
  icon: string; // Font Awesome 圖標名稱
  color: string; // 顏色代碼
  order: number; // 排序
}
```

#### Collection: `paymentMethods` (支付方式)

```typescript
interface PaymentMethod {
  id: string; // 文件 ID
  name: string; // 支付方式名稱（如：現金、信用卡）
  icon: string; // Font Awesome 圖標名稱
  order: number; // 排序
}
```

#### Collection: `exchangeRates` (匣率快取)

```typescript
interface ExchangeRate {
  id: string; // 文件 ID（格式：{currency}_YYYYMMDD）
  baseCurrency: string; // 基準幣別（TWD）
  targetCurrency: string; // 目標幣別（如：JPY, USD）
  rate: number; // 匣率
  date: string; // 日期（YYYY-MM-DD）
  fetchedAt: Timestamp; // 查詢時間
  source: string; // 資料來源（API 名稱）
}
```

---

## 安全性規則

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 使用者認證檢查函式
    function isAuthenticated() {
      return request.auth != null;
    }

    // 授權使用者檢查函式
    function isAuthorizedUser() {
      return isAuthenticated()
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }

    // 管理者檢查函式
    function isAdmin() {
      return isAuthorizedUser()
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // 使用者資料
    match /users/{userId} {
      // 所有已登入使用者可讀取使用者列表（基本資訊）
      allow read: if isAuthorizedUser();
      // 只有管理者可新增、修改、刪除使用者
      allow create, update, delete: if isAdmin();
      // 使用者可更新自己的 lastLoginAt
      allow update: if isAuthenticated() && request.auth.uid == userId
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['lastLoginAt']);
    }

    // 旅遊主題
    match /trips/{tripId} {
      // 授權使用者可讀取啟用的主題
      allow read: if isAuthorizedUser() && (resource.data.status == 'active' || isAdmin());
      // 只有管理者可寫入
      allow write: if isAdmin();

      // 支出紀錄
      match /expenses/{expenseId} {
        // 授權使用者可讀取啟用主題的支出
        allow read: if isAuthorizedUser()
                    && (get(/databases/$(database)/documents/trips/$(tripId)).data.status == 'active' || isAdmin());

        // 授權使用者可新增啟用主題的支出
        allow create: if isAuthorizedUser()
                      && get(/databases/$(database)/documents/trips/$(tripId)).data.status == 'active'
                      && request.resource.data.submittedBy == request.auth.uid;

        // 使用者可修改、刪除自己的支出，管理者可修改、刪除所有支出
        allow update, delete: if isAuthorizedUser()
                              && (resource.data.submittedBy == request.auth.uid || isAdmin());
      }
    }

    // 類別與支付方式
    match /categories/{categoryId} {
      allow read: if isAuthorizedUser();
      allow write: if isAdmin();
    }

    match /paymentMethods/{methodId} {
      allow read: if isAuthorizedUser();
      allow write: if isAdmin();
    }

    // 匣率快取
    match /exchangeRates/{rateId} {
      allow read: if isAuthorizedUser();
      allow write: if isAdmin();  // 系統自動建立，或管理者手動更新
    }
  }
}
```

---

## 開發工作流程

### 階段一：專案初始化（Week 1）

1. 建立 Angular 21+ 專案（Standalone Components）
2. 安裝所有必要套件
3. 設定 Tailwind CSS、Sass、Font Awesome
4. 建立 Firebase 專案並設定 Firestore、Authentication
5. 設定環境變數與 Firebase 配置
6. 建立專案基礎架構（路由、服務、模型）

### 階段二：UI/UX 設計與實作（Week 2-3）

1. 設計配色方案與設計系統
2. 實作共用元件（Header、Footer、導航列、按鈕、表單元件）
3. 實作 Soft UI Evolution
   (Evolved soft UI, better contrast, modern aesthetics, subtle depth, accessibility-focused, improved shadows, hybrid)設計風格
4. 實作響應式布局（手機、平板、桌面）
5. 無障礙設計優化

### 階段三：認證與權限系統開發（Week 4）

1. 實作 Firebase Authentication（Google 登入）串接
2. 開發使用者登入頁面
3. 實作使用者權限檢查與路由守衛
4. 開發後台管理介面
5. 實作旅遊主題 CRUD 功能
6. 實作使用者管理功能（含設定管理者權限）
7. 設定 Firestore 與 Storage Security Rules

### 階段四：使用者功能開發（Week 5-6）

1. 實作主題選擇頁面
2. 開發記帳頁面（支出 CRUD）
3. 實作圖片上傳功能（Firebase Storage）
4. 開發報表頁面（圖表函式庫選擇與整合）
5. 實作資料篩選與搜尋功能
6. 實作資料匯出功能

### 階段五：測試與優化（Week 7）

1. 單元測試（Jasmine + Karma）
2. E2E 測試（Cypress 或 Playwright）
3. 效能優化（Lazy Loading、Code Splitting）
4. 無障礙測試（axe DevTools）
5. 跨瀏覽器測試
6. 行動裝置實測

### 階段六：部署與上線（Week 8）

1. 設定 Firebase Hosting 配置
2. 設定 CI/CD（GitHub Actions + Firebase CLI）
3. 配置 Firebase Storage 規則（收據圖片上傳）
4. 正式環境部署
5. 監控與日誌設定（Firebase Analytics）
6. 使用者文件撰寫

---

## 匯率 API 整合

### 推薦 API 服務

#### 選項 1：ExchangeRate-API（推薦）

- **官網**：https://www.exchangerate-api.com/
- **免費方案**：每月 1,500 次查詢
- **優點**：
  - 不需註冊即可使用基本功能
  - 每日更新匣率
  - 支援 160+ 幣別
  - 簡單的 REST API
  - HTTPS 加密

**API 端點**：

```
https://api.exchangerate-api.com/v4/latest/TWD
```

**回應範例**：

```json
{
  "base": "TWD",
  "date": "2026-01-22",
  "time_last_updated": 1706054401,
  "rates": {
    "USD": 0.0315,
    "JPY": 4.65,
    "EUR": 0.029,
    "KRW": 42.5,
    "CNY": 0.228
  }
}
```

### 實作策略

#### 1. 匣率快取機制

```typescript
class ExchangeRateService {
  // 快取策略：
  // 1. 優先查詢 Firestore 快取（當日資料）
  // 2. 快取不存在或過期，呼叫 API
  // 3. 將新匣率存入 Firestore

  async getExchangeRate(targetCurrency: string): Promise<number> {
    const today = this.getToday(); // YYYY-MM-DD
    const cacheId = `${targetCurrency}_${today.replace(/-/g, '')}`;

    // 步驟 1：檢查快取
    const cached = await this.getCachedRate(cacheId);
    if (cached) {
      return cached.rate;
    }

    // 步驟 2：呼叫 API
    const rate = await this.fetchFromAPI(targetCurrency);

    // 步驟 3：儲存快取
    await this.saveToCache(cacheId, targetCurrency, rate);

    return rate;
  }
}
```

#### 2. 即時換算功能

```typescript
// 在記帳表單中
@Component({...})
export class ExpenseFormComponent {
  amountControl = new FormControl();
  currencyControl = new FormControl('TWD');
  exchangeRate = signal<number>(1);
  amountInTWD = computed(() => {
    const amount = this.amountControl.value || 0;
    const rate = this.exchangeRate();
    return amount * rate;
  });

  constructor(private exchangeRateService: ExchangeRateService) {
    // 監聽金額或幣別變更
    combineLatest([
      this.amountControl.valueChanges,
      this.currencyControl.valueChanges
    ]).pipe(
      debounceTime(300),
      switchMap(([amount, currency]) => {
        if (currency === 'TWD') {
          return of(1);
        }
        return this.exchangeRateService.getExchangeRate(currency);
      })
    ).subscribe(rate => {
      this.exchangeRate.set(rate);
    });
  }
}
```

#### 3. 離線支援

- 快取 7 天內的匣率資料
- API 無法存取時使用最近的匣率
- 提供手動輸入匣率的選項

#### 4. 錯誤處理

```typescript
try {
  const rate = await this.getExchangeRate(currency);
} catch (error) {
  // 1. 嘗試使用昨日匣率
  // 2. 提示使用者手動輸入
  // 3. 記錄錯誤日誌
}
```

### UI/UX 設計

**匣率顯示區域**：

```
┌──────────────────────────┐
│ 支出金額: [1000] JPY       │
│                              │
│ 即時匣率：1 JPY = 0.215 TWD  │
│ 更新時間：2026-01-22 14:30  │
│ [🔄 重新查詢]                │
│                              │
│ 折合台幣: TWD 215          │
│ (可手動調整)                │
└──────────────────────────┘
```

**Loading 狀態**：

- 查詢匣率時顯示 Spinner
- 顯示「正在查詢匣率...」

**錯誤狀態**：

- 顯示錯誤訊息
- 提供手動輸入匣率選項

---

## 圖表函式庫建議

推薦使用以下其中一種：

1. **Chart.js** + ng2-charts
   - 輕量、易用、文件完整
   - 適合基本圖表需求

2. **Apache ECharts** + ngx-echarts
   - 功能強大、客製化程度高
   - 適合複雜視覺化需求

3. **Highcharts** + highcharts-angular
   - 專業級圖表、美觀
   - 商業使用需購買授權

---

## Firebase 配置

### Firebase Hosting 配置檔 (firebase.json)

```json
{
  "hosting": {
    "public": "dist/accounting-books/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      },
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### Firebase Storage 安全規則 (storage.rules)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // 檢查是否為授權使用者
    function isAuthorizedUser() {
      return request.auth != null
        && firestore.exists(/databases/(default)/documents/users/$(request.auth.uid))
        && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.status == 'active';
    }

    // 檢查是否為管理者
    function isAdmin() {
      return isAuthorizedUser()
        && firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }

    // 收據圖片上傳規則
    match /receipts/{tripId}/{fileName} {
      // 允許授權使用者上傳
      allow create: if isAuthorizedUser()
                    && request.resource.size < 5 * 1024 * 1024  // 限制 5MB
                    && request.resource.contentType.matches('image/.*');

      // 允許授權使用者讀取
      allow read: if isAuthorizedUser();

      // 只有管理者可刪除
      allow delete: if isAdmin();
    }

    // 主題封面圖片
    match /covers/{fileName} {
      // 只有管理者可上傳、刪除
      allow write: if isAdmin()
                   && request.resource.size < 2 * 1024 * 1024;  // 限制 2MB

      // 允許授權使用者讀取
      allow read: if isAuthorizedUser();
    }
  }
}
```

### 部署指令

```bash
# 初始化 Firebase 專案
firebase login
firebase init

# 建置 Angular 專案
ng build --configuration production

# 部署到 Firebase Hosting
firebase deploy

# 僅部署 Hosting
firebase deploy --only hosting

# 僅部署 Firestore 規則
firebase deploy --only firestore:rules

# 僅部署 Storage 規則
firebase deploy --only storage
```

### GitHub Actions 自動部署 (.github/workflows/firebase-hosting.yml)

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build -- --configuration production

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-firebase-project-id
```

---

## 版本控制規範

### Git Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 類型**：

- `feat`: 新功能
- `fix`: 修復錯誤
- `docs`: 文件更新
- `style`: 程式碼格式調整
- `refactor`: 重構
- `perf`: 效能優化
- `test`: 測試相關
- `chore`: 建構工具或輔助工具變動

**範例**：

```
feat(expenses): 新增支出記帳表單

- 實作表單驗證
- 整合 Firebase Firestore
- 新增圖片上傳功能

Closes #123
```

---

## 待定事項

- [ ] 確定配色方案（主色、輔助色、中性色）
- [ ] 選擇圖表函式庫
- [x] 決定幣別匯率資料來源（使用 ExchangeRate-API）
- [x] 圖片查看功能優化（已整合 Swiper.js，支援 iOS）
- [ ] 規劃備份與還原機制
- [ ] 多語系支援需求確認
- [ ] 匯率 API 金鑰申請與配置

---

## 更新記錄

### 2026-01-22

- ✅ 整合 Swiper.js 取代自訂圖片滑動功能
- ✅ 優化 iOS 觸控滑動體驗
- ✅ 新增多張收據圖片支援
- ✅ 更新技術棧文件（README.md、SPEC.md）
- ✅ 調整 Sass 樣式匯入方式避免警告
