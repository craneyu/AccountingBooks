import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TripService } from '../../core/services/trip.service';
import { AuthService } from '../../core/services/auth.service';
import { Trip } from '../../core/models/trip.model';
import { Timestamp } from 'firebase/firestore';
import { Storage } from '@angular/fire/storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faSpinner, faCamera } from '@fortawesome/free-solid-svg-icons';
import { compressImage } from '../../core/utils/image-utils';

@Component({
  selector: 'app-trip-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './trip-dialog.html',
  styleUrl: './trip-dialog.scss'
})
export class TripDialogComponent {
  @Input() trip: Trip | null = null;
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  private storage = inject(Storage);

  form: FormGroup;
  loading = false;
  uploading = false;
  
  faTimes = faTimes;
  faSpinner = faSpinner;
  faCamera = faCamera;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      currency: ['TWD', Validators.required],
      coverImage: [''],
      status: ['active', Validators.required]
    });
  }

  ngOnInit() {
    if (this.trip) {
      this.form.patchValue({
        name: this.trip.name,
        description: this.trip.description,
        startDate: this.trip.startDate.toDate().toISOString().substring(0, 10),
        endDate: this.trip.endDate.toDate().toISOString().substring(0, 10),
        currency: this.trip.currency,
        coverImage: this.trip.coverImage,
        status: this.trip.status
      });

      if (this.trip.coverImage) {
        this.previewUrl = this.trip.coverImage;
      }
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadFile(): Promise<string | null> {
    if (!this.selectedFile) return null;
    try {
        // Compress image before upload (Max 1280px for covers, 0.8 quality)
        const compressedBlob = await compressImage(this.selectedFile, 1280, 1280, 0.8);
        
        const fileName = this.selectedFile.name.substring(0, this.selectedFile.name.lastIndexOf('.')) || this.selectedFile.name;
        // Use a generic 'covers' folder or trip-specific if ID exists, but safe to use timestamp
        const path = `covers/${new Date().getTime()}_${fileName}.jpg`;
        
        const storageRef = ref(this.storage, path);
        const result = await uploadBytes(storageRef, compressedBlob);
        return await getDownloadURL(result.ref);
    } catch (error) {
        console.error('Upload failed', error);
        return null;
    }
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;

    try {
      const formVal = this.form.value;
      const user = this.authService.currentUser();
      
      // Upload image if selected
      let imageUrl = formVal.coverImage;
      if (this.selectedFile) {
        this.uploading = true;
        const url = await this.uploadFile();
        if (url) imageUrl = url;
        this.uploading = false;
      }

      const tripData: any = {
        name: formVal.name,
        description: formVal.description || '',
        startDate: Timestamp.fromDate(new Date(formVal.startDate)),
        endDate: Timestamp.fromDate(new Date(formVal.endDate)),
        currency: formVal.currency,
        coverImage: imageUrl || null,
        status: formVal.status,
        updatedAt: Timestamp.now()
      };

      if (this.trip) {
        await this.tripService.updateTrip(this.trip.id!, tripData);
      } else {
        tripData.createdAt = Timestamp.now();
        tripData.createdBy = user?.id;
        await this.tripService.addTrip(tripData);
      }
      this.close.emit();
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
      this.uploading = false;
    }
  }

  cancel() {
    this.close.emit();
  }
}
