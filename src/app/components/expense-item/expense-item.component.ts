import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  OnInit,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Expense } from '../../core/models/expense.model';
import { CategoryService } from '../../core/services/category.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faImages, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { getIcon } from '../../core/utils/icon-utils';

@Component({
  selector: 'app-expense-item',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './expense-item.component.html',
  styleUrl: './expense-item.component.scss'
})
export class ExpenseItemComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() expense!: Expense;
  @Input() canEdit: boolean = false;
  @Output() viewReceipts = new EventEmitter<Expense>();
  @Output() edit = new EventEmitter<Expense>();
  @Output() delete = new EventEmitter<Expense>();

  @ViewChild('itemContainer') itemContainer!: ElementRef<HTMLDivElement>;

  private categoryService = inject(CategoryService);

  // Icons
  faImages = faImages;
  faEdit = faEdit;
  faTrash = faTrash;

  // 左滑菜單狀態
  isSliding = signal(false);
  slideOffset = signal(0);
  private hammer: any;

  // 計算實際的 transform 偏移（手機版允許滑動，平板版始終為 0）
  actualSlideOffset = computed(() => {
    return window.innerWidth < 600 ? this.slideOffset() : 0;
  });

  categoryIconMap = signal<Record<string, string>>({});

  /**
   * 取得分類圖示
   */
  getCategoryIcon(categoryName: string) {
    const iconName = this.categoryIconMap()[categoryName];
    return getIcon(iconName);
  }

  /**
   * 檢查是否使用後備圖示
   */
  isFallbackIcon(categoryName: string): boolean {
    const iconName = this.categoryIconMap()[categoryName];
    return !iconName;
  }

  ngOnInit() {
    // 訂閱分類圖示對應表
    this.categoryService.getCategories().subscribe((categories) => {
      const map: Record<string, string> = {};
      categories.forEach((cat) => {
        if (cat.icon) {
          map[cat.name] = cat.icon;
        }
      });
      this.categoryIconMap.set(map);
    });
  }

  private resizeListener = () => {
    // 如果切換到桌面版或平板版（寬度 >= 600px），銷毀 Hammer
    if (window.innerWidth >= 600 && this.hammer) {
      this.hammer.destroy();
      this.hammer = undefined;
      this.isSliding.set(false);
      this.slideOffset.set(0);
    }
    // 如果切換回手機版（寬度 < 600px），重新初始化
    else if (window.innerWidth < 600 && !this.hammer) {
      this.initializeHammer();
    }
  };

  ngAfterViewInit() {
    // 只在手機版（寬度 < 600px）使用 HammerJS
    // 平板版（600px - 1024px）和桌面版（>= 1025px）直接顯示按鈕
    const windowWidth = window.innerWidth;
    const needsHammer = windowWidth < 600;
    console.log('[ExpenseItem] Window width:', windowWidth, 'Needs HammerJS:', needsHammer);

    if (needsHammer) {
      // 延遲初始化以確保 DOM 完全載入
      setTimeout(() => {
        this.initializeHammer();
        this.initializeTouchEvents();
      }, 100);
    }

    // 監聽視窗大小變化
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy() {
    // 銷毀 HammerJS
    if (this.hammer) {
      this.hammer.destroy();
      this.hammer = undefined;
    }

    // 移除視窗大小變化監聽器
    window.removeEventListener('resize', this.resizeListener);
  }

  private initializeHammer() {
    if (!this.itemContainer) {
      console.warn('[InitializeHammer] itemContainer is null');
      return;
    }

    const element = this.itemContainer.nativeElement;
    const HammerLib = (window as any).Hammer;

    if (!HammerLib) {
      console.warn('HammerJS 未載入');
      return;
    }

    try {
      // 建立 Hammer 管理器
      const manager = new HammerLib.Manager(element);

      // 清除預設識別器
      manager.recognizers = [];

      // 添加 Pan 識別器
      const panRecognizer = new HammerLib.Pan({
        direction: HammerLib.DIRECTION_HORIZONTAL,
        threshold: 5,
        pointers: 1
      });
      manager.add(panRecognizer);

      // 添加 Swipe 識別器
      const swipeRecognizer = new HammerLib.Swipe({
        direction: HammerLib.DIRECTION_HORIZONTAL,
        threshold: 10,
        velocity: 0.3,
        pointers: 1
      });
      manager.add(swipeRecognizer);

      this.hammer = manager;

      // 選單寬度常數
      const MENU_WIDTH = 140;
      const TRIGGER_THRESHOLD = MENU_WIDTH / 2;

      // 監聽左滑事件
      manager.on('swipeleft', (e: any) => {
        if (e.preventDefault) e.preventDefault();
        this.isSliding.set(true);
        this.slideOffset.set(-MENU_WIDTH);
      });

      // 監聽右滑事件（關閉選單）
      manager.on('swiperight', (e: any) => {
        if (e.preventDefault) e.preventDefault();
        this.isSliding.set(false);
        this.slideOffset.set(0);
      });

      // 監聽 pan 事件（拖動中的即時反饋）
      manager.on('pan', (e: any) => {
        // 檢查是否為水平移動
        if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          return; // 垂直移動，由瀏覽器處理頁面滾動
        }

        if (e.preventDefault) e.preventDefault();

        // 拖動進行中
        if (!e.isFinal) {
          // 只允許向左拖動
          const offset = Math.min(0, Math.max(-MENU_WIDTH, e.deltaX));
          this.slideOffset.set(offset);

          // 根據拖動距離判斷是否應顯示選單
          this.isSliding.set(offset < -TRIGGER_THRESHOLD);
        } else {
          // 拖動結束（指尖抬起）
          const currentOffset = this.slideOffset();
          if (currentOffset < -TRIGGER_THRESHOLD) {
            this.isSliding.set(true);
            this.slideOffset.set(-MENU_WIDTH);
          } else {
            this.isSliding.set(false);
            this.slideOffset.set(0);
          }
        }
      });

      console.log('HammerJS 初始化成功 - 元素:', element.className);
    } catch (err) {
      console.error('HammerJS 初始化失敗:', err);
    }
  }

  private touchStartX = 0;
  private touchStartY = 0;
  private isTouching = false;

  /**
   * 初始化原生觸摸事件（備用）
   */
  private initializeTouchEvents() {
    if (!this.itemContainer) return;

    const element = this.itemContainer.nativeElement;
    const MENU_WIDTH = 140;
    const TRIGGER_THRESHOLD = MENU_WIDTH / 2;

    // 在 capture 階段監聽，確保先於其他事件處理器
    element.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      this.isTouching = true;
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, true);

    element.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.isTouching || e.touches.length === 0) return;

      const touchX = e.touches[0].clientX;
      const touchY = e.touches[0].clientY;
      const deltaX = touchX - this.touchStartX;
      const deltaY = touchY - this.touchStartY;

      // 檢查是否為水平移動
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
        e.preventDefault();

        // 只允許向左拖動
        const offset = Math.min(0, Math.max(-MENU_WIDTH, deltaX));
        this.slideOffset.set(offset);

        // 根據拖動距離判斷是否應顯示選單
        this.isSliding.set(offset < -TRIGGER_THRESHOLD);
      }
    }, true);

    element.addEventListener('touchend', () => {
      if (!this.isTouching) return;

      this.isTouching = false;
      const currentOffset = this.slideOffset();

      if (currentOffset < -TRIGGER_THRESHOLD) {
        this.isSliding.set(true);
        this.slideOffset.set(-MENU_WIDTH);
      } else {
        this.isSliding.set(false);
        this.slideOffset.set(0);
      }
    }, true);

    console.log('[InitTouchEvents] 原生觸摸事件初始化成功，使用 capture 模式');
  }

  /**
   * 關閉滑動選單
   */
  closeSlide() {
    this.isSliding.set(false);
    this.slideOffset.set(0);
  }

  /**
   * 查看照片
   */
  onViewReceipts() {
    this.viewReceipts.emit(this.expense);
    this.closeSlide();
  }

  /**
   * 編輯支出
   */
  onEdit() {
    this.edit.emit(this.expense);
    this.closeSlide();
  }

  /**
   * 刪除支出
   */
  onDelete() {
    this.delete.emit(this.expense);
    this.closeSlide();
  }
}
