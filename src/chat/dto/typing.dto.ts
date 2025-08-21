import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TypingDto {
  @ApiProperty()
  @IsString()
  roomId: string;
}


