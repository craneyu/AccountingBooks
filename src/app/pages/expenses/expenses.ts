import { Component, inject, signal } from '@angular/core';
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
  faPlus, faArrowLeft, faEdit, faTrash, faReceipt, faImages
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
          image: 'm-0 max-h-[90vh] w-auto object-contain'
        },
        backdrop: `rgba(0,0,0,0.9)`
      });
    } else {
      // Multiple images - enhanced gallery
      this.showImageGallery(images);
    }
  }

  private showImageGallery(images: string[]) {
    const htmlContent = `
      <div class="photo-gallery-wrapper">
        <div id="gallery-container" class="photo-gallery-container">
          ${images.map((url, i) => `
            <div class="photo-gallery-slide">
              <img src="${url}" alt="Receipt ${i + 1}" class="photo-gallery-image">
            </div>
          `).join('')}
        </div>

        <!-- Navigation Buttons -->
        <button id="prevBtn" class="photo-nav-btn photo-nav-prev" aria-label="Previous image">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button id="nextBtn" class="photo-nav-btn photo-nav-next" aria-label="Next image">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <!-- Indicators -->
        <div class="photo-indicators" id="indicators">
          ${images.map((_, i) => `
            <button class="photo-indicator ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Go to image ${i + 1}"></button>
          `).join('')}
        </div>

        <!-- Counter -->
        <div id="counter" class="photo-counter">1 / ${images.length}</div>
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
      // Prevent SweetAlert2 from interfering with touch events
      allowOutsideClick: true,
      didOpen: () => {
        // Ensure the container doesn't have conflicting touch handlers
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) {
          (swalContainer as HTMLElement).style.touchAction = 'none';
        }
        this.initializeGallery(images.length);
      },
      willClose: () => {
        // Cleanup
        this.cleanupGallery();
      }
    });
  }

  private currentGalleryIndex = 0;
  private galleryKeyHandler?: (e: KeyboardEvent) => void;

  private initializeGallery(imageCount: number) {
    const container = document.getElementById('gallery-container');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const counter = document.getElementById('counter');
    const indicators = document.querySelectorAll('.photo-indicator');

    if (!container) {
      console.error('Gallery container not found');
      return;
    }

    this.currentGalleryIndex = 0;

    // Force initial scroll to first slide
    setTimeout(() => {
      container.scrollLeft = 0;
    }, 10);

    // Update UI function
    const updateUI = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      this.currentGalleryIndex = Math.round(scrollLeft / containerWidth);

      if (counter) {
        counter.textContent = `${this.currentGalleryIndex + 1} / ${imageCount}`;
      }

      // Update indicators
      indicators.forEach((indicator, index) => {
        if (index === this.currentGalleryIndex) {
          indicator.classList.add('active');
        } else {
          indicator.classList.remove('active');
        }
      });

      // Update button visibility
      if (prevBtn) {
        prevBtn.style.opacity = this.currentGalleryIndex === 0 ? '0.3' : '1';
        (prevBtn as HTMLButtonElement).disabled = this.currentGalleryIndex === 0;
      }
      if (nextBtn) {
        nextBtn.style.opacity = this.currentGalleryIndex === imageCount - 1 ? '0.3' : '1';
        (nextBtn as HTMLButtonElement).disabled = this.currentGalleryIndex === imageCount - 1;
      }
    };

    // Navigation functions
    const goToSlide = (index: number) => {
      if (index < 0 || index >= imageCount) return;
      container.scrollTo({
        left: container.clientWidth * index,
        behavior: 'smooth'
      });
    };

    const nextSlide = () => {
      if (this.currentGalleryIndex < imageCount - 1) {
        goToSlide(this.currentGalleryIndex + 1);
      }
    };

    const prevSlide = () => {
      if (this.currentGalleryIndex > 0) {
        goToSlide(this.currentGalleryIndex - 1);
      }
    };

    // Button click handlers
    if (nextBtn) {
      nextBtn.onclick = (e) => {
        e.stopPropagation();
        nextSlide();
      };
    }
    if (prevBtn) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        prevSlide();
      };
    }

    // Indicator click handlers
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(index);
      });
    });

    // Scroll event listener with debounce
    let scrollTimeout: any;
    container.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(updateUI, 50);
    }, { passive: true });

    // Keyboard navigation
    this.galleryKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'Escape') {
        Swal.close();
      }
    };
    document.addEventListener('keydown', this.galleryKeyHandler);

    // Touch scrolling is handled natively by CSS touch-action: pan-x
    // No custom touch event handlers needed - let the browser handle it!

    // Mouse drag support for desktop - horizontal only
    let isDragging = false;
    let startX = 0;
    let scrollLeftStart = 0;

    container.addEventListener('mousedown', (e) => {
      // Only allow drag if not clicking on buttons
      if ((e.target as HTMLElement).closest('button')) return;

      isDragging = true;
      startX = e.pageX;
      scrollLeftStart = container.scrollLeft;
      container.style.cursor = 'grabbing';
      container.style.scrollSnapType = 'none';
      e.preventDefault();
    });

    container.addEventListener('mouseleave', () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
        container.style.scrollSnapType = 'x mandatory';
      }
    });

    container.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        container.style.cursor = 'grab';
        container.style.scrollSnapType = 'x mandatory';

        // Snap to nearest slide
        const scrollLeft = container.scrollLeft;
        const containerWidth = container.clientWidth;
        const nearestIndex = Math.round(scrollLeft / containerWidth);
        goToSlide(nearestIndex);
      }
    });

    container.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      e.preventDefault();

      // Only move horizontally
      const deltaX = e.pageX - startX;
      container.scrollLeft = scrollLeftStart - deltaX;
    });

    // Initial UI update
    updateUI();
  }

  private cleanupGallery() {
    if (this.galleryKeyHandler) {
      document.removeEventListener('keydown', this.galleryKeyHandler);
      this.galleryKeyHandler = undefined;
    }
    this.currentGalleryIndex = 0;
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