import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// 初始化 Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// ==================== 支出相關觸發器 ====================

/**
 * 新增支出時建立通知
 */
export const onExpenseCreated = functions.firestore
  .document('trips/{tripId}/expenses/{expenseId}')
  .onCreate(async (snapshot, context) => {
    const expense = snapshot.data() as any;
    const { tripId, expenseId } = context.params;

    try {
      // 取得旅程信息
      const tripDoc = await db.collection('trips').doc(tripId).get();
      const trip = tripDoc.data();

      if (!trip) {
        console.error(`Trip ${tripId} not found`);
        return;
      }

      // 取得旅程成員列表（除了支出者本人）
      const membersSnapshot = await db.collection(`trips/${tripId}/members`).get();
      const members = membersSnapshot.docs
        .map(doc => doc.data())
        .filter(member => member.userId !== expense.submittedBy);

      // 為每個成員建立通知
      const notificationPromises = members.map(member =>
        db.collection('notifications').add({
          userId: member.userId,
          type: 'expense_added',
          tripId: tripId,
          tripName: trip.name,
          relatedId: expenseId,
          relatedName: expense.item,
          message: generateNotificationMessage('expense_added', {
            actorName: expense.submittedByName,
            expenseItem: expense.item,
            amount: expense.amount,
            currency: expense.currency
          }),
          isRead: false,
          createdAt: Timestamp.now(),
          actorId: expense.submittedBy,
          actorName: expense.submittedByName,
          actorEmail: expense.submittedByEmail
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Created notifications for expense ${expenseId}`);
    } catch (error) {
      console.error('Error creating expense notifications:', error);
      throw error;
    }
  });

/**
 * 更新支出時建立通知
 */
export const onExpenseUpdated = functions.firestore
  .document('trips/{tripId}/expenses/{expenseId}')
  .onUpdate(async (change, context) => {
    const expense = change.after.data() as any;
    const { tripId } = context.params;

    try {
      // 取得旅程信息
      const tripDoc = await db.collection('trips').doc(tripId).get();
      const trip = tripDoc.data();

      if (!trip) {
        console.error(`Trip ${tripId} not found`);
        return;
      }

      // 取得旅程成員列表
      const membersSnapshot = await db.collection(`trips/${tripId}/members`).get();
      const members = membersSnapshot.docs
        .map(doc => doc.data())
        .filter(member => member.userId !== expense.submittedBy);

      // 為每個成員建立通知
      const notificationPromises = members.map(member =>
        db.collection('notifications').add({
          userId: member.userId,
          type: 'expense_updated',
          tripId: tripId,
          tripName: trip.name,
          relatedId: change.after.id,
          relatedName: expense.item,
          message: generateNotificationMessage('expense_updated', {
            actorName: expense.submittedByName,
            expenseItem: expense.item
          }),
          isRead: false,
          createdAt: Timestamp.now(),
          actorId: expense.submittedBy,
          actorName: expense.submittedByName,
          actorEmail: expense.submittedByEmail
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Created update notifications for expense ${change.after.id}`);
    } catch (error) {
      console.error('Error creating expense update notifications:', error);
      throw error;
    }
  });

/**
 * 刪除支出時建立通知
 */
export const onExpenseDeleted = functions.firestore
  .document('trips/{tripId}/expenses/{expenseId}')
  .onDelete(async (snapshot, context) => {
    const expense = snapshot.data() as any;
    const { tripId, expenseId } = context.params;

    try {
      // 取得旅程信息
      const tripDoc = await db.collection('trips').doc(tripId).get();
      const trip = tripDoc.data();

      if (!trip) {
        console.error(`Trip ${tripId} not found`);
        return;
      }

      // 取得旅程成員列表
      const membersSnapshot = await db.collection(`trips/${tripId}/members`).get();
      const members = membersSnapshot.docs
        .map(doc => doc.data())
        .filter(member => member.userId !== expense.submittedBy);

      // 為每個成員建立通知
      const notificationPromises = members.map(member =>
        db.collection('notifications').add({
          userId: member.userId,
          type: 'expense_deleted',
          tripId: tripId,
          tripName: trip.name,
          relatedId: expenseId,
          relatedName: expense.item,
          message: generateNotificationMessage('expense_deleted', {
            actorName: expense.submittedByName,
            expenseItem: expense.item
          }),
          isRead: false,
          createdAt: Timestamp.now(),
          actorId: expense.submittedBy,
          actorName: expense.submittedByName,
          actorEmail: expense.submittedByEmail
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Created delete notifications for expense ${expenseId}`);
    } catch (error) {
      console.error('Error creating expense delete notifications:', error);
      throw error;
    }
  });

// ==================== 成員相關觸發器 ====================

/**
 * 新增成員時建立通知
 */
export const onMemberAdded = functions.firestore
  .document('trips/{tripId}/members/{memberId}')
  .onCreate(async (snapshot, context) => {
    const member = snapshot.data() as any;
    const { tripId, memberId } = context.params;

    // 如果是建立者本人，不發送通知
    if (member.userId === member.addedBy) {
      console.log(`Member ${memberId} is the creator, skipping notification`);
      return;
    }

    try {
      // 取得旅程信息
      const tripDoc = await db.collection('trips').doc(tripId).get();
      const trip = tripDoc.data();

      if (!trip) {
        console.error(`Trip ${tripId} not found`);
        return;
      }

      // 取得操作者信息
      const operatorDoc = await db.collection('users').doc(member.addedBy).get();
      const operator = operatorDoc.data();

      // 為新成員建立通知
      await db.collection('notifications').add({
        userId: member.userId,
        type: 'trip_member_added',
        tripId: tripId,
        tripName: trip.name,
        relatedId: memberId,
        relatedName: member.displayName,
        message: generateNotificationMessage('trip_member_added', {
          memberName: member.displayName,
          tripName: trip.name
        }),
        isRead: false,
        createdAt: Timestamp.now(),
        actorId: member.addedBy,
        actorName: operator?.displayName || 'Someone',
        actorEmail: operator?.email
      });

      console.log(`Created notification for member ${memberId} added to trip ${tripId}`);
    } catch (error) {
      console.error('Error creating member added notification:', error);
      throw error;
    }
  });

/**
 * 移除成員時建立通知（給其他成員）
 */
export const onMemberRemoved = functions.firestore
  .document('trips/{tripId}/members/{memberId}')
  .onDelete(async (snapshot, context) => {
    const member = snapshot.data() as any;
    const { tripId, memberId } = context.params;

    try {
      // 取得旅程信息
      const tripDoc = await db.collection('trips').doc(tripId).get();
      const trip = tripDoc.data();

      if (!trip) {
        console.error(`Trip ${tripId} not found`);
        return;
      }

      // 取得所有其他成員
      const membersSnapshot = await db.collection(`trips/${tripId}/members`).get();
      const otherMembers = membersSnapshot.docs
        .map(doc => doc.data())
        .filter(m => m.userId !== member.userId);

      // 為其他成員建立通知
      const notificationPromises = otherMembers.map(otherMember =>
        db.collection('notifications').add({
          userId: otherMember.userId,
          type: 'trip_member_removed',
          tripId: tripId,
          tripName: trip.name,
          relatedId: memberId,
          relatedName: member.displayName,
          message: generateNotificationMessage('trip_member_removed', {
            memberName: member.displayName
          }),
          isRead: false,
          createdAt: Timestamp.now(),
          actorId: 'system', // 可能由 owner 或 system 移除
          actorName: 'System'
        })
      );

      await Promise.all(notificationPromises);
      console.log(`Created notifications for member ${memberId} removed from trip ${tripId}`);
    } catch (error) {
      console.error('Error creating member removed notification:', error);
      throw error;
    }
  });

// ==================== 輔助函數 ====================

/**
 * 生成通知訊息
 */
function generateNotificationMessage(type: string, data: Record<string, any>): string {
  const actorName = data['actorName'] || 'Someone';

  switch (type) {
    case 'expense_added':
      return `${actorName} 新增了支出項目「${data['expenseItem']}」(${data['amount']} ${data['currency']})`;
    case 'expense_updated':
      return `${actorName} 更新了支出項目「${data['expenseItem']}」`;
    case 'expense_deleted':
      return `${actorName} 刪除了支出項目「${data['expenseItem']}」`;
    case 'trip_member_added':
      return `${data['memberName']} 已被加入到「${data['tripName']}」旅程`;
    case 'trip_member_removed':
      return `${data['memberName']} 已被移除出旅程`;
    case 'trip_member_role_changed':
      return `${data['memberName']} 的角色已更改為 ${data['newRole']}`;
    default:
      return `${actorName} 對旅程進行了操作`;
  }
}

// ==================== 帳號管理觸發器 ====================

/**
 * 每日執行：清理已刪除申請超過 7 天的帳號
 * 執行時間：每天凌晨 0 點 UTC
 */
export const cleanupDeletedAccounts = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      // 查詢所有 deleteRequestedAt 在 7 天前以上的使用者
      const usersSnapshot = await db.collection('users')
        .where('deleteRequestedAt', '<=', Timestamp.fromDate(sevenDaysAgo))
        .where('status', '==', 'inactive')
        .get();

      console.log(`找到 ${usersSnapshot.docs.length} 個待刪除帳號`);

      let deletedCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();

        try {
          // 1. 標記該使用者的所有支出為已刪除
          await markUserExpensesAsDeleted(userId);

          // 2. 標記使用者為已刪除
          await db.collection('users').doc(userId).update({
            deletedAt: Timestamp.now(),
            displayName: '已註銷使用者'
          });

          // 3. 從 Firebase Auth 中刪除使用者（可選，取決於是否需要保留帳戶記錄）
          // 注意：這需要 admin SDK 的 auth() 方法
          // 為了保持審計日誌，我們暫時不刪除 Auth 帳戶

          console.log(`✓ 已刪除帳號: ${userId}`);
          deletedCount++;
        } catch (error) {
          console.error(`✗ 刪除帳號 ${userId} 失敗:`, error);
        }
      }

      console.log(`清理完成：共刪除 ${deletedCount} 個帳號`);
      return { processed: usersSnapshot.docs.length, deleted: deletedCount };
    } catch (error) {
      console.error('帳號清理失敗:', error);
      throw error;
    }
  });

/**
 * 標記使用者的所有支出為已刪除
 */
async function markUserExpensesAsDeleted(userId: string): Promise<void> {
  try {
    // 查詢所有包含該使用者支出的旅程
    const tripsSnapshot = await db.collection('trips').get();

    for (const tripDoc of tripsSnapshot.docs) {
      const tripId = tripDoc.id;

      // 查詢該旅程中該使用者的所有支出
      const expensesSnapshot = await db
        .collection(`trips/${tripId}/expenses`)
        .where('submittedBy', '==', userId)
        .get();

      // 批量更新為已刪除使用者
      if (expensesSnapshot.docs.length > 0) {
        const batch = db.batch();

        expensesSnapshot.docs.forEach((expenseDoc) => {
          batch.update(expenseDoc.ref, {
            isDeletedUser: true,
            submittedByName: '已註銷使用者'
          });
        });

        await batch.commit();
        console.log(`  - 標記 ${expensesSnapshot.docs.length} 筆支出為已刪除使用者（旅程: ${tripId}）`);
      }
    }
  } catch (error) {
    console.error('標記使用者支出失敗:', error);
    throw error;
  }
}

/**
 * 同步所有使用者的 photoURL 從 Firebase Auth
 * 允許管理員調用來更新所有使用者的頭像資訊
 */
export const syncAllUsersPhotoURL = functions.https.onCall(async (data, context) => {
  // 檢查是否認證
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '未認證');
  }

  // 檢查是否為管理員
  const adminUserDoc = await db.collection('users').doc(context.auth.uid).get();
  const adminUser = adminUserDoc.data() as any;
  if (!adminUser?.isAdmin) {
    throw new functions.https.HttpsError('permission-denied', '只有管理員可以執行此操作');
  }

  try {
    const auth = admin.auth();
    const usersSnapshot = await db.collection('users').get();

    let updated = 0;
    let skipped = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data() as any;

      try {
        // 從 Firebase Auth 取得使用者資訊
        const authUser = await auth.getUser(userId);

        // 如果 Auth 中有 photoURL，更新 Firestore
        if (authUser.photoURL) {
          await db.collection('users').doc(userId).update({
            photoURL: authUser.photoURL,
            displayName: authUser.displayName || userData.displayName,
            updatedAt: Timestamp.now()
          });
          updated++;
          console.log(`✓ 同步使用者 ${userId}: ${authUser.displayName}`);
        } else {
          // Auth 中沒有 photoURL，保持不變
          skipped++;
        }
      } catch (error) {
        console.warn(`⚠ 無法同步使用者 ${userId}:`, error);
        skipped++;
      }
    }

    return {
      success: true,
      total: usersSnapshot.docs.length,
      updated,
      skipped,
      message: `同步完成：更新 ${updated} 個使用者，跳過 ${skipped} 個`
    };
  } catch (error) {
    console.error('同步使用者 photoURL 失敗:', error);
    throw new functions.https.HttpsError('internal', '同步失敗');
  }
});

/**
 * 每日執行：自動同步所有使用者的 photoURL
 * 執行時間：每天 UTC 時間 01:00
 */
export const dailySyncUsersPhotoURL = functions.pubsub
  .schedule('0 1 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const auth = admin.auth();
      const usersSnapshot = await db.collection('users').get();

      let updated = 0;
      let skipped = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data() as any;

        try {
          // 從 Firebase Auth 取得使用者資訊
          const authUser = await auth.getUser(userId);

          // 如果 Auth 中有 photoURL 且 Firestore 中沒有或不同，則更新
          if (authUser.photoURL && authUser.photoURL !== userData.photoURL) {
            await db.collection('users').doc(userId).update({
              photoURL: authUser.photoURL,
              displayName: authUser.displayName || userData.displayName,
              updatedAt: Timestamp.now()
            });
            updated++;
            console.log(`✓ 同步使用者 ${userId}: ${authUser.displayName}`);
          } else {
            skipped++;
          }
        } catch (error) {
          console.warn(`⚠ 無法同步使用者 ${userId}:`, error);
          skipped++;
        }
      }

      console.log(`✓ 每日同步完成：更新 ${updated} 個使用者，跳過 ${skipped} 個`);
      return { success: true, updated, skipped };
    } catch (error) {
      console.error('每日同步使用者 photoURL 失敗:', error);
      throw error;
    }
  });

/**
 * 健康檢查函數
 */
export const healthCheck = functions.https.onRequest(async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
