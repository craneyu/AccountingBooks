import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSignOutAlt, faUser, faSuitcaseRolling } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, FontAwesomeModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayoutComponent {
  authService = inject(AuthService);
  currentUser = this.authService.currentUser;
  
  faSignOutAlt = faSignOutAlt;
  faUser = faUser;
  faSuitcaseRolling = faSuitcaseRolling;

  logout() {
    this.authService.logout();
  }
}