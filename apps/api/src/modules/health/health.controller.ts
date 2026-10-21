import { Controller, Get, HttpStatus, Inject, Res, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Health } from '@shop/contracts';
import type { Response } from 'express';
import { APP_CONFIG, type AppConfig } from '../../shared/config/config.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

@ApiTags('health')
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * Used by Docker healthchecks and uptime monitoring.
   * Sends the response itself so it can return 503 with the same body when the database is down.
   */
  @Get()
  @ApiResponse({ status: 200, description: 'Healthy' })
  @ApiResponse({ status: 503, description: 'Database unreachable' })
  async check(@Res() res: Response): Promise<void> {
    const databaseUp = await this.prisma.isHealthy();
    const body: Health = {
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'up' : 'down',
      version: this.config.APP_VERSION,
    };
    res.status(databaseUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(body);
  }
}
