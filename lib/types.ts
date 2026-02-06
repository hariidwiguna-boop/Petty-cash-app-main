// ============================================
// EXTENDED TYPES FOR APPLICATION
// ============================================

import { Transaction, TransactionItem, Outlet, Profile } from './supabase';
import { UserRole } from '../constants';

// ============================================
// TRANSACTION WITH ITEMS TYPE
// ============================================
export interface TransactionWithItems extends Transaction {
    transaction_items: TransactionItem[];
}

// ============================================
// MODAL TYPES
// ============================================
export interface ModalConfig {
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    onConfirm?: () => void;
}

// ============================================
// EDIT FORM TYPES
// ============================================
export interface EditTransactionItem {
    id: string | null;
    deskripsi: string;
    qty: string;
    satuan: string;
    harga: string;
}

export interface EditFormData {
    date: string;
    items: EditTransactionItem[];
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T = any> {
    data: T | null;
    error: string | null;
    message?: string;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        limit: number;
    };
}

// ============================================
// FORM EVENT TYPES
// ============================================
export interface TextInputChangeEvent {
    nativeEvent: {
        eventCount: number;
        target: number;
        text: string;
    };
}

export interface DatePickerChangeEvent {
    type: string;
    nativeEvent: {
        timestamp: number;
        utcOffset: number;
    };
}

// ============================================
// TRANSACTION FORM TYPES
// ============================================
export interface TransactionFormState {
    deskripsi: string;
    qty: string;
    satuan: string;
    harga: string;
    image: string | null;
}

export interface TransactionItemForm {
    deskripsi: string;
    qty: number;
    satuan: string;
    total_harga: number;
}

// ============================================
// OUTLET FORM TYPES
// ============================================
export interface OutletFormData {
    nama_outlet: string;
    pic_name: string;
    saldo_awal: string;
    saldo_limit: string;
    nama_bank: string;
    no_rekening: string;
    atas_nama: string;
    is_active: boolean;
}

// ============================================
// USER FORM TYPES
// ============================================
export interface UserFormData {
    username: string;
    nama: string;
    role: UserRole;
    outlet_id: string | null;
    password?: string;
}

// ============================================
// ERROR TYPES
// ============================================
export interface AppError {
    message: string;
    code?: string;
    status?: number;
    details?: Record<string, any>;
}

export interface ValidationError {
    field: string;
    message: string;
}

// ============================================
// DASHBOARD DATA TYPES
// ============================================
export interface DashboardMetrics {
    saldoSekarang: number;
    saldoAwal: number;
    kasAwalHariIni: number;
    kasMasukHariIni: number;
    kasKeluarHariIni: number;
    totalKeluar: number;
    totalMasuk: number;
    txCountToday: number;
    biggestExpense: string;
    recentTransactions: TransactionWithItems[];
    todayTransactions: TransactionWithItems[];
}

// ============================================
// REPORT TYPES
// ============================================
export interface DailyReportData {
    date: string;
    outlet: Outlet;
    transactions: TransactionWithItems[];
    summary: {
        totalMasuk: number;
        totalKeluar: number;
        saldoAwal: number;
        saldoAkhir: number;
        transaksiCount: number;
    };
}

export interface OutletReportSummary {
    outlet: Outlet;
    totalTransactions: number;
    totalAmount: number;
    averagePerTransaction: number;
    lastTransactionDate: string;
}

// ============================================
// EXPORT TYPES
// ============================================
export interface ExportData {
    filename: string;
    data: any[];
    headers: string[];
}

// ============================================
// SUPABASE QUERY TYPES
// ============================================
export interface SupabaseQueryError {
    message: string;
    details: string;
    hint: string;
    code: string;
}

export interface SupabaseQueryResult<T> {
    data: T | null;
    error: SupabaseQueryError | null;
    count: number | null;
}

// ============================================
// NAVIGATION TYPES
// ============================================
export interface NavigationParams {
    [key: string]: string | number | boolean | undefined;
}

// ============================================
// UTILITY TYPES
// ============================================
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;