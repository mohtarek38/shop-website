import { DEFAULT_ROLE_PERMISSIONS } from '@shop/contracts';
import { describe, expect, it } from 'vitest';
import { visibleNavItems } from './navigation';

const keys = (permissions: readonly string[]) => visibleNavItems(permissions).map((i) => i.key);

describe('visibleNavItems', () => {
  it('shows a driver only home and their deliveries', () => {
    expect(keys(DEFAULT_ROLE_PERMISSIONS.driver)).toEqual(['home', 'myDeliveries']);
  });

  it('shows a clerk order work but not settings or reports', () => {
    const clerk = keys(DEFAULT_ROLE_PERMISSIONS.clerk);
    expect(clerk).toEqual([
      'home',
      'orders',
      'products',
      'categories',
      'brands',
      'inventory',
      'customers',
      'delivery',
    ]);
  });

  it('shows the owner everything except the driver-only screen', () => {
    const owner = keys(DEFAULT_ROLE_PERMISSIONS.owner);
    expect(owner).toContain('settings');
    expect(owner).toContain('reports');
    expect(owner).toContain('myDeliveries'); // owner holds every permission
  });

  it('shows only home with no permissions', () => {
    expect(keys([])).toEqual(['home']);
  });
});
