import { supabase, Profile } from '../lib/supabase';
import { SupabaseService, ServiceResponse } from './supabaseService';
import { UserRole } from '../constants';
import { Session } from '@supabase/supabase-js';

export class AuthService extends SupabaseService {
    async getSession(): Promise<ServiceResponse<Session>> {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            return this.success(session);
        } catch (error) {
            return this.fail(this.handleError(error));
        }
    }

    async signIn(email: string, password: string): Promise<ServiceResponse<Session>> {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return this.success(data.session);
        } catch (error) {
            return this.fail(this.handleError(error));
        }
    }

    async signOut(): Promise<ServiceResponse<void>> {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return this.success(undefined);
        } catch (error) {
            return this.fail(this.handleError(error));
        }
    }

    async getUserProfile(userId: string): Promise<ServiceResponse<Profile>> {
        try {
            // 1. Try fetch existing profile
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (profile) {
                return this.success(profile as Profile);
            }

            // 2. If not found, create new profile
            return await this.createProfile(userId);

        } catch (error) {
            return this.fail(this.handleError(error));
        }
    }

    private async createProfile(userId: string): Promise<ServiceResponse<Profile>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const email = user?.email;
            const username = email?.split('@')[0] || 'user';

            // Check for first user to assign Admin role
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            const isFirstUser = (count || 0) === 0;
            const role = isFirstUser ? UserRole.ADMIN : UserRole.KASIR;

            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    username: username,
                    nama: username,
                    role: role,
                })
                .select()
                .single();

            if (error) throw error;

            return this.success(newProfile as Profile);

        } catch (error) {
            // Fallback for critical failure logic (optional, but keeping consistent with original store logic)
            console.error('Create profile critical fail', error);
            return this.fail("Failed to create user profile");
        }
    }
}

export const authService = new AuthService();
