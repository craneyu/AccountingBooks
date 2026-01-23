import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData, doc, updateDoc, deleteDoc, query, where, orderBy, limit } from '@angular/fire/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { Notification, NotificationStats } from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  /**
   * 訂閱當前使用者的通知（實時更新）
   */
  getNotifications(limit_count: number = 50): Observable<Notification[]> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }

    const notificationsRef = collection(this.firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.id),
      orderBy('createdAt', 'desc'),
      limit(limit_count)
    );

    return collectionData(q, { idField: 'id' }) as Observable<Notification[]>;
  }

  /**
   * 取得未讀通知計數
   */
  async getUnreadCount(): Promise<number> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return 0;

    const notificationsRef = collection(this.firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.id),
      where('isRead', '==', false)
    );

    try {
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('取得未讀計數失敗:', error);
      return 0;
    }
  }

  /**
   * 標記通知為已讀
   */
  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(this.firestore, 'notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
  }

  /**
   * 標記所有通知為已讀
   */
  async markAllAsRead(notifications: Notification[]): Promise<void> {
    const unreadNotifications = notifications.filter(n => !n.isRead);
    const promises = unreadNotifications.map(n =>
      updateDoc(doc(this.firestore, 'notifications', n.id!), { isRead: true })
    );
    await Promise.all(promises);
  }

  /**
   * 刪除通知
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const docRef = doc(this.firestore, 'notifications', notificationId);
    await deleteDoc(docRef);
  }

  /**
   * 刪除所有已讀通知
   */
  async deleteAllReadNotifications(): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const notificationsRef = collection(this.firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.id),
      where('isRead', '==', true)
    );

    try {
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(promises);
    } catch (error) {
      console.error('刪除已讀通知失敗:', error);
    }
  }

  /**
   * 刪除指定旅程的所有通知
   */
  async deleteNotificationsByTrip(tripId: string): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const notificationsRef = collection(this.firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.id),
      where('tripId', '==', tripId)
    );

    try {
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(promises);
    } catch (error) {
      console.error('刪除旅程通知失敗:', error);
    }
  }

  /**
   * 取得通知統計
   */
  async getNotificationStats(): Promise<NotificationStats> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      return {
        totalNotifications: 0,
        unreadCount: 0,
        notificationsByType: {} as any,
        notificationsByTrip: {} as any
      };
    }

    try {
      const notificationsRef = collection(this.firestore, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', currentUser.id)
      );

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => doc.data() as Notification);

      const unreadCount = notifications.filter(n => !n.isRead).length;
      const notificationsByType: Record<string, number> = {};
      const notificationsByTrip: Record<string, number> = {};

      notifications.forEach(notification => {
        notificationsByType[notification.type] = (notificationsByType[notification.type] || 0) + 1;
        notificationsByTrip[notification.tripId] = (notificationsByTrip[notification.tripId] || 0) + 1;
      });

      return {
        totalNotifications: notifications.length,
        unreadCount,
        notificationsByType: notificationsByType as any,
        notificationsByTrip
      };
    } catch (error) {
      console.error('取得通知統計失敗:', error);
      return {
        totalNotifications: 0,
        unreadCount: 0,
        notificationsByType: {} as any,
        notificationsByTrip: {} as any
      };
    }
  }

  /**
   * 生成通知訊息
   */
  generateNotificationMessage(type: string, data: Record<string, any>): string {
    const actorName = data['actorName'] || 'someone';

    switch (type) {
      case 'expense_added':
        return `${actorName} 新增了支出項目「${data['expenseItem']}」(${data['amount']} ${data['currency']})`;
      case 'expense_updated':
        return `${actorName} 更新了支出項目「${data['expenseItem']}」`;
      case 'expense_deleted':
        return `${actorName} 刪除了支出項目「${data['expenseItem']}」`;
      case 'trip_member_added':
        return `${data['memberName']} 被加入到旅程中`;
      case 'trip_member_removed':
        return `${data['memberName']} 被移除出旅程`;
      case 'trip_member_role_changed':
        return `${data['memberName']} 的角色已更改為 ${data['newRole']}`;
      default:
        return `${actorName} 對旅程進行了操作`;
    }
  }
}
