import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  faPlus,
  faArrowLeft,
  faEdit,
  faTrash,
  faReceipt,
  faImages,
} from '@fortawesome/free-solid-svg-icons';
import { ExpenseDialogComponent } from '../../components/expense-dialog/expense-dialog';
import { getIcon } from '../../core/utils/icon-utils';
import Swal from 'sweetalert2';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, ExpenseDialogComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss',
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
    this.categoryService.getCategories().subscribe((cats) => {
      const map: Record<string, string> = {};
      cats.forEach((c) => {
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
    const images =
      expense.receiptImageUrls || (expense.receiptImageUrl ? [expense.receiptImageUrl] : []);
    if (images.length === 0) return;

    if (images.length === 1) {
      // Single image - simple view
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
          image: 'm-0 max-h-[90vh] w-auto object-contain',
        },
        backdrop: `rgba(0,0,0,0.9)`,
      });
    } else {
      // Multiple images - enhanced gallery
      this.showImageGallery(images);
    }
  }

  private showImageGallery(images: string[]) {
    const htmlContent = `
      <div class="swiper-gallery-wrapper">
        <div class="swiper" id="receipt-swiper">
          <div class="swiper-wrapper">
            ${images
              .map(
                (url, i) => `
              <div class="swiper-slide">
                <img src="${url}" alt="Receipt ${i + 1}" class="swiper-image">
              </div>
            `,
              )
              .join('')}
          </div>

          <!-- Navigation -->
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>

          <!-- Pagination -->
          <div class="swiper-pagination"></div>
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
        htmlContainer: '!m-0 !p-0 !overflow-visible',
        container: 'swiper-gallery-swal-container',
      },
      backdrop: `rgba(0,0,0,0.95)`,
      allowOutsideClick: true,
      didOpen: () => {
        this.initializeSwiper();
      },
      willClose: () => {
        this.cleanupSwiper();
      },
    });
  }

  private swiperInstance?: Swiper;
  private swiperKeyHandler?: (e: KeyboardEvent) => void;

  private initializeSwiper() {
    // 初始化 Swiper
    this.swiperInstance = new Swiper('#receipt-swiper', {
      modules: [Navigation, Pagination],
      direction: 'horizontal',
      loop: false,

      // 啟用鍵盤控制
      keyboard: {
        enabled: true,
        onlyInViewport: false,
      },

      // 滑鼠滾輪控制
      mousewheel: {
        forceToAxis: true,
      },

      // 分頁指示器
      pagination: {
        el: '.swiper-pagination',
        type: 'bullets',
        clickable: true,
      },

      // 導航按鈕
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },

      // 觸控設定 - 針對 iOS 最佳化
      touchRatio: 1,
      touchAngle: 45,
      simulateTouch: true,

      // 效果設定
      speed: 300,

      // 縮放支援（可選）
      zoom: {
        maxRatio: 3,
        minRatio: 1,
      },
    });

    // 加入 ESC 鍵關閉功能
    this.swiperKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        Swal.close();
      }
    };
    document.addEventListener('keydown', this.swiperKeyHandler);
  }

  private cleanupSwiper() {
    if (this.swiperInstance) {
      this.swiperInstance.destroy(true, true);
      this.swiperInstance = undefined;
    }
    if (this.swiperKeyHandler) {
      document.removeEventListener('keydown', this.swiperKeyHandler);
      this.swiperKeyHandler = undefined;
    }
  }

  async delete(expense: Expense) {
    const result = await Swal.fire({
      title: '確定要刪除嗎？',
      text: '刪除後將無法復原！',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      cancelButtonColor: '#a0aec0',
      confirmButtonText: '是的，刪除！',
      cancelButtonText: '取消',
      background: '#e0e5ec',
      color: '#2d3748',
      customClass: {
        popup: 'rounded-2xl shadow-soft',
      },
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
        color: '#2d3748',
      });
    }
  }

  closeDialog() {
    this.showDialog = false;
    this.selectedExpense = null;
  }
}
