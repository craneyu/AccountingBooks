import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TripService } from '../../core/services/trip.service';
import { TripMembersService } from '../../core/services/trip-members.service';
import { AuthService } from '../../core/services/auth.service';
import { Trip } from '../../core/models/trip.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkedAlt, faCalendarAlt, faSuitcaseRolling, faPlus, faEdit, faTrash, faUsers, faTools } from '@fortawesome/free-solid-svg-icons';
import { TripDialogComponent } from '../../components/trip-dialog/trip-dialog';
import { TripMembersDialogComponent } from '../../components/trip-members-dialog/trip-members-dialog';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trips',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, TripDialogComponent, TripMembersDialogComponent],
  templateUrl: './trips.html',
  styleUrl: './trips.scss'
})
export class TripsComponent {
  tripService = inject(TripService);
  membersService = inject(TripMembersService);
  authService = inject(AuthService);

  // 取得經過授權檢查的行程列表
  trips$ = this.tripService.getActiveTrips().pipe(
    switchMap(trips => {
      const currentUser = this.authService.currentUser();
      if (!trips || !currentUser) {
        return of([]);
      }

      // 對每個行程檢查成員資格
      return Promise.all(
        trips.map(async trip => {
          if (!trip.id) return null;
          try {
            const isMember = await this.membersService.checkMembership(trip.id, currentUser.id);
            return isMember ? trip : null;
          } catch (error) {
            console.error(`檢查行程 ${trip.id} 的成員資格失敗:`, error);
            return null; // 無法驗證時不顯示
          }
        })
      ).then(results => results.filter((trip): trip is Trip => trip !== null));
    })
  );

  isAdmin = this.authService.isAdmin;

  showTripDialog = signal(false);
  showMembersDialog = signal(false);
  selectedTrip = signal<Trip | null>(null);

  faMapMarkedAlt = faMapMarkedAlt;
  faCalendarAlt = faCalendarAlt;
  faSuitcaseRolling = faSuitcaseRolling;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faUsers = faUsers;
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

  async openMembersDialog(event: Event, trip: Trip) {
    event.preventDefault();
    event.stopPropagation();

    // 檢查使用者是否為旅程成員且是 owner
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const role = await this.membersService.getMemberRole(trip.id!, currentUser.id);
    if (role !== 'owner' && !this.isAdmin()) {
      Swal.fire({
        title: '無法管理成員',
        text: '只有旅程所有者可以管理成員。',
        icon: 'error',
        confirmButtonText: '確定'
      });
      return;
    }

    this.selectedTrip.set(trip);
    this.showMembersDialog.set(true);
  }

  async deleteTrip(event: Event, trip: Trip) {
    event.preventDefault();
    event.stopPropagation();

    // 檢查刪除權限
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const role = await this.membersService.getMemberRole(trip.id!, currentUser.id);
    if (role !== 'owner' && !this.isAdmin()) {
      Swal.fire({
        title: '無法刪除',
        text: '只有旅程所有者可以刪除旅程。',
        icon: 'error',
        confirmButtonText: '確定'
      });
      return;
    }

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

  closeTripDialog() {
    this.showTripDialog.set(false);
    this.selectedTrip.set(null);
  }

  closeMembersDialog() {
    this.showMembersDialog.set(false);
    this.selectedTrip.set(null);
  }

  async canEditTrip(trip: Trip): Promise<boolean> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;

    // Admin 可編輯所有旅程
    if (this.isAdmin()) return true;

    // 非 admin 只有 owner 和 editor 可編輯
    const role = await this.membersService.getMemberRole(trip.id!, currentUser.id);
    return role === 'owner' || role === 'editor';
  }
}