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
  signal
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

  ngAfterViewInit() {
    this.initializeHammer();
  }

  ngOnDestroy() {
    if (this.hammer) {
      this.hammer.destroy();
    }
  }

  private initializeHammer() {
    if (!this.itemContainer) return;

    const element = this.itemContainer.nativeElement;
    const HammerLib = (window as any).Hammer;

    if (!HammerLib) {
      console.warn('HammerJS 未載入');
      return;
    }

    // 建立 Hammer 管理器
    const manager = new HammerLib.Manager(element);

    // 添加 swipe 識別器
    const swipe = new HammerLib.Swipe({
      threshold: 10,
      velocity: 0.3
    });

    // 添加 pan 識別器（用於更流暢的拖動）
    const pan = new HammerLib.Pan({
      threshold: 0,
      pointers: 1
    });

    manager.add([swipe, pan]);
    this.hammer = manager;

    // 監聽左滑事件
    manager.on('swipeleft', () => {
      this.isSliding.set(true);
      this.slideOffset.set(-120); // 選單寬度
    });

    // 監聽右滑事件（關閉選單）
    manager.on('swiperight', () => {
      this.isSliding.set(false);
      this.slideOffset.set(0);
    });

    // 監聽 pan 事件（拖動中的即時反饋）
    manager.on('pan', (e: any) => {
      const INPUT_MOVE = 1;
      const INPUT_END = 4;

      if (e.type === INPUT_MOVE) {
        // 只允許向左拖動
        const offset = Math.min(0, Math.max(-120, e.deltaX));
        this.slideOffset.set(offset);

        // 根據拖動距離判斷是否應顯示選單
        this.isSliding.set(offset < -60);
      } else if (e.type === INPUT_END) {
        // 拖動結束時，決定是否保持選單打開
        const currentOffset = this.slideOffset();
        if (currentOffset < -60) {
          this.isSliding.set(true);
          this.slideOffset.set(-120);
        } else {
          this.isSliding.set(false);
          this.slideOffset.set(0);
        }
      }
    });
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
