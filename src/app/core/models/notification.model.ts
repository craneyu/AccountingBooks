import { Timestamp } from 'firebase/firestore';

export type NotificationType =
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'trip_member_added'
  | 'trip_member_removed'
  | 'trip_member_role_changed';

export interface Notification {
  id?: string;
  userId: string;              // 接收者
  type: NotificationType;
  tripId: string;
  tripName?: string;           // 反正規化，快速查詢
  relatedId?: string;          // expense id or member id
  relatedName?: string;        // expense item or member name
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
  actionUrl?: string;          // 導航 URL（可選）

  // 操作者資訊
  actorId: string;
  actorName: string;
  actorEmail?: string;
}

export interface NotificationGroup {
  tripId: string;
  tripName: string;
  notifications: Notification[];
  unreadCount: number;
}

export interface NotificationStats {
  totalNotifications: number;
  unreadCount: number;
  notificationsByType: Record<NotificationType, number>;
  notificationsByTrip: Record<string, number>;
}
