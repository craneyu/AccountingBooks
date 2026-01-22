import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense.service';
import { ExchangeRateService } from '../../core/services/exchange-rate.service';
import { AuthService } from '../../core/services/auth.service';
import { Expense } from '../../core/models/expense.model';
import { Timestamp } from 'firebase/firestore';
import { Storage } from '@angular/fire/storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faSpinner, faSync, faCamera } from '@fortawesome/free-solid-svg-icons';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { compressImage } from '../../core/utils/image-utils';

@Component({
  selector: 'app-expense-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './expense-dialog.html',
  styleUrl: './expense-dialog.scss'
})
export class ExpenseDialogComponent implements OnInit, OnChanges {
  @Input() tripId!: string;
  @Input() tripCurrency: string = 'TWD';
  @Input() expense: Expense | null = null;
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private exchangeRateService = inject(ExchangeRateService);
  private authService = inject(AuthService);
  private storage = inject(Storage);

  form!: FormGroup;
  loading = false;
  rateLoading = false;
  uploading = false;
  
  faTimes = faTimes;
  faSpinner = faSpinner;
  faSync = faSync;
  faCamera = faCamera;

  // Constants
  currencies = ['TWD', 'JPY', 'USD', 'EUR', 'KRW', 'CNY', 'THB', 'GBP'];
  categories = ['餐飲', '交通', '住宿', '購物', '娛樂', '其他'];
  paymentMethods = ['現金', '信用卡', '行動支付'];

  newFiles: File[] = [];
  previewUrls: { url: string, isNew: boolean, file?: File }[] = [];

  ngOnChanges(changes: SimpleChanges) {
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

    this.form = this.fb.group({
      item: [this.expense?.item || '', Validators.required],
      expenseDate: [this.expense?.expenseDate ? this.expense.expenseDate.toDate().toISOString().substring(0, 10) : today, Validators.required],
      amount: [this.expense?.amount || null, [Validators.required, Validators.min(0)]],
      currency: [this.expense?.currency || this.tripCurrency, Validators.required],
      exchangeRate: [this.expense?.exchangeRate || 1, Validators.required],
      amountInTWD: [this.expense?.amountInTWD || null],
      category: [this.expense?.category || '餐飲', Validators.required],
      paymentMethod: [this.expense?.paymentMethod || '現金', Validators.required],
      note: [this.expense?.note || '']
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

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: any) => {
        this.newFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previewUrls.push({ url: e.target.result, isNew: true, file: file });
        };
        reader.readAsDataURL(file);
      });
    }
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

  async uploadSingleFile(file: File): Promise<string | null> {
    try {
        // Compress image before upload
        const compressedBlob = await compressImage(file, 1024, 1024, 0.8);
        
        // Use .jpg extension
        const fileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const path = `receipts/${this.tripId}/${new Date().getTime()}_${Math.random().toString(36).substring(7)}_${fileName}.jpg`;
        
        const storageRef = ref(this.storage, path);
        const result = await uploadBytes(storageRef, compressedBlob);
        return await getDownloadURL(result.ref);
    } catch (error) {
        console.error('Upload failed', error);
        return null;
    }
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;

    try {
      const formVal = this.form.value;
      const user = this.authService.currentUser();
      
      // Upload new images
      this.uploading = true;
      const uploadedUrls: string[] = [];
      
      // 1. Keep existing URLs that weren't removed
      const existingUrls = this.previewUrls.filter(p => !p.isNew).map(p => p.url);
      uploadedUrls.push(...existingUrls);

      // 2. Upload new files
      const uploadPromises = this.newFiles.map(file => this.uploadSingleFile(file));
      const newUrls = await Promise.all(uploadPromises);
      
      // Filter out failed uploads
      newUrls.forEach(url => {
        if (url) uploadedUrls.push(url);
      });
      
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
        updatedAt: Timestamp.now(),
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
      console.error(err);
      // Show error
    } finally {
      this.loading = false;
      this.uploading = false;
    }
  }

  cancel() {
    this.close.emit();
  }
}