import type { Me, Permission } from '@shop/contracts';
import { useSuspenseQuery } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';
import { meQuery } from './api';

/** Whether the signed-in staff member has a permission (hides buttons they can't use). */
export function useCan(permission: Permission): boolean {
  const { data: me } = useSuspenseQuery(meQuery);
  return me.permissions.includes(permission);
}

/** Route guard for `beforeLoad`: sends users without the permission back home. */
export function requirePermission(permission: Permission) {
  return ({ context }: { context: { me?: Me } }) => {
    if (!context.me?.permissions.includes(permission)) throw redirect({ to: '/' });
  };
}
