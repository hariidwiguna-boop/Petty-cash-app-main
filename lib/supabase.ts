import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { UserRole, TransactionType, ReimbursementStatus } from '../constants';

// ============================================
// SUPABASE CONFIGURATION
// ============================================
// Gunakan environment variables untuk keamanan
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validasi bahwa credentials tersedia
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials tidak ditemukan! Pastikan EXPO_PUBLIC_SUPABASE_URL dan EXPO_PUBLIC_SUPABASE_ANON_KEY sudah diatur di environment variables.');
}

// ============================================
// SECURE STORAGE ADAPTER
// ============================================
const ExpoSecureStoreAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    setItem: async (key: string, value: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        await SecureStore.setItemAsync(key, value);
    },
    removeItem: async (key: string): Promise<void> => {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        await SecureStore.deleteItemAsync(key);
    },
};

// ============================================
// SUPABASE CLIENT
// ============================================
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// ============================================
// DATABASE TYPES
// ============================================
export interface Profile {
    id: string;
    username: string;
    nama: string;
    outlet_id: string | null;
    role: UserRole;
    created_at: string;
}

export interface Outlet {
    id: string;
    nama_outlet: string;
    pic_name: string | null;
    saldo_awal: number;
    saldo_limit: number;
    nama_bank: string | null;
    no_rekening: string | null;
    atas_nama: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Transaction {
    id: string;
    tanggal: string;
    outlet_id: string;
    user_id: string;
    tipe: TransactionType;
    grand_total: number;
    status_reimburse: string;
    reimburse_id: string | null;
    local_id: string | null;
    is_synced: boolean;
    created_at: string;
}

export interface TransactionItem {
    id: string;
    transaction_id: string;
    deskripsi: string;
    qty: string;
    satuan: string | null;
    total_harga: number;
}

export interface Attachment {
    id: string;
    transaction_id: string;
    file_name: string;
    storage_path: string;
    file_url: string | null;
}

export interface Reimbursement {
    id: string;
    outlet_id: string;
    user_id: string;
    start_date: string;
    end_date: string;
    total_amount: number;
    status: ReimbursementStatus;
    approved_by: string | null;
    approved_at: string | null;
    notes: string | null;
    created_at: string;
}

export interface MasterItem {
    id: string;
    nama_bahan: string;
    satuan_default: string | null;
    kategori: string | null;
}

export interface MasterCategory {
    id: string;
    nama_kategori: string;
}
