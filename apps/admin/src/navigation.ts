import type { Permission } from '@shop/contracts';
import {
  BarChart3,
  Home,
  LayoutTemplate,
  type LucideIcon,
  Package,
  Receipt,
  Settings,
  TicketPercent,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react';

export interface NavItem {
  key:
    | 'home'
    | 'orders'
    | 'products'
    | 'inventory'
    | 'customers'
    | 'delivery'
    | 'myDeliveries'
    | 'promotions'
    | 'content'
    | 'reports'
    | 'settings';
  icon: LucideIcon;
  /** Shown if the user has ANY of these. Empty = everyone. */
  anyOf: Permission[];
  /** Route path once the screen exists; `null` shows a "Soon" item. */
  to: '/' | null;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'home', icon: Home, anyOf: [], to: '/' },
  { key: 'orders', icon: Receipt, anyOf: ['orders.read'], to: null },
  { key: 'products', icon: Package, anyOf: ['catalog.read'], to: null },
  { key: 'inventory', icon: Warehouse, anyOf: ['inventory.read'], to: null },
  { key: 'customers', icon: Users, anyOf: ['customers.read'], to: null },
  { key: 'delivery', icon: Truck, anyOf: ['delivery.assign', 'delivery.manage_zones'], to: null },
  { key: 'myDeliveries', icon: Truck, anyOf: ['delivery.own'], to: null },
  { key: 'promotions', icon: TicketPercent, anyOf: ['promotions.manage'], to: null },
  { key: 'content', icon: LayoutTemplate, anyOf: ['content.manage'], to: null },
  { key: 'reports', icon: BarChart3, anyOf: ['reports.read'], to: null },
  {
    key: 'settings',
    icon: Settings,
    anyOf: ['settings.manage', 'users.manage', 'roles.manage'],
    to: null,
  },
];

/** The sidebar shows only what the user's permissions allow (PLAN §6.2, WIREFRAMES §2.0). */
export function visibleNavItems(permissions: readonly string[]): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => item.anyOf.length === 0 || item.anyOf.some((p) => permissions.includes(p)),
  );
}
