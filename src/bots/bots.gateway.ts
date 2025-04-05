import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // hoặc chỉ định frontend URL cụ thể nếu cần
  },
})
export class BotsGateway {
  @WebSocketServer()
  server: Server;

  sendBotLog(username: string, payload: any) {
    this.server.emit('bot-log', { username, payload });
  }

  processKill(username: string, payload: any) {
    this.server.emit('process-kill', { username, payload });
  }

  processStart(username: string, payload: any) {
    this.server.emit('process-start', { username, payload });
  }
}
