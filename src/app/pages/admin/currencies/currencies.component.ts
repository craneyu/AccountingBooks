import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { CurrencyService } from '../../../core/services/currency.service';
import { Currency } from '../../../core/models/currency.model';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faSpinner, faTrash, faEdit, faGripVertical, faPlus } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-currencies',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule, FontAwesomeModule],
  templateUrl: './currencies.component.html',
  styleUrl: './currencies.component.scss'
})
export class CurrenciesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private currencyService = inject(CurrencyService);

  currencies$ = this.currencyService.getCurrencies();
  currencies = toSignal(this.currencies$, { initialValue: [] });

  loading = signal(false);
  addingCurrency = signal(false);
  showAddForm = signal(false);
  editingId = signal<string | null>(null);

  form: FormGroup;

  faTimes = faTimes;
  faSpinner = faSpinner;
  faTrash = faTrash;
  faEdit = faEdit;
  faGripVertical = faGripVertical;
  faPlus = faPlus;

  // 排序後的幣別列表
  sortedCurrencies = signal<Currency[]>([]);

  constructor() {
    this.form = this.fb.group({
      id: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(10)]],
      code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      symbol: ['', [Validators.required, Validators.minLength(1)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    // 監聽幣別變更並更新排序列表
    this.currencies$.subscribe(currencies => {
      this.sortedCurrencies.set(currencies);
    });
  }

  toggleAddForm(): void {
    this.showAddForm.set(!this.showAddForm());
    if (this.showAddForm()) {
      this.form.reset({ isActive: true });
      this.editingId.set(null);
    }
  }

  async addCurrency(): Promise<void> {
    if (this.form.invalid) {
      Swal.fire('驗證失敗', '請檢查表單欄位', 'warning');
      return;
    }

    this.addingCurrency.set(true);

    try {
      const { id, code, name, symbol, isActive } = this.form.value;

      // 檢查幣別是否已存在
      const exists = this.currencies().some(c => c.id === id);
      if (exists) {
        await Swal.fire('錯誤', '此幣別代碼已存在', 'error');
        this.addingCurrency.set(false);
        return;
      }

      const newCurrency = {
        code,
        name,
        symbol,
        isActive,
        isSystemDefault: false,
        order: this.currencies().length
      };

      await this.currencyService.addCurrencyWithId(id, newCurrency);

      await Swal.fire('成功', '幣別已新增', 'success');
      this.form.reset({ isActive: true });
      this.showAddForm.set(false);
    } catch (error) {
      console.error('新增幣別失敗:', error);
      await Swal.fire('錯誤', '無法新增幣別', 'error');
    } finally {
      this.addingCurrency.set(false);
    }
  }

  async toggleCurrencyActive(currency: Currency): Promise<void> {
    try {
      await this.currencyService.updateCurrency(currency.id, {
        isActive: !currency.isActive
      });

      const message = currency.isActive ? '已停用' : '已啟用';
      await Swal.fire('成功', `幣別${message}`, 'success');
    } catch (error) {
      console.error('更新幣別失敗:', error);
      await Swal.fire('錯誤', '無法更新幣別', 'error');
    }
  }

  async deleteCurrency(currency: Currency): Promise<void> {
    // 不能刪除系統預設幣別
    if (currency.isSystemDefault) {
      await Swal.fire('無法刪除', '系統預設幣別無法刪除', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: '確認刪除',
      text: `確定要刪除「${currency.name}」嗎？`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消'
    });

    if (!result.isConfirmed) return;

    try {
      await this.currencyService.deleteCurrency(currency.id);
      await Swal.fire('成功', '幣別已刪除', 'success');
    } catch (error) {
      console.error('刪除幣別失敗:', error);
      await Swal.fire('錯誤', '無法刪除幣別', 'error');
    }
  }

  /**
   * 拖曳排序完成
   */
  async onDropped(event: CdkDragDrop<Currency[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    // 本地更新 UI
    const newList = [...this.sortedCurrencies()];
    const [moved] = newList.splice(event.previousIndex, 1);
    newList.splice(event.currentIndex, 0, moved);

    this.sortedCurrencies.set(newList);

    // 保存新排序到 Firebase
    try {
      this.loading.set(true);
      await this.currencyService.updateCurrenciesOrder(newList);
      await Swal.fire('成功', '排序已更新', 'success');
    } catch (error) {
      console.error('更新排序失敗:', error);
      // 回滾
      this.sortedCurrencies.set(this.currencies());
      await Swal.fire('錯誤', '無法保存排序', 'error');
    } finally {
      this.loading.set(false);
    }
  }
}
