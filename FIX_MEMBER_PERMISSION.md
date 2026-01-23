# 成員權限問題修復說明

## 問題描述

使用者在新增成員後，被新增的成員無法訪問旅程，收到錯誤訊息：「無法訪問，權限不足」。

例如：
- Owner 新增成員：`hao615176@gmail.com`
- 新增成功，但 `hao615176@gmail.com` 登入後仍無法查看該旅程

## 根本原因

### 成員新增流程的設計缺陷

當通過 `trip-members-dialog` 新增成員時：

```typescript
// trip-members-dialog.ts:77
const userId = email.replace('@', '_').replace('.', '_');
// hao615176@gmail.com → hao615176_gmail_com
```

**問題**：
1. 使用者被儲存在 `/trips/{tripId}/members/hao615176_gmail_com`（衍生 ID）
2. 當該使用者用 Google 登入時，Firebase Auth 生成的真實 UID 是隨機字符串（如 `vEqBp1qKp9eEqL0N0q1q2q3q4q5`）
3. Firestore 規則檢查 `isTripMember(tripId)` 時，使用真實 UID 查詢，但成員記錄卻儲存在衍生 ID 下
4. 查詢失敗 → 權限檢查失敗 → 無法訪問

## 解決方案

### 自動遷移機制 (AuthService.syncUser)

在 `AuthService` 中新增 `migrateMembersByEmail()` 方法，當使用者首次登入時：

**1. 建立使用者文件**
```
POST /users/{realUID}
{
  email: "hao615176@gmail.com",
  status: "active",
  ...
}
```

**2. 自動遷移成員記錄**
```
檢查所有 trips，尋找按 email 衍生的成員記錄
如果找到 /trips/{tripId}/members/hao615176_gmail_com：
  ├─ 建立新記錄：/trips/{tripId}/members/{realUID}
  └─ 刪除舊記錄：/trips/{tripId}/members/hao615176_gmail_com
```

**3. 權限驗證成功**
```
Firestore 規則檢查：
  ✓ isAuthorizedUser() → 使用者存在且 status='active'
  ✓ isTripMember(tripId) → 查詢 {realUID} 存在
  → 訪問允許
```

## 技術實現

### 修改的檔案

#### 1. `src/app/core/services/auth.service.ts`

新增匯入：
```typescript
import { writeBatch } from 'firebase/firestore';
```

修改 `syncUser()` 方法：
```typescript
// 在建立新使用者後呼叫
await this.migrateMembersByEmail(firebaseUser.uid, firebaseUser.email || '');
```

新增 `migrateMembersByEmail()` 方法：
- 計算衍生 ID：`email.replace('@', '_').replace('.', '_')`
- 遍歷所有 trips
- 若找到衍生 ID 的成員記錄，使用 batch 操作遷移至真實 UID
- 遷移過程是原子操作，確保資料一致性

## 用戶操作流程

### 新增成員（Owner）
```
1. 點擊「成員管理」
2. 輸入新成員 email（如 hao615176@gmail.com）
3. 選擇角色（owner/editor/viewer）
4. 按「新增」
→ 成員暫時儲存在衍生 ID：hao615176_gmail_com
```

### 新成員首次登入
```
1. 訪問 https://accountingbooks-9fa26.web.app
2. 點擊「Google 登入」
3. 系統自動：
   ✓ 建立使用者文件 /users/{realUID}
   ✓ 檢測到衍生 ID 的成員記錄
   ✓ 遷移到真實 UID
4. 重新整理頁面
→ 現在可以訪問旅程
```

## Firestore 規則驗證

旅程成員檢查（firestore.rules:24-26）：
```javascript
function isTripMember(tripId) {
  return exists(/databases/$(database)/documents/trips/$(tripId)/members/$(request.auth.uid));
}
```

此函數現在能正確識別真實 UID 的成員記錄。

## 測試驗證

### 測試步驟
1. Owner（已登入）新增成員 `test@example.com`
2. 使用 `test@example.com` 帳號首次登入
3. 登入完成後，該使用者應能看到旅程列表
4. 點擊旅程應能查看支出記錄

### 預期結果
- ✅ 成員可以讀取旅程資料
- ✅ 根據角色顯示編輯/刪除按鈕
- ✅ 無權限錯誤

## 資料遷移日誌

系統在遷移時會輸出日誌：
```
✓ 遷移成員記錄: hao615176@gmail.com 在 trip abc123 從 hao615176_gmail_com 到 vEqBp1qKp9eEqL0N0q1q2q3q4q5
```

## 補充修復：行程列表權限驗證

### 問題 2：新成員看到其他人的行程

**原因**：
- `TripService.getActiveTrips()` 查詢**所有** active 狀態的行程
- 客戶端沒有在展示前驗證用戶的成員資格
- 雖然 Firestore 規則應該保護數據，但客戶端不應該嘗試取得所有行程

**修復方案**：
在 `TripsComponent` 的行程加載管道中新增成員檢查：

```typescript
trips$ = this.tripService.getActiveTrips().pipe(
  switchMap(trips => {
    const currentUser = this.authService.currentUser();
    if (!trips || !currentUser) return of([]);

    // 對每個行程檢查成員資格
    return Promise.all(
      trips.map(async trip => {
        const isMember = await this.membersService.checkMembership(trip.id, currentUser.id);
        return isMember ? trip : null;
      })
    ).then(results => results.filter((trip): trip is Trip => trip !== null));
  })
);
```

**效果**：
- ✅ 只顯示用戶是成員的行程
- ✅ 無權限的行程被過濾掉
- ✅ 多層防護（客戶端 + Firestore 規則）

## 雙層防護機制總結

| 層級 | 實現位置 | 驗證邏輯 |
|------|---------|---------|
| **服務端** | Firestore 規則 | `isTripMember(tripId)` + `isAuthorizedUser()` |
| **客戶端** | TripsComponent | 對返回的行程逐個檢查成員資格 |

## 部署信息

- **修改日期**：2026-01-23
- **部署版本**：Built on 2026-01-23 (含權限驗證修復)
- **Hosting URL**：https://accountingbooks-9fa26.web.app
