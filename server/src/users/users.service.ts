import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async create(userId: string, dto: CreateUserDto) {
    const { data, error } = await this.supabase.getClient()
      .from('users')
      .insert({
        id: userId,
        role: 'child',
        username: dto.username,
        first_name: dto.firstName,
        last_name: dto.lastName,
        age: dto.age,
        school_level_id: dto.school_level_id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findOne(userId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async update(userId: string, dto: Partial<CreateUserDto>) {
    const { data, error } = await this.supabase.getClient()
      .from('users')
      .update(dto)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}