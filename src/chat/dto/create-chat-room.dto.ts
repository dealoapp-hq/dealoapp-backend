import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChatRoomType } from '../entities/chat-room.entity';

export class CreateChatRoomDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ChatRoomType, default: ChatRoomType.GROUP })
  @IsOptional()
  @IsEnum(ChatRoomType)
  type?: ChatRoomType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadata?: {
    projectId?: string;
    jobId?: string;
    courseId?: string;
  };
}


