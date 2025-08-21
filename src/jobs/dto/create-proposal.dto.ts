import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProposalDto {
  @ApiProperty()
  @IsString()
  jobId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  coverLetter: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  proposedAmount: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  estimatedDays?: number;

  @ApiProperty({ required: false, type: [Object] })
  @IsOptional()
  @IsArray()
  milestones?: {
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
  }[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({ required: false, type: [Object] })
  @IsOptional()
  @IsArray()
  portfolio?: {
    title: string;
    description: string;
    url: string;
    image: string;
  }[];
}
