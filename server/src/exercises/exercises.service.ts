import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(private supabase: SupabaseService) {}

  async create(dto: CreateExerciseDto) {
    const { data, error } = await this.supabase.getClient()
      .from('exercises')
      .insert(dto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(level?: number, subject?: string) {
    let query = this.supabase.getClient()
      .from('exercises')
      .select('*');

    if (level) query = query.eq('level', level);
    if (subject) query = query.eq('subject', subject);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase.getClient()
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}