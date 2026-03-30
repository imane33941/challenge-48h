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

  async createMany(exercises: CreateExerciseDto[]) {
    const { data, error } = await this.supabase.getClient()
      .from('exercises')
      .insert(exercises)
      .select();

    if (error) throw error;
    return data;
  }

  async findAll(niveau?: number, serie?: number) {
    let query = this.supabase.getClient()
      .from('exercises')
      .select('*');

    if (niveau) query = query.eq('niveau', niveau);
    if (serie) query = query.eq('serie', serie);

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