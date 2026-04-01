import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TripService } from '../../core/services/trip.service';
import { TripMembersService } from '../../core/services/trip-members.service';
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
  private membersService = inject(TripMembersService);
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

  async uploadFile(tripId: string): Promise<string | null> {
    if (!this.selectedFile) return null;
    try {
        // Compress image before upload (Max 1280px for covers, 0.8 quality)
        const compressedBlob = await compressImage(this.selectedFile, 1280, 1280, 0.8);

        const fileName = this.selectedFile.name.substring(0, this.selectedFile.name.lastIndexOf('.')) || this.selectedFile.name;
        const path = `trip-covers/${tripId}/${new Date().getTime()}_${fileName}.jpg`;

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

      const tripData: any = {
        name: formVal.name,
        description: formVal.description || '',
        startDate: Timestamp.fromDate(new Date(formVal.startDate)),
        endDate: Timestamp.fromDate(new Date(formVal.endDate)),
        currency: formVal.currency,
        coverImage: formVal.coverImage || null,
        status: formVal.status,
        updatedAt: Timestamp.now()
      };

      if (this.trip) {
        // 編輯模式：已有 tripId，可直接上傳封面
        if (this.selectedFile) {
          this.uploading = true;
          const url = await this.uploadFile(this.trip.id!);
          if (url) tripData.coverImage = url;
          this.uploading = false;
        }
        await this.tripService.updateTrip(this.trip.id!, tripData);
      } else {
        // 新建模式：先建立旅程和成員，再上傳封面
        tripData.createdAt = Timestamp.now();
        tripData.createdBy = user?.id;
        tripData.ownerId = user?.id;
        tripData.memberCount = 1;

        const docRef = await this.tripService.addTrip(tripData);

        // 為建立者自動建立 owner member
        if (user && docRef.id) {
          await this.membersService.addMemberWithUserId(docRef.id, user.id, {
            displayName: user.displayName,
            email: user.email,
            role: 'owner',
            joinedAt: Timestamp.now(),
            addedBy: user.id
          });

          // 成員建立後才上傳封面（Storage rules 需要驗證成員身份）
          if (this.selectedFile) {
            this.uploading = true;
            const url = await this.uploadFile(docRef.id);
            if (url) {
              await this.tripService.updateTrip(docRef.id, { coverImage: url });
            }
            this.uploading = false;
          }
        }
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
