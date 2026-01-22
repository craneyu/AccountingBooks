import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SystemSettingsService } from '../../core/services/system-settings.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignOutAlt, faUser, faSuitcaseRolling, faSpinner } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FontAwesomeModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  settingsService = inject(SystemSettingsService);
  
  currentUser = this.authService.currentUser;
  settings = this.settingsService.settings;
  isInitialized = this.authService.isInitialized;
  
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  faSuitcaseRolling = faSuitcaseRolling;
  faSpinner = faSpinner;

  logout() {
    this.authService.logout();
  }
}