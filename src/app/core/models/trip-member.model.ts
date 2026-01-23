import { Timestamp } from 'firebase/firestore';

export type TripMemberRole = 'owner' | 'editor' | 'viewer';

export interface TripMember {
  id: string; // userId
  userId: string;
  role: TripMemberRole;
  displayName: string;
  email: string;
  photoURL?: string;
  joinedAt: Timestamp;
  addedBy: string;
  updatedAt?: Timestamp;
}
