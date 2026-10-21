import { Controller, Get, HttpCode, HttpStatus, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type Me, registerCustomerSchema, updateMeSchema } from '@shop/contracts';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response } from 'express';
import type { z } from 'zod';
import { ZodBody } from '../../shared/http/zod-validation.js';
import { CurrentAuth, Public } from './decorators.js';
import { IdentityService } from './identity.service.js';
import type { AuthContext } from './request-auth.js';

@ApiTags('identity')
@Controller()
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  /** Customer sign-up with phone + password. Sign-in uses Better Auth: POST /api/auth/sign-in/username. */
  @Public()
  @Post('auth/register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @ZodBody(registerCustomerSchema) body: z.output<typeof registerCustomerSchema>,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true }> {
    const headers = await this.identity.registerCustomer(body, fromNodeHeaders(req.headers));
    res.setHeader('set-cookie', headers.getSetCookie());
    return { ok: true };
  }

  @Get('me')
  me(@CurrentAuth() auth: AuthContext): Promise<Me> {
    return this.identity.getMe(auth);
  }

  /** Saves the user's language (dashboard UI and customer messages). */
  @Patch('me')
  updateMe(
    @CurrentAuth() auth: AuthContext,
    @ZodBody(updateMeSchema) body: z.output<typeof updateMeSchema>,
  ): Promise<Me> {
    return this.identity.updateMe(auth, body);
  }
}
