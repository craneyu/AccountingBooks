import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss'
})
export class UserDialogComponent {
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  form: FormGroup;
  loading = false;
  faTimes = faTimes;
  faSpinner = faSpinner;

  constructor() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      displayName: ['', Validators.required],
      isAdmin: [false],
      status: ['active', Validators.required]
    });
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;

    try {
      await this.userService.addUser(this.form.value);
      Swal.fire({
        icon: 'success',
        title: '使用者已預先建立',
        text: '當該使用者以此 Email 登入時將自動生效。',
        timer: 3000,
        showConfirmButton: false
      });
      this.close.emit();
    } catch (err) {
      console.error(err);
      Swal.fire('錯誤', '無法建立使用者', 'error');
    } finally {
      this.loading = false;
    }
  }

  cancel() {
    this.close.emit();
  }
}
