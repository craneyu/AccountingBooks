import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faWarning, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-account-settings-dialog',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './account-settings-dialog.component.html',
  styleUrl: './account-settings-dialog.component.scss'
})
export class AccountSettingsDialogComponent {
  @Output() close = new EventEmitter<void>();

  private authService = inject(AuthService);
  private userService = inject(UserService);

  // Icons
  faTimes = faTimes;
  faWarning = faWarning;
  faCheck = faCheck;
  faSpinner = faSpinner;

  // State
  loading = signal(false);
  currentUser = this.authService.currentUser;

  /**
   * 計算剩餘刪除天數
   */
  getRemainingDays(): number {
    const user = this.currentUser();
    if (!user?.deleteRequestedAt) return 0;
    return this.userService.getRemainingDays(user.deleteRequestedAt);
  }

  /**
   * 申請刪除帳號
   */
  async requestDelete() {
    const result = await Swal.fire({
      title: '確認刪除帳號?',
      html: `
        <p style="text-align: left; margin-bottom: 12px;">
          <strong>⚠️ 重要提醒：</strong>
        </p>
        <div style="text-align: left; background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-bottom: 12px; border-radius: 4px;">
          <p style="margin: 0 0 8px 0;">• 帳號刪除申請已提交</p>
          <p style="margin: 0 0 8px 0;">• 7 天內可以取消此申請</p>
          <p style="margin: 0;">• 7 天後帳號將永久刪除，無法恢復</p>
        </div>
        <p style="text-align: left; margin: 12px 0;">
          您確定要刪除帳號嗎?
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '是的，刪除帳號',
      cancelButtonText: '取消'
    });

    if (!result.isConfirmed) return;

    this.loading.set(true);
    try {
      await this.authService.requestDeleteAccount();

      await Swal.fire({
        title: '申請已提交',
        text: '您的帳號刪除申請已提交，7 天後將自動刪除。如需取消，請在設定中點擊「取消刪除」按鈕。',
        icon: 'success',
        confirmButtonText: '確定'
      });

      this.close.emit();
    } catch (error) {
      console.error('申請刪除失敗:', error);
      await Swal.fire({
        title: '申請失敗',
        text: '無法提交刪除申請，請稍後重試。',
        icon: 'error',
        confirmButtonText: '確定'
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 取消刪除申請
   */
  async cancelDelete() {
    const result = await Swal.fire({
      title: '取消刪除申請?',
      text: '確定要取消帳號刪除申請嗎? 您的帳號將恢復為正常狀態。',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '確定取消',
      cancelButtonText: '保持刪除'
    });

    if (!result.isConfirmed) return;

    this.loading.set(true);
    try {
      await this.authService.cancelDeleteRequest();

      await Swal.fire({
        title: '已取消',
        text: '帳號刪除申請已取消，您的帳號已恢復為正常狀態。',
        icon: 'success',
        confirmButtonText: '確定'
      });

      this.close.emit();
    } catch (error) {
      console.error('取消刪除失敗:', error);
      await Swal.fire({
        title: '取消失敗',
        text: '無法取消刪除申請，請稍後重試。',
        icon: 'error',
        confirmButtonText: '確定'
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * 關閉對話框
   */
  closeDialog() {
    this.close.emit();
  }
}
