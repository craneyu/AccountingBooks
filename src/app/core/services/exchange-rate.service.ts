import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { ExchangeRate } from '../models/exchange-rate.model';
import { environment } from '../../../environments/environment';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private http = inject(HttpClient);
  private firestore = inject(Firestore);

  // Simple in-memory cache for the session
  private memCache = new Map<string, number>();

  getRate(currency: string): Observable<number> {
    if (currency === 'TWD') return of(1);

    const today = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    const docId = `${currency}_${today}`;
    
    // 1. Check Memory Cache
    if (this.memCache.has(docId)) {
      return of(this.memCache.get(docId)!);
    }

    // 2. Check Firestore
    const docRef = doc(this.firestore, 'exchangeRates', docId);
    
    return from(getDoc(docRef)).pipe(
      switchMap(snap => {
        if (snap.exists()) {
          const data = snap.data() as ExchangeRate;
          this.memCache.set(docId, data.rate);
          return of(data.rate);
        } else {
          // 3. Fetch from API
          return this.fetchAndStoreRate(currency, docId);
        }
      })
    );
  }

  private fetchAndStoreRate(currency: string, docId: string): Observable<number> {
    const url = `${environment.exchangeRateApiBaseUrl}${currency}`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const rate = response.rates['TWD'];
        if (!rate) {
          console.error(`Failed to get TWD rate for ${currency} from API response:`, response);
          throw new Error(`TWD rate not found for ${currency}`);
        }
        return rate;
      }),
      switchMap(rate => {
        const now = Timestamp.now();
        const record: ExchangeRate = {
          id: docId,
          baseCurrency: currency,
          targetCurrency: 'TWD',
          rate: rate,
          date: new Date().toISOString().split('T')[0],
          fetchedAt: now,
          source: 'ExchangeRate-API'
        };

        // Save to Firestore and return rate
        return from(
          setDoc(doc(this.firestore, 'exchangeRates', docId), record).then(() => {
            this.memCache.set(docId, rate);
            return rate;
          })
        );
      }),
      catchError(err => {
        console.error(`Failed to fetch exchange rate for ${currency}:`, err);
        // 返回 1 作為備用（用戶可以手動輸入）
        return of(1);
      })
    );
  }
}