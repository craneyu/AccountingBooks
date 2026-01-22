import { Timestamp } from 'firebase/firestore';

export interface Trip {
  id?: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'active' | 'inactive';
  createdAt?: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  currency: string;
  coverImage?: string;
  description?: string;
}
