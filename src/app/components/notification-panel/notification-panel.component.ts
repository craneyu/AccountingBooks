import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faCheckDouble, faTrash, faBell } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './notification-panel.component.html',
  styleUrl: './notification-panel.component.scss'
})
export class NotificationPanelComponent implements OnInit {
  @Input() notifications: Notification[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() notificationRead = new EventEmitter<string>();
  @Output() notificationDeleted = new EventEmitter<string>();

  private notificationService = inject(NotificationService);

  loading = signal(false);
  deletingId = signal<string | null>(null);

  faTimes = faTimes;
  faCheckDouble = faCheckDouble;
  faTrash = faTrash;
  faBell = faBell;

  unreadCount = signal(0);
  hasReadNotifications = signal(false);

  ngOnInit() {
    this.updateUnreadCount();
  }

  ngOnChanges() {
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    this.unreadCount.set(this.notifications.filter(n => !n.isRead).length);
    this.hasReadNotifications.set(this.notifications.some(n => n.isRead));
  }

  async markAsRead(notification: Notification) {
    if (notification.isRead) return;

    try {
      await this.notificationService.markAsRead(notification.id!);
      this.notificationRead.emit(notification.id!);
    } catch (error) {
      console.error('標記為已讀失敗:', error);
      Swal.fire('錯誤', '無法標記通知為已讀', 'error');
    }
  }

  async markAllAsRead() {
    if (this.unreadCount() === 0) return;

    try {
      this.loading.set(true);
      await this.notificationService.markAllAsRead(this.notifications);
      this.notifications.forEach(n => {
        if (!n.isRead) {
          this.notificationRead.emit(n.id!);
        }
      });
    } catch (error) {
      console.error('標記全部為已讀失敗:', error);
      Swal.fire('錯誤', '無法標記通知為已讀', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteNotification(notification: Notification) {
    const result = await Swal.fire({
      title: '刪除通知',
      text: '確定要刪除此通知嗎？',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
      confirmButtonColor: '#ef4444'
    });

    if (!result.isConfirmed) return;

    this.deletingId.set(notification.id!);
    try {
      await this.notificationService.deleteNotification(notification.id!);
      this.notificationDeleted.emit(notification.id!);
    } catch (error) {
      console.error('刪除通知失敗:', error);
      Swal.fire('錯誤', '無法刪除通知', 'error');
    } finally {
      this.deletingId.set(null);
    }
  }

  async deleteAllReadNotifications() {
    const readCount = this.notifications.filter(n => n.isRead).length;
    if (readCount === 0) {
      Swal.fire('提示', '沒有已讀通知可以刪除', 'info');
      return;
    }

    const result = await Swal.fire({
      title: '刪除已讀通知',
      text: `確定要刪除 ${readCount} 個已讀通知嗎？`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
      confirmButtonColor: '#ef4444'
    });

    if (!result.isConfirmed) return;

    this.loading.set(true);
    try {
      await this.notificationService.deleteAllReadNotifications();
      this.notifications
        .filter(n => n.isRead)
        .forEach(n => this.notificationDeleted.emit(n.id!));
    } catch (error) {
      console.error('刪除已讀通知失敗:', error);
      Swal.fire('錯誤', '無法刪除已讀通知', 'error');
    } finally {
      this.loading.set(false);
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'expense_added':
        return '➕';
      case 'expense_updated':
        return '✏️';
      case 'expense_deleted':
        return '🗑️';
      case 'trip_member_added':
        return '👤';
      case 'trip_member_removed':
        return '👥';
      case 'trip_member_role_changed':
        return '⚙️';
      default:
        return '📌';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'expense_added':
        return 'border-l-green-500 bg-green-50';
      case 'expense_updated':
        return 'border-l-blue-500 bg-blue-50';
      case 'expense_deleted':
        return 'border-l-red-500 bg-red-50';
      case 'trip_member_added':
        return 'border-l-purple-500 bg-purple-50';
      case 'trip_member_removed':
        return 'border-l-gray-500 bg-gray-50';
      case 'trip_member_role_changed':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  }

  formatTime(timestamp: any): string {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return '剛剛';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分鐘前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小時前`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} 天前`;

    return date.toLocaleDateString('zh-TW');
  }

  closePanel() {
    this.close.emit();
  }
}
