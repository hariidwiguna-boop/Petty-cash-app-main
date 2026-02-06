import { create } from 'zustand';
import { supabase, Profile, Outlet } from '../lib/supabase';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { UserRole } from '../constants';

interface AuthState {
    session: Session | null;
    profile: Profile | null;
    outlet: Outlet | null;
    adminSelectedOutlet: Outlet | null; // For admin monitoring
    isLoading: boolean;
    isInitialized: boolean;
    isAdmin: boolean;

    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    setAdminSelectedOutlet: (outlet: Outlet | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    profile: null,
    outlet: null,
    adminSelectedOutlet: null,
    isLoading: true,
    isInitialized: false,
    isAdmin: false,

    setAdminSelectedOutlet: (outlet) => set({ adminSelectedOutlet: outlet }),

    initialize: async () => {
        try {
            const { data: session } = await authService.getSession();
            set({ session, isLoading: false, isInitialized: true });

            if (session) {
                await get().fetchProfile();
            }

            // Keep strict listener for auth state changes
            supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, session: Session | null) => {
                set({ session });
                if (session) {
                    await get().fetchProfile();
                } else {
                    set({ profile: null, outlet: null, isAdmin: false });
                }
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
            set({ isLoading: false, isInitialized: true });
        }
    },

    signIn: async (email: string, password: string) => {
        set({ isLoading: true });

        const { data: session, error } = await authService.signIn(email, password);

        if (error) {
            set({ isLoading: false });
            return { error };
        }

        set({ session, isLoading: false });
        await get().fetchProfile();
        return { error: null };
    },

    signOut: async () => {
        // Optimistic Logout: Clear state immediately
        set({ session: null, profile: null, outlet: null, isAdmin: false, isLoading: false });

        await authService.signOut();
    },

    fetchProfile: async () => {
        const { session } = get();
        if (!session) return;

        try {
            const { data: profile, error } = await authService.getUserProfile(session.user.id);

            if (error || !profile) {
                console.error('Profile fetch error:', error);
                throw new Error('Gagal memuat profile pengguna.');
            }

            console.log('Found profile:', profile);
            const isAdmin = profile.role === UserRole.ADMIN;
            set({ profile, isAdmin });

            // Fetch outlet if assigned
            if (profile.outlet_id) {
                const { data: outlet } = await supabase
                    .from('outlets')
                    .select('*')
                    .eq('id', profile.outlet_id)
                    .single();

                if (outlet) {
                    set({ outlet });
                }
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            // Non-critical error shouldn't crash the app, but log it.
        }
    },
}));
