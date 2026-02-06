export enum UserRole {
  ADMIN = 'Admin',
  KASIR = 'Kasir',
}

export enum TransactionType {
  KAS_MASUK = 'Kas Masuk',
  KAS_KELUAR = 'Kas Keluar',
}

export enum ReimbursementStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export const QueryKeys = {
  SESSION: 'session',
  PROFILE: 'profile',
  OUTLET: 'outlet',
  TRANSACTIONS: 'transactions',
  DASHBOARD: 'dashboard',
} as const;
