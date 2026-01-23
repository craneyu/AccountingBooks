import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SystemSettingsService } from '../../core/services/system-settings.service';
import { NotificationService } from '../../core/services/notification.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignOutAlt, faUser, faSuitcaseRolling, faSpinner, faBell, faCog } from '@fortawesome/free-solid-svg-icons';
import { NotificationPanelComponent } from '../../components/notification-panel/notification-panel.component';
import { AccountSettingsDialogComponent } from '../../components/account-settings-dialog/account-settings-dialog.component';
import { Notification } from '../../core/models/notification.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FontAwesomeModule, NotificationPanelComponent, AccountSettingsDialogComponent],
  providers: [],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent implements OnInit {
  authService = inject(AuthService);
  settingsService = inject(SystemSettingsService);
  notificationService = inject(NotificationService);

  currentUser = this.authService.currentUser;
  settings = this.settingsService.settings;
  isInitialized = this.authService.isInitialized;

  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);
  showNotificationPanel = signal(false);
  loadingNotifications = signal(false);

  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  faSuitcaseRolling = faSuitcaseRolling;
  faSpinner = faSpinner;
  faBell = faBell;
  faCog = faCog;

  // 帳號設定對話框狀態
  showAccountSettings = signal(false);

  ngOnInit() {
    console.log('[MainLayout] Initialized, showAccountSettings:', this.showAccountSettings());
    // 訂閱通知（如果使用者已登入）
    if (this.authService.isInitialized() && this.authService.currentUser()) {
      this.loadingNotifications.set(true);
      this.notificationService.getNotifications(50).subscribe({
        next: (notifications) => {
          this.notifications.set(notifications);
          this.updateUnreadCount();
          this.loadingNotifications.set(false);
        },
        error: (error) => {
          console.error('載入通知失敗:', error);
          this.loadingNotifications.set(false);
        }
      });
    }
  }

  private updateUnreadCount() {
    const count = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(count);
  }

  toggleNotificationPanel() {
    this.showNotificationPanel.set(!this.showNotificationPanel());
  }

  closeNotificationPanel() {
    this.showNotificationPanel.set(false);
  }

  onNotificationRead(notificationId: string) {
    // 更新本地狀態
    const notifications = this.notifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifications.set([...notifications]);
      this.updateUnreadCount();
    }
  }

  onNotificationDeleted(notificationId: string) {
    // 從列表中移除通知
    const notifications = this.notifications().filter(n => n.id !== notificationId);
    this.notifications.set(notifications);
    this.updateUnreadCount();
  }

  logout() {
    this.authService.logout();
  }

  /**
   * 打開帳號設定對話框
   */
  openAccountSettings() {
    console.log('[MainLayout] Opening account settings, current state:', this.showAccountSettings());
    const newState = !this.showAccountSettings();
    this.showAccountSettings.set(newState);
    console.log('[MainLayout] Account settings toggled to:', newState);
  }

  /**
   * 關閉帳號設定對話框
   */
  closeAccountSettings() {
    console.log('[MainLayout] Closing account settings');
    this.showAccountSettings.set(false);
    console.log('[MainLayout] Account settings closed, new state:', this.showAccountSettings());
  }
}