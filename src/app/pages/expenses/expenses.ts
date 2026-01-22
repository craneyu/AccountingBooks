import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { TripService } from '../../core/services/trip.service';
import { CategoryService } from '../../core/services/category.service';
import { Expense } from '../../core/models/expense.model';
import { Trip } from '../../core/models/trip.model';
import { Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faPlus, faArrowLeft, faEdit, faTrash, faReceipt, faImages, faTag 
} from '@fortawesome/free-solid-svg-icons';
import { ExpenseDialogComponent } from '../../components/expense-dialog/expense-dialog';
import { getIcon } from '../../core/utils/icon-utils';
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
  private categoryService = inject(CategoryService);

  tripId = this.route.snapshot.paramMap.get('tripId')!;
  trip$: Observable<Trip | undefined> = this.tripService.getTrip(this.tripId).pipe(shareReplay(1));
  expenses$: Observable<Expense[]> = this.expenseService.getExpenses(this.tripId);
  
  // Category Map for Icons
  categoryIconMap = signal<Record<string, string>>({});

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
  
  constructor() {
    // Load categories to build icon map
    this.categoryService.getCategories().subscribe(cats => {
      const map: Record<string, string> = {};
      cats.forEach(c => {
        if (c.icon) map[c.name] = c.icon;
      });
      this.categoryIconMap.set(map);
    });
  }

  getCategoryIcon(categoryName: string) {
    const iconName = this.categoryIconMap()[categoryName];
    return getIcon(iconName);
  }

  isFallbackIcon(categoryName: string): boolean {
    const iconName = this.categoryIconMap()[categoryName];
    return !iconName;
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
      const htmlContent = `
        <div class="gallery-wrapper">
          <div class="gallery-container">
            ${images.map((url, i) => `
              <div class="snap-center p-4">
                <img src="${url}" class="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg">
                <div class="mt-6 text-white text-lg font-bold bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">
                  ${i + 1} / ${images.length}
                </div>
              </div>
            `).join('')}
          </div>
          <!-- Swipe Hint -->
          <div class="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none md:hidden">
             <div class="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce border-2 border-white/20">
               ⬅ 左右滑動切換照片 ➡
             </div>
          </div>
        </div>
      `;

      Swal.fire({
        html: htmlContent,
        showConfirmButton: false,
        showCloseButton: true,
        width: '100vw',
        padding: '0',
        background: 'transparent',
        customClass: {
          popup: '!bg-transparent shadow-none !w-screen !max-w-none',
          htmlContainer: '!m-0 !p-0 !overflow-visible'
        },
        backdrop: `rgba(0,0,0,0.95)`
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