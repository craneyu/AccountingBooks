import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SystemSettingsService } from './core/services/system-settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // Initialize settings service
  private settingsService = inject(SystemSettingsService);
}
