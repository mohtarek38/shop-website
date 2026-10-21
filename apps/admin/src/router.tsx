import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import type { ProductStatus } from '@shop/contracts';
import { ApiError, meQuery } from './lib/api';
import { requirePermission } from './lib/permissions';
import { AppLayout } from './routes/app-layout';
import { ErrorPage } from './routes/error-page';
import { HomePage } from './routes/home';
import { LoginPage } from './routes/login';
import { NoAccessPage } from './routes/no-access';
import { NotFoundPage } from './routes/not-found';
import { PendingPage } from './routes/pending';

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
});

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});

const noAccessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/no-access',
  component: NoAccessPage,
});

/** Everything under this route requires a signed-in staff member. */
export const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  beforeLoad: async ({ context, location }) => {
    let me;
    try {
      me = await context.queryClient.ensureQueryData(meQuery);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw redirect({ to: '/login', search: { redirect: location.href } });
      }
      throw error;
    }
    if (me.type !== 'staff') throw redirect({ to: '/no-access' });
    return { me };
  },
  component: AppLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: HomePage,
});

// ─── Catalog ───────────────────────────────────────────────────────────────
// Screens load on demand, so staff who never open the catalog (drivers on phones)
// don't download it.
const catalog = {
  products: () => import('./features/catalog/products-page'),
  productEditor: () => import('./features/catalog/product-editor'),
  categories: () => import('./features/catalog/categories-page'),
  categoryEditor: () => import('./features/catalog/category-editor'),
  brands: () => import('./features/catalog/brands-page'),
};

const optionalString = (value: unknown) => (typeof value === 'string' && value ? value : undefined);
const STATUSES: readonly string[] = ['draft', 'active', 'archived'];

export const productsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/products',
  beforeLoad: requirePermission('catalog.read'),
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    q?: string;
    categoryId?: string;
    brandId?: string;
    status?: ProductStatus;
    page?: number;
  } => ({
    q: optionalString(search.q),
    categoryId: optionalString(search.categoryId),
    brandId: optionalString(search.brandId),
    status: STATUSES.includes(search.status as string)
      ? (search.status as ProductStatus)
      : undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  component: lazyRouteComponent(catalog.products, 'ProductsPage'),
});

export const productNewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/products/new',
  beforeLoad: requirePermission('catalog.write'),
  validateSearch: (search: Record<string, unknown>): { categoryId?: string } => ({
    categoryId: optionalString(search.categoryId),
  }),
  component: lazyRouteComponent(catalog.productEditor, 'NewProductPage'),
});

export const productEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/products/$productId',
  beforeLoad: requirePermission('catalog.read'),
  validateSearch: (search: Record<string, unknown>): { created?: boolean } => ({
    created: search.created === true || search.created === 'true' ? true : undefined,
  }),
  component: lazyRouteComponent(catalog.productEditor, 'EditProductPage'),
});

const categoriesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/categories',
  beforeLoad: requirePermission('catalog.read'),
  component: lazyRouteComponent(catalog.categories, 'CategoriesPage'),
});

export const categoryNewRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/categories/new',
  beforeLoad: requirePermission('catalog.write'),
  validateSearch: (search: Record<string, unknown>): { parentId?: string } => ({
    parentId: optionalString(search.parentId),
  }),
  component: lazyRouteComponent(catalog.categoryEditor, 'NewCategoryPage'),
});

export const categoryEditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/categories/$categoryId',
  beforeLoad: requirePermission('catalog.read'),
  component: lazyRouteComponent(catalog.categoryEditor, 'EditCategoryPage'),
});

const brandsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/brands',
  beforeLoad: requirePermission('catalog.read'),
  component: lazyRouteComponent(catalog.brands, 'BrandsPage'),
});

// ─── Inventory ─────────────────────────────────────────────────────────────

const inventory = () => import('./features/inventory/inventory-page');

export const inventoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/inventory',
  beforeLoad: requirePermission('inventory.read'),
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: 'locations'; q?: string; lowStock?: boolean; page?: number } => ({
    tab: search.tab === 'locations' ? 'locations' : undefined,
    q: optionalString(search.q),
    lowStock: search.lowStock === true || search.lowStock === 'true' ? true : undefined,
    page: Number(search.page) > 1 ? Number(search.page) : undefined,
  }),
  component: lazyRouteComponent(inventory, 'InventoryPage'),
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  noAccessRoute,
  appRoute.addChildren([
    homeRoute,
    productsRoute,
    productNewRoute,
    productEditRoute,
    categoriesRoute,
    categoryNewRoute,
    categoryEditRoute,
    brandsRoute,
    inventoryRoute,
  ]),
]);

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPendingComponent: PendingPage,
    defaultPendingMs: 300,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
