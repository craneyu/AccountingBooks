import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { SystemSettingsService } from '../../core/services/system-settings.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  authService = inject(AuthService);
  settingsService = inject(SystemSettingsService);
  
  settings = this.settingsService.settings;
  faGoogle = faGoogle;
  faSpinner = faSpinner;

  loading = signal(false);

  async login() {
    this.loading.set(true);
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      this.loading.set(false);
    }
  }
}