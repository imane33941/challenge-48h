import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class GameService {
  constructor(private supabase: SupabaseService) {}

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createRoom(hostId: string, dto: CreateRoomDto) {
    const { data, error } = await this.supabase.getClient()
      .from('game_rooms')
      .insert({
        host_id: hostId,
        exercise_id: dto.exercise_id,
        code: this.generateCode(),
        status: 'waiting',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async joinRoom(guestId: string, code: string) {
    const { data: room, error: findError } = await this.supabase.getClient()
      .from('game_rooms')
      .select('*')
      .eq('code', code)
      .eq('status', 'waiting')
      .single();

    if (findError || !room) throw new Error('Salle introuvable');

    const { data, error } = await this.supabase.getClient()
      .from('game_rooms')
      .update({ guest_id: guestId, status: 'playing' })
      .eq('id', room.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createInvitation(hostId: string, guestId: string, exerciseId: string) {
    const room = await this.createRoom(hostId, { exercise_id: exerciseId });

    const { data, error } = await this.supabase.getClient()
      .from('invitations')
      .insert({
        host_id: hostId,
        guest_id: guestId,
        room_id: room.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { invitation: data, room };
  }

  async updateInvitation(invitationId: string, status: 'accepted' | 'declined') {
    const { data, error } = await this.supabase.getClient()
      .from('invitations')
      .update({ status })
      .eq('id', invitationId)
      .select('*, game_rooms(*)')
      .single();

    if (error) throw error;
    return data;
  }

  async saveResult(roomId: string, userId: string, score: number) {
    const { data, error } = await this.supabase.getClient()
      .from('game_results')
      .insert({
        room_id: roomId,
        user_id: userId,
        score,
        finished_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async finishRoom(roomId: string) {
    const { error } = await this.supabase.getClient()
      .from('game_rooms')
      .update({ status: 'finished' })
      .eq('id', roomId);

    if (error) throw error;
  }
}