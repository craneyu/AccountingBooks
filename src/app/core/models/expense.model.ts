import { Timestamp } from 'firebase/firestore';

export interface Expense {
  id?: string;
  tripId: string;
  item: string;
  expenseDate: Timestamp;
  amount: number;
  currency: string;
  exchangeRate: number; // Rate to TWD (1 Foreign = X TWD)
  exchangeRateTime: Timestamp;
  amountInTWD: number;
  category: string;
  paymentMethod: string;
  receiptImageUrl?: string; // @deprecated Use receiptImageUrls
  receiptImageUrls?: string[];
  note?: string;
  submittedAt: Timestamp;
  submittedBy: string;
  submittedByName: string;
  submittedByEmail: string;
  updatedAt: Timestamp;
  updatedBy?: string;
}
