import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();
  private duelRooms = new Map<string, { roomId: string; hostId: string; hostName: string }>();

  constructor(private gameService: GameService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) this.userSockets.set(userId, client.id);
  }

  handleDisconnect(client: Socket) {
    const roomId = client.data.roomId;
    if (roomId) {
      this.server.to(roomId).emit('player_disconnected', { socketId: client.id });
    }
    for (const [userId, socketId] of this.userSockets.entries()) {
      if (socketId === client.id) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }

  @SubscribeMessage('send_invitation')
  async handleSendInvitation(
    @MessageBody() payload: { hostId: string; guestId: string; exerciseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { invitation, room } = await this.gameService.createInvitation(
      payload.hostId,
      payload.guestId,
      payload.exerciseId,
    );

    const guestSocketId = this.userSockets.get(payload.guestId);
    if (guestSocketId) {
      this.server.to(guestSocketId).emit('invitation_received', {
        invitationId: invitation.id,
        hostId: payload.hostId,
        exerciseId: payload.exerciseId,
        code: room.code,
      });
    }

    client.emit('invitation_sent', { invitationId: invitation.id, code: room.code });
  }

@SubscribeMessage('accept_invitation')
async handleAcceptInvitation(
  @MessageBody() payload: { invitationId: string; guestId: string },
  @ConnectedSocket() client: Socket,
) {
  const invitation = await this.gameService.updateInvitation(payload.invitationId, 'accepted');
  const room = invitation.game_rooms;

  const { data: updatedRoom, error } = await this.gameService['supabase'].getClient()
    .from('game_rooms')
    .update({ guest_id: payload.guestId, status: 'playing' })
    .eq('id', room.id)
    .select()
    .single();

  if (error) throw error;

  client.join(room.id);
  client.data.roomId = room.id;

  const hostSocketId = this.userSockets.get(invitation.host_id);
  if (hostSocketId) {
    const hostSocket = this.server.sockets.sockets.get(hostSocketId);
    hostSocket?.join(room.id);
  }

  this.server.to(room.id).emit('game_started', { room: updatedRoom });
}

  @SubscribeMessage('decline_invitation')
  async handleDeclineInvitation(
    @MessageBody() payload: { invitationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const invitation = await this.gameService.updateInvitation(payload.invitationId, 'declined');

    const hostSocketId = this.userSockets.get(invitation.host_id);
    if (hostSocketId) {
      this.server.to(hostSocketId).emit('invitation_declined', {
        invitationId: payload.invitationId,
      });
    }
  }

  @SubscribeMessage('duel_create_room')
  handleDuelCreateRoom(
    @MessageBody() payload: { code: string; hostId: string; hostName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const roomId = `duel-room-${payload.code}`;
    this.duelRooms.set(payload.code, {
      roomId,
      hostId: payload.hostId,
      hostName: payload.hostName || 'Joueur',
    });

    client.join(roomId);
    client.data.roomId = roomId;

    client.emit('duel_room_created', { roomId, code: payload.code });
  }

  @SubscribeMessage('duel_join_room')
  handleDuelJoinRoom(
    @MessageBody() payload: { code: string; guestId: string; guestName: string },
    @ConnectedSocket() client: Socket,
  ) {
    const found = this.duelRooms.get(payload.code);
    if (!found) {
      client.emit('duel_join_error', { message: 'Code introuvable' });
      return;
    }

    client.join(found.roomId);
    client.data.roomId = found.roomId;

    this.server.to(found.roomId).emit('duel_started', {
      roomId: found.roomId,
      hostId: found.hostId,
      hostName: found.hostName,
      guestId: payload.guestId,
      guestName: payload.guestName || 'Joueur',
    });

    this.duelRooms.delete(payload.code);
  }

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @MessageBody() payload: {
      roomId: string;
      userId: string;
      score: number;
      finished: boolean;
      damage?: number;
      selfDamage?: number;
      winnerId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const isDuelRoom = payload.roomId?.startsWith('duel-room-');
    if (!isDuelRoom) {
      await this.gameService.saveResult(payload.roomId, payload.userId, payload.score);
    }

    if (payload.damage) {
      client.to(payload.roomId).emit('opponent_attacked', { damage: payload.damage });
    }

    if (payload.selfDamage) {
      client.to(payload.roomId).emit('player_self_damaged', {
        userId: payload.userId,
        damage: payload.selfDamage,
      });
    }

    this.server.to(payload.roomId).emit('answer_submitted', {
      userId: payload.userId,
      score: payload.score,
    });

    if (payload.finished) {
      if (!isDuelRoom) {
        await this.gameService.finishRoom(payload.roomId);
      }
      this.server.to(payload.roomId).emit('game_finished', {
        userId: payload.winnerId ?? payload.userId,
      });
    }
  }

  @SubscribeMessage('duel_rematch')
  handleDuelRematch(@MessageBody() payload: { roomId: string }, @ConnectedSocket() client: Socket) {
    if (!payload.roomId) return;
    client.to(payload.roomId).emit('duel_rematch');
  }
}