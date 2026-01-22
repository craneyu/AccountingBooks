import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faSuitcase, faUsers, faChartLine, faCog, faSave, faTags } from '@fortawesome/free-solid-svg-icons';
import { SystemSettingsService } from '../../../core/services/system-settings.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SystemSettingsService);

  faSuitcase = faSuitcase;
  faUsers = faUsers;
  faChartLine = faChartLine;
  faCog = faCog;
  faSave = faSave;
  faTags = faTags;

  settingsForm!: FormGroup;
  loading = false;

  constructor() {
    this.settingsForm = this.fb.group({
      siteName: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Watch signal and update form
    const settings = this.settingsService.settings();
    if (settings) {
      this.settingsForm.patchValue({
        siteName: settings.siteName
      });
    }
  }

  async saveSettings() {
    if (this.settingsForm.invalid) return;
    this.loading = true;

    try {
      await this.settingsService.updateSettings({
        siteName: this.settingsForm.value.siteName
      });
      
      Swal.fire({
        icon: 'success',
        title: '設定已儲存',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: '儲存失敗',
        text: '請稍後再試'
      });
    } finally {
      this.loading = false;
    }
  }
}
