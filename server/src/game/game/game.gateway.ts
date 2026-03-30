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

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>();

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
    const room = await this.gameService.joinRoom(payload.guestId, invitation.game_rooms.code);

    client.join(room.id);
    client.data.roomId = room.id;

    const hostSocketId = this.userSockets.get(invitation.host_id);
    if (hostSocketId) {
      const hostSocket = this.server.sockets.sockets.get(hostSocketId);
      hostSocket?.join(room.id);
    }

    this.server.to(room.id).emit('game_started', { room });
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

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @MessageBody() payload: { roomId: string; userId: string; score: number; finished: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    await this.gameService.saveResult(payload.roomId, payload.userId, payload.score);
    this.server.to(payload.roomId).emit('answer_submitted', {
      userId: payload.userId,
      score: payload.score,
    });

    if (payload.finished) {
      await this.gameService.finishRoom(payload.roomId);
      this.server.to(payload.roomId).emit('game_finished', { userId: payload.userId });
    }
  }
}