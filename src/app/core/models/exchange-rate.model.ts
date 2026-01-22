import { Timestamp } from 'firebase/firestore';

export interface ExchangeRate {
  id: string; // {currency}_YYYYMMDD
  baseCurrency: string; // Foreign Currency
  targetCurrency: string; // 'TWD'
  rate: number; // 1 Foreign = X TWD
  date: string; // YYYY-MM-DD
  fetchedAt: Timestamp;
  source: string;
}
