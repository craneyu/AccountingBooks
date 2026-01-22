import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUserShield, faUser, faUserSlash, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagementComponent {
  private userService = inject(UserService);

  users$: Observable<User[]> = this.userService.getUsers();

  faArrowLeft = faArrowLeft;
  faUserShield = faUserShield;
  faUser = faUser;
  faUserSlash = faUserSlash;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;

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
}
