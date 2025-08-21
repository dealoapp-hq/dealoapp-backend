import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Error message' })
  message: string;

  @ApiProperty({ example: 'ERROR_CODE' })
  error: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/endpoint' })
  path: string;

  @ApiProperty({
    example: { field: 'Field name', message: 'Validation error message' },
    required: false,
  })
  details?: any;
}

export class ValidationErrorDto {
  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: [
      {
        field: 'email',
        message: 'email must be an email',
      },
    ],
  })
  errors: Array<{
    field: string;
    message: string;
  }>;
}


