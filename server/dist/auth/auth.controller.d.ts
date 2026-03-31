import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    signUp(body: {
        email: string;
        password: string;
    }): Promise<{
        user: import("@supabase/auth-js").User | null;
        session: import("@supabase/auth-js").Session | null;
    }>;
    signIn(body: {
        email: string;
        password: string;
    }): Promise<{
        user: import("@supabase/auth-js").User;
        session: import("@supabase/auth-js").Session;
        weakPassword?: import("@supabase/auth-js").WeakPassword;
    }>;
    signInWithGoogle(): Promise<{
        provider: import("@supabase/auth-js").Provider;
        url: string;
    }>;
    signOut(req: any): Promise<void>;
    getProfile(req: any): any;
}
