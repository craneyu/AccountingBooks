import { Component, EventEmitter, Input, Output, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TripMembersService } from '../../core/services/trip-members.service';
import { TripMember } from '../../core/models/trip-member.model';
import { AuthService } from '../../core/services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faSpinner, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import { toSignal } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trip-members-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './trip-members-dialog.html',
  styleUrl: './trip-members-dialog.scss'
})
export class TripMembersDialogComponent implements OnInit {
  @Input() tripId!: string;
  @Input() currentUserRole: 'owner' | 'editor' | 'viewer' | null = null;
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private membersService = inject(TripMembersService);
  private authService = inject(AuthService);

  members = signal<TripMember[]>([]);
  loading = signal(false);
  addingMember = signal(false);
  form: FormGroup;

  faTimes = faTimes;
  faSpinner = faSpinner;
  faTrash = faTrash;
  faEdit = faEdit;

  isOwner = computed(() => this.currentUserRole === 'owner');

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: ['viewer', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading.set(true);
    this.membersService.getTripMembers(this.tripId).subscribe({
      next: (members) => {
        this.members.set(members);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('載入成員失敗:', error);
        Swal.fire('錯誤', '無法載入成員列表', 'error');
        this.loading.set(false);
      }
    });
  }

  async addMember(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.addingMember.set(true);
    const { email, role } = this.form.value;

    try {
      // 這裡應該根據 email 查詢使用者 ID
      // 簡化版本：直接使用 email 作為 ID（實務應使用正確的使用者查詢）
      const userId = email.replace('@', '_').replace('.', '_');

      await this.membersService.addMemberWithUserId(this.tripId, userId, {
        displayName: email,
        email,
        role,
        joinedAt: new Date() as any,
        addedBy: this.authService.currentUser()?.id || ''
      });

      this.form.reset({ role: 'viewer' });
      await Swal.fire('成功', '成員已新增', 'success');
      this.loadMembers();
    } catch (error) {
      console.error('新增成員失敗:', error);
      await Swal.fire('錯誤', '無法新增成員', 'error');
    } finally {
      this.addingMember.set(false);
    }
  }

  async updateRole(member: TripMember, newRole: string): Promise<void> {
    try {
      await this.membersService.updateMember(this.tripId, member.userId, {
        role: newRole as 'owner' | 'editor' | 'viewer'
      });

      await Swal.fire('成功', '成員角色已更新', 'success');
      this.loadMembers();
    } catch (error) {
      console.error('更新成員失敗:', error);
      await Swal.fire('錯誤', '無法更新成員', 'error');
    }
  }

  async removeMember(member: TripMember): Promise<void> {
    const result = await Swal.fire({
      title: '確認移除',
      text: `確定要移除 ${member.displayName} 嗎？`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '移除',
      cancelButtonText: '取消'
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await this.membersService.removeMember(this.tripId, member.userId);
      await Swal.fire('成功', '成員已移除', 'success');
      this.loadMembers();
    } catch (error) {
      console.error('移除成員失敗:', error);
      await Swal.fire('錯誤', '無法移除成員', 'error');
    }
  }

  closeDialog(): void {
    this.close.emit();
  }
}
