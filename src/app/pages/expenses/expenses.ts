import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { TripService } from '../../core/services/trip.service';
import { Expense } from '../../core/models/expense.model';
import { Trip } from '../../core/models/trip.model';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faPlus, faArrowLeft, faEdit, faTrash, faReceipt, faImages,
  faUtensils, faBus, faBed, faShoppingBag, faFilm, faEllipsisH 
} from '@fortawesome/free-solid-svg-icons';
import { ExpenseDialogComponent } from '../../components/expense-dialog/expense-dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, ExpenseDialogComponent],
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss'
})
export class ExpensesComponent {
  private route = inject(ActivatedRoute);
  private expenseService = inject(ExpenseService);
  private tripService = inject(TripService);

  tripId = this.route.snapshot.paramMap.get('tripId')!;
  trip$: Observable<Trip | undefined> = this.tripService.getTrip(this.tripId).pipe(shareReplay(1));
  expenses$: Observable<Expense[]> = this.expenseService.getExpenses(this.tripId);

  // Dialog State
  showDialog = false;
  selectedExpense: Expense | null = null;

  // Icons
  faPlus = faPlus;
  faArrowLeft = faArrowLeft;
  faEdit = faEdit;
  faTrash = faTrash;
  faReceipt = faReceipt;
  faImages = faImages;
  
  // Category Icons Map
  getCategoryIcon(category: string) {
    switch (category) {
      case '餐飲': return faUtensils;
      case '交通': return faBus;
      case '住宿': return faBed;
      case '購物': return faShoppingBag;
      case '娛樂': return faFilm;
      default: return faEllipsisH;
    }
  }

  openAdd() {
    this.selectedExpense = null;
    this.showDialog = true;
  }

  openEdit(expense: Expense) {
    this.selectedExpense = expense;
    this.showDialog = true;
  }

  viewReceipts(expense: Expense) {
    const images = expense.receiptImageUrls || (expense.receiptImageUrl ? [expense.receiptImageUrl] : []);
    
    if (images.length === 0) return;

    if (images.length === 1) {
      Swal.fire({
        imageUrl: images[0],
        imageAlt: 'Receipt',
        showConfirmButton: false,
        showCloseButton: true,
        width: 'auto',
        padding: '0',
        customClass: {
          popup: 'rounded-2xl shadow-soft overflow-hidden !bg-transparent',
          image: 'm-0 max-h-[90vh] w-auto object-contain'
        },
        backdrop: `rgba(0,0,0,0.9)`
      });
    } else {
      // Multiple Images Gallery with Swipe Support
      const htmlContent = `
        <div class="relative group">
          <div class="gallery-container flex overflow-x-auto snap-x snap-mandatory scrollbar-none gap-0 w-full">
            ${images.map((url, i) => `
              <div class="snap-center shrink-0 w-full flex flex-col items-center justify-center min-h-[50vh] max-h-[85vh]">
                <img src="${url}" class="max-w-full max-h-[75vh] object-contain shadow-lg rounded-sm">
                <div class="mt-4 text-white/70 text-sm font-medium">
                  照片 ${i + 1} / ${images.length}
                </div>
              </div>
            `).join('')}
          </div>
          <!-- Swipe Hint for mobile -->
          <div class="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none md:hidden">
             <div class="bg-black/50 text-white px-3 py-1 rounded-full text-xs animate-pulse">
               ⬅ 左右滑動切換 ➡
             </div>
          </div>
        </div>
      `;

      Swal.fire({
        html: htmlContent,
        showConfirmButton: false,
        showCloseButton: true,
        width: '100%',
        padding: '0',
        background: 'transparent',
        customClass: {
          popup: '!bg-transparent shadow-none w-full max-w-4xl',
          htmlContainer: '!m-0 !p-0 overflow-hidden'
        },
        backdrop: `rgba(0,0,0,0.9)`
      });
    }
  }

  async delete(expense: Expense) {
    const result = await Swal.fire({
      title: '確定要刪除嗎？',
      text: "刪除後將無法復原！",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#a0aec0',
      confirmButtonText: '是的，刪除！',
      cancelButtonText: '取消',
      background: '#e0e5ec',
      color: '#2d3748',
      customClass: {
        popup: 'rounded-2xl shadow-soft'
      }
    });

    if (result.isConfirmed) {
      await this.expenseService.deleteExpense(this.tripId, expense.id!);
      Swal.fire({
        title: '已刪除！',
        text: '支出紀錄已刪除。',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#e0e5ec',
        color: '#2d3748'
      });
    }
  }

  closeDialog() {
    this.showDialog = false;
    this.selectedExpense = null;
  }
}