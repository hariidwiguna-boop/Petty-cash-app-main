import { PostgrestError } from '@supabase/supabase-js';

export type ServiceResponse<T> = {
    data: T | null;
    error: string | null;
};

export class SupabaseService {
    protected handleError(error: PostgrestError | Error | unknown): string {
        if (!error) return 'Unknown error occurred';

        console.error('Service Error:', error);

        if (error instanceof Error) {
            return error.message;
        }

        if (typeof error === 'object' && 'message' in error) {
            return (error as any).message;
        }

        return 'An unexpected error occurred';
    }

    protected success<T>(data: T): ServiceResponse<T> {
        return { data, error: null };
    }

    protected fail<T>(message: string): ServiceResponse<T> {
        return { data: null, error: message };
    }
}
