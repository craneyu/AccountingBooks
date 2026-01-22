import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TripService } from '../../core/services/trip.service';
import { AuthService } from '../../core/services/auth.service';
import { Trip } from '../../core/models/trip.model';
import { Timestamp } from 'firebase/firestore';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';

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

  form: FormGroup;
  loading = false;
  faTimes = faTimes;
  faSpinner = faSpinner;

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
    }
  }

  cancel() {
    this.close.emit();
  }
}
