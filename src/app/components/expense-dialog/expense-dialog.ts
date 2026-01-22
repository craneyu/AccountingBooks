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

  selectedFile: File | null = null;
  previewUrl: string | null = null;

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

    if (this.expense?.receiptImageUrl) {
        this.previewUrl = this.expense.receiptImageUrl;
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadFile(): Promise<string | null> {
    if (!this.selectedFile) return null;
    try {
        const path = `receipts/${this.tripId}/${new Date().getTime()}_${this.selectedFile.name}`;
        const storageRef = ref(this.storage, path);
        const result = await uploadBytes(storageRef, this.selectedFile);
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
      
      // Upload image if selected
      let imageUrl = this.expense?.receiptImageUrl;
      if (this.selectedFile) {
        this.uploading = true;
        const url = await this.uploadFile();
        if (url) imageUrl = url;
        this.uploading = false;
      }

      const expenseData: any = {
        tripId: this.tripId,
        item: formVal.item,
        expenseDate: Timestamp.fromDate(new Date(formVal.expenseDate)),
        amount: Number(formVal.amount),
        currency: formVal.currency,
        exchangeRate: Number(formVal.exchangeRate),
        exchangeRateTime: Timestamp.now(), // Should track when rate was fetched, but now is ok
        amountInTWD: Number(formVal.amountInTWD),
        category: formVal.category,
        paymentMethod: formVal.paymentMethod,
        note: formVal.note,
        receiptImageUrl: imageUrl,
        updatedAt: Timestamp.now(),
        // If edit, these might not change but for simplicity:
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