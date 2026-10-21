/**
 * Permission catalog (PLAN §6.2). Permissions are defined here and seeded into the DB;
 * roles are data and can be edited by the Owner.
 */
export const PERMISSIONS = {
  catalog: ['catalog.read', 'catalog.write', 'catalog.publish'],
  inventory: ['inventory.read', 'inventory.adjust', 'inventory.transfer'],
  orders: ['orders.read', 'orders.update_status', 'orders.edit', 'orders.cancel'],
  payments: ['payments.verify'],
  delivery: ['delivery.assign', 'delivery.manage_zones', 'delivery.settle_cash', 'delivery.own'],
  customers: ['customers.read', 'customers.block'],
  promotions: ['promotions.manage'],
  content: ['content.manage'],
  reports: ['reports.read'],
  settings: ['settings.manage'],
  identity: ['users.manage', 'roles.manage'],
  audit: ['audit.read'],
} as const;

export type PermissionModule = keyof typeof PERMISSIONS;
export type Permission = (typeof PERMISSIONS)[PermissionModule][number];

export const ALL_PERMISSIONS: readonly Permission[] = Object.values(PERMISSIONS).flat();

export const SYSTEM_ROLES = ['owner', 'manager', 'clerk', 'catalog_editor', 'driver'] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

/** Default permissions per system role. `owner` always has every permission. */
export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS.filter(
    (p) =>
      !['settings.manage', 'users.manage', 'roles.manage', 'audit.read', 'delivery.own'].includes(
        p,
      ),
  ),
  clerk: [
    'catalog.read',
    'inventory.read',
    'orders.read',
    'orders.update_status',
    'orders.edit',
    'orders.cancel',
    'payments.verify',
    'delivery.assign',
    'customers.read',
  ],
  catalog_editor: ['catalog.read', 'catalog.write', 'catalog.publish', 'inventory.read'],
  driver: ['delivery.own'],
};
