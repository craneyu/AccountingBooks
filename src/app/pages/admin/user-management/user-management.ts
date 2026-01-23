import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUserShield, faUser, faUserSlash, faCheckCircle, faTimesCircle, faTrash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { UserDialogComponent } from '../../../components/user-dialog/user-dialog';
import { AuthService } from '../../../core/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, UserDialogComponent],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagementComponent {
  private userService = inject(UserService);
  private authService = inject(AuthService);

  users$: Observable<User[]> = this.userService.getUsers();
  currentUser = this.authService.currentUser;
  showDialog = false;
  syncLoading = false;

  faArrowLeft = faArrowLeft;
  faUserShield = faUserShield;
  faUser = faUser;
  faUserSlash = faUserSlash;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faTrash = faTrash;
  faSpinner = faSpinner;

  openAdd() {
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
  }

  async deleteUser(user: User) {
    if (user.id === this.currentUser()?.id) {
      Swal.fire('錯誤', '您不能刪除自己的帳號。', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '確定要刪除此使用者嗎？',
      text: `刪除 ${user.displayName || user.email} 後將無法復原資料。`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      confirmButtonText: '是的，刪除',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      try {
        await this.userService.deleteUser(user.id);
        Swal.fire({
          icon: 'success',
          title: '已刪除使用者',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      } catch (error) {
        Swal.fire('錯誤', '刪除失敗', 'error');
      }
    }
  }

  async toggleAdmin(user: User) {
    const action = user.isAdmin ? '移除' : '設為';
    const result = await Swal.fire({
      title: `確定要將此使用者${action}管理員嗎？`,
      text: user.displayName || user.email,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      try {
        await this.userService.toggleAdmin(user.id, user.isAdmin);
        Swal.fire({
          icon: 'success',
          title: '已更新權限',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      } catch (error) {
        Swal.fire('錯誤', '更新失敗', 'error');
      }
    }
  }

  async toggleStatus(user: User) {
    const action = user.status === 'active' ? '停用' : '啟用';
    const result = await Swal.fire({
      title: `確定要${action}此帳號嗎？`,
      text: user.displayName || user.email,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      try {
        await this.userService.toggleStatus(user.id, user.status);
        Swal.fire({
          icon: 'success',
          title: `帳號已${action}`,
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      } catch (error) {
        Swal.fire('錯誤', '操作失敗', 'error');
      }
    }
  }

  async syncUsersPhotoURL() {
    const result = await Swal.fire({
      title: '重新同步所有使用者頭像',
      text: '這將從 Firebase Auth 更新所有使用者的頭像資訊，可能需要數秒。',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      this.syncLoading = true;
      try {
        const response = await this.userService.syncAllUsersPhotoURL();
        Swal.fire({
          icon: 'success',
          title: '同步完成',
          html: `<p>${response.message}</p><p class="text-sm text-gray-600">共 ${response.total} 個使用者，更新 ${response.updated} 個</p>`,
          timer: 3000,
          showConfirmButton: false
        });
      } catch (error: any) {
        console.error('同步失敗:', error);
        Swal.fire('錯誤', error.message || '同步失敗', 'error');
      } finally {
        this.syncLoading = false;
      }
    }
  }
}