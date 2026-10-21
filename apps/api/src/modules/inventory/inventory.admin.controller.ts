import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  type InventoryRow,
  inventoryListQuerySchema,
  lowStockThresholdInputSchema,
  stockAdjustmentInputSchema,
  type StockLocation,
  stockLocationInputSchema,
  type StockMovement,
  stockTransferInputSchema,
} from '@shop/contracts';
import type { z } from 'zod';
import { ZodBody, ZodQuery } from '../../shared/http/zod-validation.js';
import { type AuthContext, CurrentAuth, RequirePermission } from '../identity/index.js';
import { InventoryService, type Paginated } from './inventory.service.js';

type LocationInput = z.output<typeof stockLocationInputSchema>;

@ApiTags('admin: inventory')
@Controller('admin')
export class InventoryAdminController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('stock-locations')
  @RequirePermission('inventory.read')
  locations(): Promise<StockLocation[]> {
    return this.inventory.locations();
  }

  @Post('stock-locations')
  @RequirePermission('inventory.adjust')
  createLocation(@ZodBody(stockLocationInputSchema) body: LocationInput): Promise<StockLocation> {
    return this.inventory.saveLocation(null, body);
  }

  @Put('stock-locations/:id')
  @RequirePermission('inventory.adjust')
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(stockLocationInputSchema) body: LocationInput,
  ): Promise<StockLocation> {
    return this.inventory.saveLocation(id, body);
  }

  @Get('inventory')
  @RequirePermission('inventory.read')
  list(
    @ZodQuery(inventoryListQuerySchema) query: z.output<typeof inventoryListQuerySchema>,
  ): Promise<Paginated<InventoryRow>> {
    return this.inventory.list(query);
  }

  @Get('inventory/:variantId/movements')
  @RequirePermission('inventory.read')
  movements(@Param('variantId', ParseUUIDPipe) variantId: string): Promise<StockMovement[]> {
    return this.inventory.movements(variantId);
  }

  /** Receive goods, record a stock count, or write off damaged/lost units. */
  @Post('inventory/adjustments')
  @RequirePermission('inventory.adjust')
  @HttpCode(HttpStatus.NO_CONTENT)
  adjust(
    @ZodBody(stockAdjustmentInputSchema) body: z.output<typeof stockAdjustmentInputSchema>,
    @CurrentAuth() auth: AuthContext,
  ): Promise<void> {
    return this.inventory.adjust(body, auth.user.id);
  }

  @Post('inventory/transfers')
  @RequirePermission('inventory.transfer')
  @HttpCode(HttpStatus.NO_CONTENT)
  transfer(
    @ZodBody(stockTransferInputSchema) body: z.output<typeof stockTransferInputSchema>,
    @CurrentAuth() auth: AuthContext,
  ): Promise<void> {
    return this.inventory.transfer(body, auth.user.id);
  }

  @Put('inventory/thresholds')
  @RequirePermission('inventory.adjust')
  @HttpCode(HttpStatus.NO_CONTENT)
  setThreshold(
    @ZodBody(lowStockThresholdInputSchema) body: z.output<typeof lowStockThresholdInputSchema>,
  ): Promise<void> {
    return this.inventory.setThreshold(body);
  }
}
