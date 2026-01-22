# AccountingBooks 發布操作手冊

本文件說明如何將「旅遊記帳系統」部署至 GitHub 遠端儲存庫以及 Firebase Hosting 正式環境。

---

## 1. 提交變更至 GitHub

當您完成程式碼修改後，請執行以下指令將變更推送到 GitHub。

```bash
# 1. 將所有變更加入暫存區
git add .

# 2. 提交變更並撰寫說明 (請修改引號內的文字)
git commit -m "更新說明：例如新增了某項功能"

# 3. 推送到 GitHub 遠端儲存庫
git push origin main
```

---

## 2. 部署至 Firebase Hosting (正式網址)

要將網站發布到網際網路上，請執行以下流程。

### 第一次執行 (若尚未登入)
```bash
npx firebase login
```
執行後會開啟瀏覽器請您授權登入 Google 帳號。

### 正式發布指令
```bash
# 執行編譯並上傳至 Firebase
npm run build && npx firebase deploy --only hosting
```

**正式環境網址：** [https://accountingbooks-9fa26.web.app](https://accountingbooks-9fa26.web.app)

---

## 3. 重要設定備註

### 圖片上傳 CORS 設定
若更換了新的 Firebase 專案或 Storage Bucket，需執行以下指令以允許從本地上傳圖片：
```bash
gsutil cors set cors.json gs://accountingbooks-9fa26.firebasestorage.app
```

### 開發環境執行
若要在本機進行開發測試，請執行：
```bash
npm start
```
然後在瀏覽器開啟 `http://localhost:4200`。

---

## 4. 檔案說明
- `firebase.json`: Firebase 部署設定檔。
- `.firebaserc`: Firebase 專案別名設定。
- `cors.json`: 跨網域資源共享 (CORS) 設定。
- `package.json`: 專案依賴與腳本定義。
