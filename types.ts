
export enum UserRole {
  ROOT = 'Root',
  ADMIN = 'Admin',
  MOD = 'Mod',
  ELITE = 'Elite',
  VIP = 'VIP',
  RICH = 'Rich',
  USER = 'User',
  BANNED = 'Banned'
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: UserRole;
  userId?: number;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  signature?: string;
  musicUrl?: string;
  musicAutoplay?: boolean;
  customCss?: string;
  profileViews?: number;
  inventory?: string[];
  reputation?: number;
  credits?: number;
  postCount?: number; 
  warnings?: number;
  trustScore?: number;
  vouchCount?: number;
  createdAt?: any;
  lastActive?: any;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  authorName: string;
  replyCount: number;
  reputation: number;
  isSticky: boolean;
  isLocked: boolean;
  isHidden?: boolean;
  prefix?: string;
  tradeStatus?: 'OPEN' | 'SOLD' | 'BUYING' | 'SELLING';
  createdAt: any;
  lastPostAt: any;
}

export interface Reply {
  id: string;
  threadId: string;
  content: string;
  author: string;
  authorName: string;
  reputation: number;
  createdAt: any;
}

export interface Shout {
  id: string;
  author: string;
  authorName: string;
  role: UserRole;
  content: string;
  createdAt: any;
}

export interface ModLog {
  id?: string;
  action: 'delete' | 'warn' | 'ban' | 'lock' | 'sticky' | 'report_resolve';
  targetId: string;
  targetType: 'thread' | 'reply' | 'user';
  moderatorId: string;
  moderatorName: string;
  reason: string;
  createdAt: any;
}

export interface Report {
  id?: string;
  targetId: string;
  targetType: 'thread' | 'reply';
  reporterId: string;
  reason: string;
  status: 'open' | 'resolved';
  createdAt: any;
}









export interface Payment {
  id: string;
  userId: string;
  username: string;
  plan: UserRole;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'expired';
  txHash?: string;
  address: string;
  createdAt: any;
}
