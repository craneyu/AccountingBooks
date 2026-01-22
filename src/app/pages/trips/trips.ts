import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TripService } from '../../core/services/trip.service';
import { AuthService } from '../../core/services/auth.service';
import { Trip } from '../../core/models/trip.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkedAlt, faCalendarAlt, faSuitcaseRolling, faPlus, faEdit, faTrash, faTools } from '@fortawesome/free-solid-svg-icons';
import { TripDialogComponent } from '../../components/trip-dialog/trip-dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, TripDialogComponent],
  templateUrl: './trips.html',
  styleUrl: './trips.scss'
})
export class TripsComponent {
  tripService = inject(TripService);
  authService = inject(AuthService);
  
  trips$ = this.tripService.getActiveTrips();
  isAdmin = this.authService.isAdmin;
  
  showTripDialog = signal(false);
  selectedTrip = signal<Trip | null>(null);

  faMapMarkedAlt = faMapMarkedAlt;
  faCalendarAlt = faCalendarAlt;
  faSuitcaseRolling = faSuitcaseRolling;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faTools = faTools;

  openAddTrip() {
    this.selectedTrip.set(null);
    this.showTripDialog.set(true);
  }

  openEditTrip(event: Event, trip: Trip) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedTrip.set(trip);
    this.showTripDialog.set(true);
  }

  async deleteTrip(event: Event, trip: Trip) {
    event.preventDefault();
    event.stopPropagation();
    
    const result = await Swal.fire({
      title: '確定要刪除嗎？',
      text: `刪除 "${trip.name}"？此操作無法復原。`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '是的，刪除',
      cancelButtonText: '取消',
      confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
      try {
        await this.tripService.deleteTrip(trip.id!);
        Swal.fire('已刪除！', '旅程已刪除。', 'success');
      } catch (error) {
        console.error(error);
        Swal.fire('錯誤', '刪除旅程失敗。', 'error');
      }
    }
  }
}