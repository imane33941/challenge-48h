import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private supabase: SupabaseService) {}

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.getClient().auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.getClient().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.getClient().auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    return data;
  }

  async signOut(accessToken: string) {
    const { error } = await this.supabase.getClient().auth.admin.signOut(accessToken);
    if (error) throw error;
  }

  async getUser(accessToken: string) {
    const { data, error } = await this.supabase.getClient().auth.getUser(accessToken);
    if (error) throw error;
    return data.user;
  }
}