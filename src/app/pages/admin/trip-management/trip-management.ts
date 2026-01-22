import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';
import { Trip } from '../../../core/models/trip.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus, faEdit, faTrash, faArrowLeft, faCheck, faBan } from '@fortawesome/free-solid-svg-icons';
import { TripDialogComponent } from '../../../components/trip-dialog/trip-dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trip-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, TripDialogComponent],
  templateUrl: './trip-management.html',
  styleUrl: './trip-management.scss'
})
export class TripManagementComponent {
  tripService = inject(TripService);
  
  trips$ = this.tripService.getAllTrips();
  
  showTripDialog = signal(false);
  selectedTrip = signal<Trip | null>(null);

  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faArrowLeft = faArrowLeft;
  faCheck = faCheck;
  faBan = faBan;

  openAddTrip() {
    this.selectedTrip.set(null);
    this.showTripDialog.set(true);
  }

  openEditTrip(trip: Trip) {
    this.selectedTrip.set(trip);
    this.showTripDialog.set(true);
  }

  async toggleStatus(trip: Trip) {
    const newStatus = trip.status === 'active' ? 'inactive' : 'active';
    try {
      await this.tripService.updateTrip(trip.id!, { status: newStatus });
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to update status.', 'error');
    }
  }

  async deleteTrip(trip: Trip) {
    const result = await Swal.fire({
      title: '確定要刪除嗎？',
      text: `刪除 "${trip.name}"？此操作無法復原，且會刪除所有相關支出紀錄。`,
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
