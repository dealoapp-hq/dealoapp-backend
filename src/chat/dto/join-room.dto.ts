import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinRoomDto {
  @ApiProperty()
  @IsString()
  roomId: string;
}


