import { Injectable, inject, signal } from '@angular/core';
import { Firestore, docData } from '@angular/fire/firestore';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Title } from '@angular/platform-browser';
import { SystemSettings } from '../models/system-settings.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SystemSettingsService {
  private firestore = inject(Firestore);
  private titleService = inject(Title);

  private readonly defaultSettings: SystemSettings = {
    siteName: 'AccountingBooks'
  };

  private settingsDocRef = doc(this.firestore, 'settings/general');

  // Expose settings as a signal
  settings = toSignal(
    docData(this.settingsDocRef).pipe(
      map(data => (data as SystemSettings) || this.defaultSettings),
      tap(settings => this.updateTitle(settings.siteName))
    ),
    { initialValue: this.defaultSettings }
  );

  constructor() {
    // Initial title set
    this.updateTitle(this.defaultSettings.siteName);
  }

  private updateTitle(name: string) {
    this.titleService.setTitle(name);
  }

  async updateSettings(settings: Partial<SystemSettings>) {
    // Use setDoc with merge: true to create if not exists or update
    await setDoc(this.settingsDocRef, settings, { merge: true });
  }
}
