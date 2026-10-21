import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { APP_CONFIG, type AppConfig } from '../../shared/config/config.js';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { createAuth } from './auth.js';
import { AuthGuard } from './auth.guard.js';
import { IdentityController } from './identity.controller.js';
import { IdentityRepository } from './identity.repository.js';
import { IdentityService } from './identity.service.js';
import { AUTH } from './identity.tokens.js';

@Global()
@Module({
  controllers: [IdentityController],
  providers: [
    {
      provide: AUTH,
      inject: [PrismaService, APP_CONFIG],
      useFactory: (prisma: PrismaService, config: AppConfig) => createAuth(prisma, config),
    },
    IdentityRepository,
    IdentityService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AUTH],
})
export class IdentityModule {}
