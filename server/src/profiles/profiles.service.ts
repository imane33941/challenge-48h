import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private supabase: SupabaseService) {}

  async create(userId: string, dto: CreateProfileDto) {
    const { data, error } = await this.supabase.getClient()
      .from('profiles')
      .insert({
        id: userId,
        role: 'child',
        username: dto.username,
        age: dto.age,
        level: dto.level,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findOne(userId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async update(userId: string, dto: Partial<CreateProfileDto>) {
    const { data, error } = await this.supabase.getClient()
      .from('profiles')
      .update(dto)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}