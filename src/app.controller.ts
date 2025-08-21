import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Health check / root endpoint' })
  @ApiResponse({ status: 200, description: 'API is up and running' })
  getHello(): string {
    return this.appService.getHello();
  }
}
