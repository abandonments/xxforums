export enum UserRole {
  Root = 'Root',
  Admin = 'Admin',
  Mod = 'Mod',
  Elite = 'Elite',
  VIP = 'VIP',
  Rich = 'Rich',
  User = 'User',
  Banned = 'Banned',
}

export type UserProfile = {
    id: number;
    firebase_uid: string;
    email: string;
    username:string;
    reputation: number;
    role: UserRole;
    warnings: number;
    is_banned: boolean;
    banned_until: Date | null;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    signature?: string;
    musicUrl?: string;
    musicAutoplay?: boolean;
    customCss?: string;
    postCount?: number;
    profileViews?: number;
    trustScore?: number;
    vouchCount?: number;
    inventory?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
