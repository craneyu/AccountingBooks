import * as admin from 'firebase-admin';
import * as path from 'path';

// 初始化 Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '../.firebase/service-account-key.json');

// 根據環境選擇 service account 檔案
let serviceAccount: any;
try {
  // 嘗試從 .firebase 目錄讀取
  serviceAccount = require(serviceAccountPath);
} catch {
  try {
    // 或者從項目根目錄讀取
    serviceAccount = require(path.join(__dirname, '../service-account-key.json'));
  } catch {
    console.error('找不到 service account key 檔案');
    console.error('請確保 Firebase Admin SDK 認證檔案存在');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

const db = admin.firestore();

interface Trip {
  id: string;
  createdBy: string;
  createdAt?: any;
  ownerId?: string;
  memberCount?: number;
  [key: string]: any;
}

interface UserData {
  displayName?: string;
  email?: string;
  [key: string]: any;
}

async function migrateMembers(): Promise<void> {
  console.log('開始資料遷移...\n');

  try {
    // 查詢所有旅程
    const tripsSnapshot = await db.collection('trips').get();
    console.log(`找到 ${tripsSnapshot.size} 個旅程\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const tripDoc of tripsSnapshot.docs) {
      const trip = tripDoc.data() as Trip;
      const tripId = tripDoc.id;

      try {
        // 檢查是否已經遷移
        const membersRef = db.collection(`trips/${tripId}/members`);
        const existingMembers = await membersRef.limit(1).get();

        if (!existingMembers.empty) {
          console.log(`✓ 跳過 ${tripId}（已遷移）`);
          skippedCount++;
          continue;
        }

        // 查詢建立者資訊
        const creatorDoc = await db.collection('users').doc(trip.createdBy).get();
        const creator = creatorDoc.data() as UserData | undefined;

        if (!creator) {
          errors.push(`警告：旅程 ${tripId} 的建立者 ${trip.createdBy} 不存在`);
        }

        // 建立 owner member
        await db.doc(`trips/${tripId}/members/${trip.createdBy}`).set({
          userId: trip.createdBy,
          role: 'owner',
          displayName: creator?.displayName || 'Unknown',
          email: creator?.email || 'unknown@example.com',
          joinedAt: trip.createdAt || admin.firestore.Timestamp.now(),
          addedBy: trip.createdBy,
          updatedAt: admin.firestore.Timestamp.now()
        });

        // 更新 trip
        await tripDoc.ref.update({
          ownerId: trip.createdBy,
          memberCount: 1
        });

        console.log(`✓ 已遷移 ${tripId}`);
        migratedCount++;
      } catch (error) {
        const errorMsg = `✘ 遷移 ${tripId} 失敗: ${error instanceof Error ? error.message : String(error)}`;
        console.log(errorMsg);
        errors.push(errorMsg);
      }
    }

    console.log('\n--- 遷移完成 ---');
    console.log(`已遷移: ${migratedCount}`);
    console.log(`已跳過: ${skippedCount}`);
    if (errors.length > 0) {
      console.log(`\n警告/錯誤 (${errors.length}):`);
      errors.forEach(err => console.log(`  ${err}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('遷移失敗:', error);
    process.exit(1);
  }
}

migrateMembers();
