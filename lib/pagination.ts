// ============================================
// PAGINATION UTILITIES
// ============================================

export interface PaginationParams {
    page?: number;
    limit?: number;
    offset?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        limit: number;
    };
}

export class PaginationService {
    // ============================================
    // BUILD PAGINATION QUERY
    // ============================================
    static buildPaginationQuery(page: number = 1, limit: number = 20): {
        limit: number;
        offset: number;
        page: number;
    } {
        const offset = (page - 1) * limit;
        return { limit, offset, page };
    }

    // ============================================
    // CALCULATE PAGINATION INFO
    // ============================================
    static calculatePagination<T>(
        data: T[],
        totalCount: number,
        page: number,
        limit: number
    ): PaginatedResult<T> {
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;

        return {
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage,
                hasPreviousPage,
                limit,
            },
        };
    }

    // ============================================
    // PAGINATED FETCH WITH COUNT
    // ============================================
    static async fetchPaginatedData<T>(
        supabase: any,
        tableName: string,
        query: any,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<T>> {
        const { limit: queryLimit, offset, page: currentPage } = this.buildPaginationQuery(page, limit);

        try {
            // Fetch data with pagination
            const { data: paginatedData, error: dataError } = await query
                .range(offset, offset + queryLimit - 1);

            if (dataError) throw dataError;

            // Get total count
            const { count, error: countError } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;

            const totalCount = count || 0;

            return this.calculatePagination(
                paginatedData || [],
                totalCount,
                currentPage,
                queryLimit
            );
        } catch (error) {
            console.error(`Error fetching paginated data from ${tableName}:`, error);
            throw error;
        }
    }

    // ============================================
    // INFINITE SCROLL HELPER
    // ============================================
    static loadMoreData<T>(
        currentData: T[],
        newData: T[],
        page: number,
        limit: number
    ): {
        data: T[];
        hasMore: boolean;
        nextPage: number;
    } {
        const combinedData = [...currentData, ...newData];
        const hasMore = newData.length === limit;
        const nextPage = hasMore ? page + 1 : page;

        return {
            data: combinedData,
            hasMore,
            nextPage,
        };
    }

    // ============================================
    // SEARCH WITH PAGINATION
    // ============================================
    static async searchWithPagination<T>(
        supabase: any,
        tableName: string,
        searchQuery: any,
        searchTerm: string,
        searchColumns: string[],
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<T>> {
        const { limit: queryLimit, offset } = this.buildPaginationQuery(page, limit);

        // Add search filters
        let query = searchQuery;
        if (searchTerm && searchColumns.length > 0) {
            const searchFilters = searchColumns.map(column => 
                `${column}.ilike.%${searchTerm}%`
            ).join(',');
            query = query.or(searchFilters);
        }

        return this.fetchPaginatedData<T>(supabase, tableName, query, page, limit);
    }

    // ============================================
    // DATE RANGE WITH PAGINATION
    // ============================================
    static async fetchWithDateRange<T>(
        supabase: any,
        tableName: string,
        baseQuery: any,
        dateColumn: string,
        startDate?: string,
        endDate?: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginatedResult<T>> {
        let query = baseQuery;

        if (startDate) {
            query = query.gte(dateColumn, startDate);
        }

        if (endDate) {
            query = query.lte(dateColumn, endDate);
        }

        return this.fetchPaginatedData<T>(supabase, tableName, query, page, limit);
    }
}

// ============================================
// REACT HOOKS FOR PAGINATION
// ============================================

import { useState, useEffect } from 'react';

export interface UsePaginationState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        limit: number;
    };
}

export interface UsePaginationOptions {
    initialPage?: number;
    limit?: number;
}

export const usePagination = <T>(
    fetchFunction: (page: number, limit: number) => Promise<PaginatedResult<T>>,
    options: UsePaginationOptions = {}
) => {
    const [state, setState] = useState<UsePaginationState<T>>({
        data: [],
        loading: false,
        error: null,
        pagination: {
            currentPage: options.initialPage || 1,
            totalPages: 0,
            totalCount: 0,
            hasNextPage: false,
            hasPreviousPage: false,
            limit: options.limit || 20,
        },
    });

    const fetchData = async (page: number = state.pagination.currentPage) => {
        setState((prev: UsePaginationState<T>) => ({ ...prev, loading: true, error: null }));

        try {
            const result = await fetchFunction(page, state.pagination.limit);
            
            setState({
                data: result.data,
                loading: false,
                error: null,
                pagination: result.pagination,
            });
        } catch (error) {
            setState((prev: UsePaginationState<T>) => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            }));
        }
    };

    const nextPage = () => {
        if (state.pagination.hasNextPage) {
            fetchData(state.pagination.currentPage + 1);
        }
    };

    const previousPage = () => {
        if (state.pagination.hasPreviousPage) {
            fetchData(state.pagination.currentPage - 1);
        }
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= state.pagination.totalPages) {
            fetchData(page);
        }
    };

    const refresh = () => {
        fetchData(state.pagination.currentPage);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return {
        ...state,
        nextPage,
        previousPage,
        goToPage,
        refresh,
        fetchData,
    };
};