import { SupabaseService } from '../supabase/supabase.service';
export declare class AuthService {
    private supabase;
    constructor(supabase: SupabaseService);
    signUp(email: string, password: string): Promise<{
        user: import("@supabase/auth-js").User | null;
        session: import("@supabase/auth-js").Session | null;
    }>;
    signIn(email: string, password: string): Promise<{
        user: import("@supabase/auth-js").User;
        session: import("@supabase/auth-js").Session;
        weakPassword?: import("@supabase/auth-js").WeakPassword;
    }>;
    signInWithGoogle(): Promise<{
        provider: import("@supabase/auth-js").Provider;
        url: string;
    }>;
    signOut(accessToken: string): Promise<void>;
    getUser(accessToken: string): Promise<import("@supabase/auth-js").User>;
}
