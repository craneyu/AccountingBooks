import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { TripService } from '../../core/services/trip.service';
import { CategoryService } from '../../core/services/category.service';
import { TripMembersService } from '../../core/services/trip-members.service';
import { AuthService } from '../../core/services/auth.service';
import { ExportService } from '../../core/services/export.service';
import { Expense } from '../../core/models/expense.model';
import { Trip } from '../../core/models/trip.model';
import { TripMember } from '../../core/models/trip-member.model';
import { Observable, firstValueFrom } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faPlus,
  faArrowLeft,
  faEdit,
  faTrash,
  faReceipt,
  faImages,
  faUsers,
  faChartBar,
  faDownload,
  faFileExcel,
  faFileZipper,
} from '@fortawesome/free-solid-svg-icons';
import { ExpenseDialogComponent } from '../../components/expense-dialog/expense-dialog';
import { TripMembersDialogComponent } from '../../components/trip-members-dialog/trip-members-dialog';
import { StatisticsComponent } from './statistics/statistics.component';
import { getIcon } from '../../core/utils/icon-utils';
import Swal from 'sweetalert2';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule, ExpenseDialogComponent, TripMembersDialogComponent, StatisticsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss',
})
export class ExpensesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private expenseService = inject(ExpenseService);
  private tripService = inject(TripService);
  private categoryService = inject(CategoryService);
  private membersService = inject(TripMembersService);
  private authService = inject(AuthService);
  private exportService = inject(ExportService);

  tripId = this.route.snapshot.paramMap.get('tripId')!;
  trip$: Observable<Trip | undefined> = this.tripService.getTrip(this.tripId).pipe(shareReplay(1));
  expenses$: Observable<Expense[]> = this.expenseService.getExpenses(this.tripId);
  currentMemberRole = signal<'owner' | 'editor' | 'viewer' | null>(null);
  isLoading = signal(true);

  categoryIconMap = signal<Record<string, string>>({});

  showDialog = false;
  selectedExpense: Expense | null = null;
  showMembersDialog = signal(false);
  showStatistics = signal(false);
  currentExpenses = signal<Expense[]>([]);

  faPlus = faPlus;
  faArrowLeft = faArrowLeft;
  faEdit = faEdit;
  faTrash = faTrash;
  faReceipt = faReceipt;
  faImages = faImages;
  faUsers = faUsers;
  faChartBar = faChartBar;
  faDownload = faDownload;
  faFileExcel = faFileExcel;
  faFileZipper = faFileZipper;

  exporting = signal(false);

  constructor() {
    // 加載分類圖標
    this.categoryService.getCategories().subscribe((cats) => {
      const map: Record<string, string> = {};
      cats.forEach((c) => {
        if (c.icon) map[c.name] = c.icon;
      });
      this.categoryIconMap.set(map);
    });

    // 訂閱支出資料以便統計使用
    this.expenses$.subscribe((expenses) => {
      this.currentExpenses.set(expenses);
    });

    // 檢查使用者是否為旅程成員並加載其角色
    this.checkMembership();
  }

  private checkMembership(): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.isLoading.set(false);
      return;
    }

    this.membersService.getMemberRole(this.tripId, currentUser.id).then((role) => {
      if (role) {
        this.currentMemberRole.set(role as 'owner' | 'editor' | 'viewer');
      } else {
        // 非成員，重導向至 trips 頁面
        Swal.fire({
          title: '無法訪問',
          text: '您沒有權限查看此旅程。',
          icon: 'error',
          confirmButtonText: '返回'
        }).then(() => {
          this.router.navigate(['/trips']);
        });
      }
      this.isLoading.set(false);
    }).catch((error) => {
      console.error('檢查成員資格失敗:', error);
      this.isLoading.set(false);
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
    // 檢查刪除權限
    const currentUser = this.authService.currentUser();
    const role = this.currentMemberRole();

    // 檢查使用者是否有權刪除該支出
    const isOwner = role === 'owner';
    const isEditor = role === 'editor';
    const isExpenseOwner = expense.submittedBy === currentUser?.id;
    const canDelete = isOwner || isEditor || isExpenseOwner;

    if (!canDelete) {
      Swal.fire({
        title: '無法刪除',
        text: '您沒有權限刪除此支出。',
        icon: 'error',
        confirmButtonText: '確定'
      });
      return;
    }

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

  openMembersDialog() {
    if (this.currentMemberRole() !== 'owner') {
      Swal.fire({
        title: '無法管理成員',
        text: '只有旅程所有者可以管理成員。',
        icon: 'error',
        confirmButtonText: '確定'
      });
      return;
    }
    this.showMembersDialog.set(true);
  }

  closeMembersDialog() {
    this.showMembersDialog.set(false);
  }

  canEditExpense(expense: Expense): boolean {
    const currentUser = this.authService.currentUser();
    const role = this.currentMemberRole();

    // Owner 和 Editor 可編輯所有支出
    if (role === 'owner' || role === 'editor') {
      return true;
    }

    // Viewer 不能編輯，但支出擁有者可編輯自己的支出
    if (role === 'viewer' && expense.submittedBy === currentUser?.id) {
      return true;
    }

    return false;
  }

  canAddExpense(): boolean {
    const role = this.currentMemberRole();
    // Owner 和 Editor 可新增支出，Viewer 不能
    return role === 'owner' || role === 'editor';
  }

  openStatistics() {
    this.showStatistics.set(true);
  }

  closeStatistics() {
    this.showStatistics.set(false);
  }

  async exportAsCSV() {
    const expenses = this.currentExpenses();
    const trip = await firstValueFrom(this.tripService.getTrip(this.tripId));

    if (!trip || expenses.length === 0) {
      Swal.fire({
        title: '無法匯出',
        text: '沒有支出資料可以匯出。',
        icon: 'warning',
        confirmButtonText: '確定'
      });
      return;
    }

    this.exporting.set(true);
    try {
      this.exportService.exportAsCSV(expenses, trip.name);
      Swal.fire({
        title: '匯出成功！',
        text: 'CSV 檔案已下載。',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('CSV 匯出失敗:', error);
      Swal.fire({
        title: '匯出失敗',
        text: '無法匯出 CSV 檔案。',
        icon: 'error',
        confirmButtonText: '確定'
      });
    } finally {
      this.exporting.set(false);
    }
  }

  async exportAsZIP() {
    const expenses = this.currentExpenses();
    const trip = await firstValueFrom(this.tripService.getTrip(this.tripId));

    if (!trip || expenses.length === 0) {
      Swal.fire({
        title: '無法匯出',
        text: '沒有支出資料可以匯出。',
        icon: 'warning',
        confirmButtonText: '確定'
      });
      return;
    }

    const stats = this.exportService.getExportStats(expenses);

    const result = await Swal.fire({
      title: '準備匯出 ZIP',
      html: `
        <div class="text-left text-sm">
          <p><strong>支出筆數：</strong> ${stats.totalExpenses} 筆</p>
          <p><strong>包含圖片：</strong> ${stats.totalImages} 張</p>
          <p><strong>預估大小：</strong> 約 ${this.formatBytes(stats.totalSize)}</p>
          <p class="mt-3 text-gray-600">包含完整的支出資料和收據圖片</p>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: '開始下載',
      cancelButtonText: '取消'
    });

    if (!result.isConfirmed) return;

    this.exporting.set(true);
    try {
      await Swal.fire({
        title: '正在處理...',
        text: '準備 ZIP 檔案中，請稍候',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await this.exportService.exportAsZIP(expenses, trip);

      Swal.fire({
        title: '匯出成功！',
        text: 'ZIP 檔案已下載。',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('ZIP 匯出失敗:', error);
      Swal.fire({
        title: '匯出失敗',
        text: '無法匯出 ZIP 檔案。',
        icon: 'error',
        confirmButtonText: '確定'
      });
    } finally {
      this.exporting.set(false);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
