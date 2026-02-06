// ============================================
// REACT QUERY HOOKS FOR DATA FETCHING
// ============================================

import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { supabase, Profile, Outlet, Transaction, TransactionItem, Reimbursement, MasterItem, MasterCategory } from './supabase';

// ============================================
// QUERY KEYS
// ============================================
export const queryKeys = {
    // Auth related
    profile: ['profile'] as QueryKey,
    outlets: ['outlets'] as QueryKey,
    
    // Transactions
    transactions: (outletId?: string) => ['transactions', outletId] as QueryKey,
    transactionById: (id: string) => ['transaction', id] as QueryKey,
    transactionItems: (transactionId: string) => ['transactionItems', transactionId] as QueryKey,
    
    // Dashboard
    dashboard: (outletId?: string) => ['dashboard', outletId] as QueryKey,
    
    // Reimbursements
    reimbursements: (outletId?: string) => ['reimbursements', outletId] as QueryKey,
    reimbursementById: (id: string) => ['reimbursement', id] as QueryKey,
    
    // Users
    users: ['users'] as QueryKey,
    userById: (id: string) => ['user', id] as QueryKey,
    
    // Master data
    masterItems: ['masterItems'] as QueryKey,
    masterCategories: ['masterCategories'] as QueryKey,
    
    // Reports
    dailyReport: (outletId?: string, date?: string) => ['dailyReport', outletId, date] as QueryKey,
    history: (outletId?: string, filters?: any) => ['history', outletId, filters] as QueryKey,
};

// ============================================
// AUTH HOOKS
// ============================================
export const useProfileQuery = (userId: string) => {
    return useQuery({
        queryKey: queryKeys.profile,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data as Profile;
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const useOutletsQuery = () => {
    return useQuery({
        queryKey: queryKeys.outlets,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('outlets')
                .select('*')
                .order('nama_outlet');

            if (error) throw error;
            return data as Outlet[];
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

// ============================================
// TRANSACTION HOOKS
// ============================================
export const useTransactionsQuery = (outletId?: string, options?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
}) => {
    return useQuery({
        queryKey: queryKeys.transactions(outletId),
        queryFn: async () => {
            let query = supabase
                .from('transactions')
                .select(`
                    *,
                    transaction_items (*),
                    outlets (nama_outlet)
                `)
                .order('tanggal', { ascending: false });

            if (outletId) {
                query = query.eq('outlet_id', outletId);
            }

            if (options?.startDate) {
                query = query.gte('tanggal', options.startDate);
            }

            if (options?.endDate) {
                query = query.lte('tanggal', options.endDate);
            }

            if (options?.page && options?.limit) {
                const offset = (options.page - 1) * options.limit;
                query = query.range(offset, offset + options.limit - 1);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as (Transaction & { transaction_items: TransactionItem[] })[];
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
        enabled: !!outletId || options?.page !== undefined,
    });
};

export const useTransactionByIdQuery = (id: string) => {
    return useQuery({
        queryKey: queryKeys.transactionById(id),
        queryFn: async () => {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    transaction_items (*),
                    outlets (nama_outlet)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data as (Transaction & { transaction_items: TransactionItem[] });
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

// ============================================
// DASHBOARD HOOKS
// ============================================
export const useDashboardQuery = (outletId?: string) => {
    return useQuery({
        queryKey: queryKeys.dashboard(outletId),
        queryFn: async () => {
            if (!outletId) return null;

            // Get today's date in local timezone
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            // Fetch transactions
            const { data: transactions, error: txError } = await supabase
                .from('transactions')
                .select('*, transaction_items(*)')
                .eq('outlet_id', outletId)
                .order('tanggal', { ascending: false });

            if (txError) throw txError;

            // Fetch kas masuk
            const { data: kasMasuk, error: kmError } = await supabase
                .from('kas_masuk')
                .select('*')
                .eq('outlet_id', outletId);

            if (kmError) throw kmError;

            // Get outlet info for saldo
            const { data: outlet, error: outletError } = await supabase
                .from('outlets')
                .select('*')
                .eq('id', outletId)
                .single();

            if (outletError) throw outletError;

            // Calculate dashboard metrics
            const dashboardData = {
                outlet,
                transactions: transactions || [],
                kasMasuk: kasMasuk || [],
                today,
                // Add calculated metrics here
            };

            return dashboardData;
        },
        enabled: !!outletId,
        staleTime: 30 * 1000, // 30 seconds - dashboard should be relatively fresh
    });
};

// ============================================
// REIMBURSEMENT HOOKS
// ============================================
export const useReimbursementsQuery = (outletId?: string) => {
    return useQuery({
        queryKey: queryKeys.reimbursements(outletId),
        queryFn: async () => {
            let query = supabase
                .from('reimbursements')
                .select(`
                    *,
                    outlets (nama_outlet),
                    profiles (nama)
                `)
                .order('created_at', { ascending: false });

            if (outletId) {
                query = query.eq('outlet_id', outletId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data as (Reimbursement & { 
                outlets: Outlet;
                profiles: Profile;
            })[];
        },
        staleTime: 5 * 60 * 1000,
    });
};

// ============================================
// USER MANAGEMENT HOOKS
// ============================================
export const useUsersQuery = () => {
    return useQuery({
        queryKey: queryKeys.users,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    outlets (nama_outlet)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as (Profile & { outlets: Outlet | null })[];
        },
        staleTime: 10 * 60 * 1000,
    });
};

// ============================================
// MASTER DATA HOOKS
// ============================================
export const useMasterItemsQuery = () => {
    return useQuery({
        queryKey: queryKeys.masterItems,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('master_items')
                .select(`
                    *,
                    master_categories (nama_kategori)
                `)
                .order('nama_bahan');

            if (error) throw error;
            return data as (MasterItem & { master_categories: MasterCategory | null })[];
        },
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
};

export const useMasterCategoriesQuery = () => {
    return useQuery({
        queryKey: queryKeys.masterCategories,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('master_categories')
                .select('*')
                .order('nama_kategori');

            if (error) throw error;
            return data as MasterCategory[];
        },
        staleTime: 30 * 60 * 1000,
    });
};

// ============================================
// MUTATION HOOKS
// ============================================
export const useCreateTransactionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (transactionData: {
            outlet_id: string;
            user_id: string;
            tipe: 'Kas Keluar' | 'Kas Masuk';
            tanggal: string;
            grand_total: number;
            items: Omit<TransactionItem, 'id' | 'transaction_id'>[];
        }) => {
            const { items, ...transaction } = transactionData;

            // Create transaction
            const { data: newTransaction, error: txError } = await supabase
                .from('transactions')
                .insert(transaction)
                .select()
                .single();

            if (txError) throw txError;

            // Create transaction items
            if (items.length > 0) {
                const itemsWithTransaction = items.map(item => ({
                    ...item,
                    transaction_id: newTransaction.id,
                }));

                const { error: itemsError } = await supabase
                    .from('transaction_items')
                    .insert(itemsWithTransaction);

                if (itemsError) throw itemsError;
            }

            return newTransaction;
        },
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
            queryClient.invalidateQueries({ queryKey: queryKeys.history() });
        },
    });
};

export const useUpdateTransactionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            id: string;
            updates: Partial<Transaction>;
            items?: Omit<TransactionItem, 'id' | 'transaction_id'>[];
        }) => {
            const { id, updates, items } = data;

            // Update transaction
            const { data: updatedTransaction, error: txError } = await supabase
                .from('transactions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (txError) throw txError;

            // Update items if provided
            if (items) {
                // Delete existing items
                await supabase
                    .from('transaction_items')
                    .delete()
                    .eq('transaction_id', id);

                // Insert new items
                if (items.length > 0) {
                    const itemsWithTransaction = items.map(item => ({
                        ...item,
                        transaction_id: id,
                    }));

                    const { error: itemsError } = await supabase
                        .from('transaction_items')
                        .insert(itemsWithTransaction);

                    if (itemsError) throw itemsError;
                }
            }

            return updatedTransaction;
        },
        onSuccess: (_, variables) => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
            queryClient.invalidateQueries({ queryKey: queryKeys.transactionById(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
            queryClient.invalidateQueries({ queryKey: queryKeys.history() });
        },
    });
};

export const useDeleteTransactionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            // Delete transaction items first (foreign key constraint)
            await supabase
                .from('transaction_items')
                .delete()
                .eq('transaction_id', id);

            // Delete transaction
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
            queryClient.invalidateQueries({ queryKey: queryKeys.history() });
        },
    });
};

// ============================================
// PREFETCHING UTILITIES
// ============================================
export const prefetchData = async (queryClient: any) => {
    // Prefetch common data
    await queryClient.prefetchQuery({
        queryKey: queryKeys.outlets,
        queryFn: async () => {
            const { data } = await supabase.from('outlets').select('*').order('nama_outlet');
            return data;
        },
        staleTime: 10 * 60 * 1000,
    });

    await queryClient.prefetchQuery({
        queryKey: queryKeys.masterItems,
        queryFn: async () => {
            const { data } = await supabase.from('master_items').select('*, master_categories(*)');
            return data;
        },
        staleTime: 30 * 60 * 1000,
    });
};