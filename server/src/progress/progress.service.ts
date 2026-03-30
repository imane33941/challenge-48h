import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProgressDto } from './dto/create-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private supabase: SupabaseService) {}

  async create(userId: string, dto: CreateProgressDto) {
    const { data, error } = await this.supabase.getClient()
      .from('progress')
      .insert({
        user_id: userId,
        ...dto,
        completed_at: dto.completed ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findByUser(userId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('progress')
      .select('*, exercises(*)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findByExercise(userId: string, exerciseId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .single();

    if (error) throw error;
    return data;
  }
}