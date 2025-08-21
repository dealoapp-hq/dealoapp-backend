import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const authToken: string =
        client.handshake?.auth?.token ||
        client.handshake?.headers?.authorization;

      if (!authToken) {
        throw new WsException('No token provided');
      }

      const token = authToken.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);

      // Attach user to socket
      client.data.user = payload;

      return true;
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }
}


