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

/**
 * 健康檢查函數
 */
export const healthCheck = functions.https.onRequest(async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
