import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, ValidatorFn, AbstractControl, ValidationErrors, FormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { ExchangeRateService } from '../../core/services/exchange-rate.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { PaymentMethodService } from '../../core/services/payment-method.service';
import { Expense } from '../../core/models/expense.model';
import { Category } from '../../core/models/category.model';
import { PaymentMethod } from '../../core/models/payment-method.model';
import { Timestamp } from 'firebase/firestore';
import { Storage } from '@angular/fire/storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faSpinner, faSync, faCamera } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { from } from 'rxjs';
import { compressImage, validateImageFile, validateMultipleImages } from '../../core/utils/image-utils';

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule, FormsModule],
  templateUrl: './expense-dialog.html',
  styleUrl: './expense-dialog.scss'
})
export class ExpenseDialogComponent implements OnInit, OnChanges {
  @Input() tripId!: string;
  @Input() tripCurrency: string = 'TWD';
  @Input() expense: Expense | null = null;
  @Input() tripStartDate?: Timestamp;
  @Input() tripEndDate?: Timestamp;
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private exchangeRateService = inject(ExchangeRateService);
  private authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private paymentMethodService = inject(PaymentMethodService);
  private storage = inject(Storage);

  form!: FormGroup;
  loading = false;
  rateLoading = false;
  uploading = false;
  
  faTimes = faTimes;
  faSpinner = faSpinner;
  faSync = faSync;
  faCamera = faCamera;

  // Constants & State
  currencies = ['TWD', 'JPY', 'USD', 'EUR', 'KRW', 'CNY', 'THB', 'GBP'];
  categories: string[] = ['餐飲', '交通', '住宿', '購物', '娛樂', '其他']; // Default fallback
  paymentMethods: string[] = ['現金', '信用卡', '行動支付']; // Default fallback

  newFiles: File[] = [];
  previewUrls: { url: string, isNew: boolean, file?: File }[] = [];

  // 快速添加類別和支付方式
  showAddCategoryInput = signal(false);
  showAddPaymentMethodInput = signal(false);
  newCategory = signal('');
  newPaymentMethod = signal('');

  ngOnChanges(changes: SimpleChanges) {
    // 當 expense 改變時，更新表單中的日期
    if (changes['expense'] && this.form) {
      const expense = changes['expense'].currentValue;
      if (expense && expense.expenseDate) {
        const expenseDate = expense.expenseDate.toDate().toISOString().substring(0, 10);
        this.form.patchValue({ expenseDate }, { emitEvent: false });
      }
    }

    if (changes['tripCurrency']) {
      const newCurrency = changes['tripCurrency'].currentValue;
      if (newCurrency && !this.currencies.includes(newCurrency)) {
        this.currencies = [...this.currencies, newCurrency];
      }

      // If form is initialized and we are in "Add" mode (no expense), update currency if it hasn't been touched
      if (this.form && !this.expense) {
        const currencyControl = this.form.get('currency');
        if (currencyControl && currencyControl.pristine) {
           currencyControl.setValue(newCurrency);
           // valueChanges will trigger fetchRate
        }
      }
    }
  }

  ngOnInit() {
    const today = new Date().toISOString().substring(0, 10);

    // Ensure tripCurrency is in list
    if (this.tripCurrency && !this.currencies.includes(this.tripCurrency)) {
        this.currencies = [...this.currencies, this.tripCurrency];
    }

    // 準備日期驗證器
    const dateValidators: ValidatorFn[] = [Validators.required];
    if (this.tripStartDate && this.tripEndDate) {
      dateValidators.push(this.tripDateRangeValidator());
    }

    this.form = this.fb.group({
      item: [this.expense?.item || '', Validators.required],
      expenseDate: [this.expense?.expenseDate ? this.expense.expenseDate.toDate().toISOString().substring(0, 10) : today, dateValidators],
      amount: [this.expense?.amount || null, [Validators.required, Validators.min(0)]],
      currency: [this.expense?.currency || this.tripCurrency, Validators.required],
      exchangeRate: [this.expense?.exchangeRate || 1, Validators.required],
      amountInTWD: [this.expense?.amountInTWD || null],
      category: [this.expense?.category || '餐飲', Validators.required],
      paymentMethod: [this.expense?.paymentMethod || '現金', Validators.required],
      note: [this.expense?.note || '']
    });

    // Load dynamic categories
    this.categoryService.getCategories().subscribe(cats => {
      if (cats && cats.length > 0) {
        this.categories = cats.map(c => c.name);
      }
    });

    // Load dynamic payment methods
    this.paymentMethodService.getPaymentMethods().subscribe(methods => {
      if (methods && methods.length > 0) {
        this.paymentMethods = methods.map(m => m.name);
      }
    });

    // Initialize Previews
    if (this.expense?.receiptImageUrls && this.expense.receiptImageUrls.length > 0) {
        this.previewUrls = this.expense.receiptImageUrls.map(url => ({ url, isNew: false }));
    } else if (this.expense?.receiptImageUrl) {
        this.previewUrls = [{ url: this.expense.receiptImageUrl, isNew: false }];
    }

    // Watch Currency Changes
    this.form.get('currency')?.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(300)
    ).subscribe(currency => {
      this.fetchRate(currency);
    });

    // Trigger initial rate fetch if adding new expense
    if (!this.expense && this.tripCurrency) {
        this.fetchRate(this.tripCurrency);
    }

    // Watch Amount or Rate Changes to calc TWD
    this.form.valueChanges.subscribe(val => {
      this.calculateTWD();
    });
  }

  fetchRate(currency: string) {
    if (!currency) return;
    this.rateLoading = true;
    this.exchangeRateService.getRate(currency).subscribe({
      next: (rate) => {
        this.form.patchValue({ exchangeRate: rate }, { emitEvent: false }); // Avoid infinite loop if we listened to rate changes too
        this.calculateTWD();
        this.rateLoading = false;
      },
      error: () => {
        this.rateLoading = false;
        // Allow manual entry
      }
    });
  }

  calculateTWD() {
    const amount = this.form.get('amount')?.value;
    const rate = this.form.get('exchangeRate')?.value;
    if (amount && rate) {
      const twd = Math.round(amount * rate);
      this.form.patchValue({ amountInTWD: twd }, { emitEvent: false });
    }
  }

  /**
   * 驗證支出日期是否在旅程日期範圍內
   */
  private tripDateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const dateStr = control.value;
      if (!dateStr) {
        return null; // 讓 required validator 處理
      }

      if (!this.tripStartDate || !this.tripEndDate) {
        return null; // 沒有旅程日期範圍
      }

      try {
        const expenseDate = new Date(dateStr);
        const startDate = this.tripStartDate.toDate();
        const endDate = this.tripEndDate.toDate();

        // 設置時間為開始和結束的午夜，以便正確比較日期
        expenseDate.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        // 檢查日期是否在範圍內
        if (expenseDate < startDate || expenseDate > endDate) {
          return {
            dateOutOfRange: {
              value: dateStr,
              start: this.tripStartDate.toDate().toISOString().split('T')[0],
              end: this.tripEndDate.toDate().toISOString().split('T')[0]
            }
          };
        }

        return null;
      } catch {
        return null; // 日期格式無效，讓其他驗證器處理
      }
    };
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files) as File[];

    // 檢查與現有檔案的總數限制（最多 10 張）
    const totalCount = this.newFiles.length + selectedFiles.length;
    if (totalCount > 10) {
      alert(`最多只能上傳 10 張圖片，目前已有 ${this.newFiles.length} 張，無法新增 ${selectedFiles.length} 張。`);
      return;
    }

    // 驗證每個選定的檔案
    const validFiles: File[] = [];
    for (const file of selectedFiles) {
      const validation = validateImageFile(file, 10);
      if (!validation.valid) {
        alert(`檔案 "${file.name}" 驗證失敗：${validation.error}`);
      } else {
        validFiles.push(file);
      }
    }

    // 新增有效的檔案
    validFiles.forEach((file: File) => {
      this.newFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrls.push({ url: e.target.result, isNew: true, file: file });
      };
      reader.onerror = () => {
        alert(`無法讀取檔案 "${file.name}"`);
      };
      reader.readAsDataURL(file);
    });

    // 重置 input
    event.target.value = '';
  }

  removeImage(index: number) {
    const item = this.previewUrls[index];
    if (item.isNew && item.file) {
      // Remove from newFiles
      this.newFiles = this.newFiles.filter(f => f !== item.file);
    }
    // Remove from previews (which also tracks "final" list)
    this.previewUrls.splice(index, 1);
  }

  async uploadSingleFile(file: File): Promise<{ url: string | null; error?: string }> {
    try {
      // 驗證檔案
      const validation = validateImageFile(file, 10);
      if (!validation.valid) {
        return { url: null, error: validation.error };
      }

      // 壓縮圖片（同時處理 HEIC 轉換）
      const compressedBlob = await compressImage(file, 1024, 1024, 0.8);

      // 使用 .jpg 副檔名
      const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const path = `receipts/${this.tripId}/${new Date().getTime()}_${Math.random().toString(36).substring(7)}_${fileName}.jpg`;

      const storageRef = ref(this.storage, path);
      const result = await uploadBytes(storageRef, compressedBlob);
      const url = await getDownloadURL(result.ref);
      return { url };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知錯誤';
      console.error('圖片上傳失敗:', error);
      return {
        url: null,
        error: `上傳失敗：${errorMessage}`
      };
    }
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;

    try {
      const formVal = this.form.value;
      const user = this.authService.currentUser();

      // 驗證新上傳的圖片
      if (this.newFiles.length > 0) {
        const validation = validateMultipleImages(this.newFiles, 10, 10);
        if (!validation.valid) {
          alert(`圖片驗證失敗：\n${validation.errors.join('\n')}`);
          return;
        }
      }

      // 上傳圖片
      this.uploading = true;
      const uploadedUrls: string[] = [];
      const uploadErrors: string[] = [];

      // 1. 保留未移除的現有 URL
      const existingUrls = this.previewUrls.filter(p => !p.isNew).map(p => p.url);
      uploadedUrls.push(...existingUrls);

      // 2. 上傳新檔案
      const uploadPromises = this.newFiles.map(file => this.uploadSingleFile(file));
      const uploadResults = await Promise.all(uploadPromises);

      // 收集上傳的 URL 和錯誤
      uploadResults.forEach((result: any) => {
        if (result.url) {
          uploadedUrls.push(result.url);
        } else if (result.error) {
          uploadErrors.push(result.error);
        }
      });

      // 如果有上傳錯誤，提示使用者
      if (uploadErrors.length > 0) {
        alert(`部分圖片上傳失敗：\n${uploadErrors.join('\n')}\n\n已成功上傳 ${uploadedUrls.length} 張圖片`);
      }

      this.uploading = false;

      const expenseData: any = {
        tripId: this.tripId,
        item: formVal.item,
        expenseDate: Timestamp.fromDate(new Date(formVal.expenseDate)),
        amount: Number(formVal.amount),
        currency: formVal.currency,
        exchangeRate: Number(formVal.exchangeRate),
        exchangeRateTime: Timestamp.now(),
        amountInTWD: Number(formVal.amountInTWD),
        category: formVal.category,
        paymentMethod: formVal.paymentMethod,
        note: formVal.note,
        receiptImageUrls: uploadedUrls,
        receiptImageUrl: uploadedUrls.length > 0 ? uploadedUrls[0] : null, // Backward compat
        updatedAt: Timestamp.now()
      };

      if (this.expense) {
        // Edit
        await this.expenseService.updateExpense(this.tripId, this.expense.id!, {
          ...expenseData,
          updatedBy: user?.id
        });
      } else {
        // Add
        expenseData.submittedAt = Timestamp.now();
        expenseData.submittedBy = user?.id;
        expenseData.submittedByName = user?.displayName || 'Unknown';
        expenseData.submittedByEmail = user?.email || 'Unknown';

        await this.expenseService.addExpense(this.tripId, expenseData);
      }
      this.close.emit();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知錯誤';
      console.error('提交失敗:', err);
      alert(`提交失敗：${errorMessage}`);
    } finally {
      this.loading = false;
      this.uploading = false;
    }
  }

  /**
   * 檢查日期欄位是否無效
   */
  isDateInvalid(): boolean {
    const control = this.form.get('expenseDate');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  /**
   * 取得日期範圍錯誤的詳細資訊
   */
  dateRangeError(): { start: string; end: string } | null {
    const control = this.form.get('expenseDate');
    if (!control || !control.hasError('dateOutOfRange')) {
      return null;
    }
    const error = control.getError('dateOutOfRange');
    return {
      start: error?.start || '',
      end: error?.end || ''
    };
  }

  addCategory() {
    const categoryName = this.newCategory().trim();
    if (!categoryName) {
      alert('請輸入類別名稱');
      return;
    }

    // 檢查是否已存在
    if (this.categories.includes(categoryName)) {
      alert(`「${categoryName}」已存在`);
      return;
    }

    // 計算新的 order（最後一個 order + 1）
    const newOrder = this.categories.length;

    // 添加到資料庫（轉換 Promise 為 Observable）
    from(this.categoryService.addCategory({ name: categoryName, order: newOrder })).subscribe({
      next: () => {
        // 更新本地陣列
        this.categories = [...this.categories, categoryName];
        // 設定表單值
        this.form.patchValue({ category: categoryName });
        // 清空輸入並關閉
        this.newCategory.set('');
        this.showAddCategoryInput.set(false);
      },
      error: (err: any) => {
        console.error('添加類別失敗:', err);
        alert(`添加類別失敗：${err instanceof Error ? err.message : '未知錯誤'}`);
      }
    });
  }

  addPaymentMethod() {
    const methodName = this.newPaymentMethod().trim();
    if (!methodName) {
      alert('請輸入支付方式');
      return;
    }

    // 檢查是否已存在
    if (this.paymentMethods.includes(methodName)) {
      alert(`「${methodName}」已存在`);
      return;
    }

    // 計算新的 order（最後一個 order + 1）
    const newOrder = this.paymentMethods.length;

    // 添加到資料庫（轉換 Promise 為 Observable）
    from(this.paymentMethodService.addPaymentMethod({ name: methodName, order: newOrder })).subscribe({
      next: () => {
        // 更新本地陣列
        this.paymentMethods = [...this.paymentMethods, methodName];
        // 設定表單值
        this.form.patchValue({ paymentMethod: methodName });
        // 清空輸入並關閉
        this.newPaymentMethod.set('');
        this.showAddPaymentMethodInput.set(false);
      },
      error: (err: any) => {
        console.error('添加支付方式失敗:', err);
        alert(`添加支付方式失敗：${err instanceof Error ? err.message : '未知錯誤'}`);
      }
    });
  }

  cancel() {
    this.close.emit();
  }
}