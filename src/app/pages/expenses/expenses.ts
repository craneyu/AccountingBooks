import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { TripService } from '../../core/services/trip.service';
import { CategoryService } from '../../core/services/category.service';
import { Expense } from '../../core/models/expense.model';
import { Trip } from '../../core/models/trip.model';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faPlus, faArrowLeft, faEdit, faTrash, faReceipt, faImages, faTag, faChevronLeft, faChevronRight 
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
  
  categoryIconMap = signal<Record<string, string>>({});

  showDialog = false;
  selectedExpense: Expense | null = null;

  faPlus = faPlus;
  faArrowLeft = faArrowLeft;
  faEdit = faEdit;
  faTrash = faTrash;
  faReceipt = faReceipt;
  faImages = faImages;
  
  constructor() {
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
        background: 'transparent',
        customClass: {
          popup: 'rounded-2xl shadow-none overflow-hidden !bg-transparent',
          image: 'm-0 max-h-[90vh] w-auto object-contain'
        },
        backdrop: `rgba(0,0,0,0.9)`
      });
    } else {
      // Multiple Images
      const htmlContent = `
        <div class="gallery-wrapper" style="position: relative; width: 100vw; height: 80vh; display: flex; align-items: center; justify-content: center;">
          <div id="gallery-container" class="gallery-container" style="display: flex; overflow-x: auto; scroll-snap-type: x mandatory; width: 100%; height: 100%; -webkit-overflow-scrolling: touch; scrollbar-width: none; touch-action: pan-x;">
            ${images.map((url, i) => `
              <div class="snap-center" style="flex: 0 0 100%; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; scroll-snap-align: center;">
                <img src="${url}" style="max-width: 90%; max-height: 70%; object-contain: contain; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <div style="margin-top: 20px; color: white; font-weight: bold; background: rgba(0,0,0,0.4); padding: 8px 20px; border-radius: 20px;">
                  ${i + 1} / ${images.length}
                </div>
              </div>
            `).join('')}
          </div>
          
          <!-- Buttons -->
          <button id="prevBtn" style="position: absolute; left: 20px; top: 50%; transform: translateY(-50%); width: 50px; height: 50px; border-radius: 50%; border: none; background: rgba(255,255,255,0.2); color: white; cursor: pointer; z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-chevron-left" style="font-size: 20px;"></i>
          </button>
          <button id="nextBtn" style="position: absolute; right: 20px; top: 50%; transform: translateY(-50%); width: 50px; height: 50px; border-radius: 50%; border: none; background: rgba(255,255,255,0.2); color: white; cursor: pointer; z-index: 1000; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-chevron-right" style="font-size: 20px;"></i>
          </button>
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
        backdrop: `rgba(0,0,0,0.95)`,
        didOpen: () => {
          const container = document.getElementById('gallery-container');
          const nextBtn = document.getElementById('nextBtn');
          const prevBtn = document.getElementById('prevBtn');

          if (container && nextBtn && prevBtn) {
            nextBtn.onclick = (e) => {
              e.stopPropagation();
              container.scrollBy({ left: container.clientWidth, behavior: 'smooth' });
            };
            prevBtn.onclick = (e) => {
              e.stopPropagation();
              container.scrollBy({ left: -container.clientWidth, behavior: 'smooth' });
            };
          }
        }
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