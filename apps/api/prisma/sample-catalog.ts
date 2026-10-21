/**
 * Development-only sample catalog: realistic Egyptian-market appliances so the dashboard
 * and storefront have something to show. Prices and model numbers are illustrative.
 * Written through the real services, so it passes the same validation as the API.
 */
import type { CategoryInput, ProductInput } from '@shop/contracts';
import {
  brandInputSchema,
  categoryInputSchema,
  egpToPiasters,
  productInputSchema,
} from '@shop/contracts';
import type { BrandsService } from '../src/modules/catalog/brands.service.js';
import type { InventoryService } from '../src/modules/inventory/inventory.service.js';
import type { PrismaService } from '../src/shared/database/prisma.service.js';
import type { CategoriesService } from '../src/modules/catalog/categories.service.js';
import type { ProductsService } from '../src/modules/catalog/products.service.js';

const color = {
  key: 'color',
  label: { ar: 'اللون', en: 'Color' },
  type: 'enum',
  isVariantOption: true,
  isComparable: false,
  options: [
    { value: 'silver', label: { ar: 'فضي', en: 'Silver' } },
    { value: 'black', label: { ar: 'أسود', en: 'Black' } },
    { value: 'white', label: { ar: 'أبيض', en: 'White' } },
    { value: 'inox', label: { ar: 'استانلس', en: 'Stainless steel' } },
  ],
} as const;

const yes = (key: string, ar: string, en: string, filterable = true) => ({
  key,
  label: { ar, en },
  type: 'boolean' as const,
  isFilterable: filterable,
});

/** Parent categories (no specs of their own) and their subcategories with templates. */
const CATEGORIES: (CategoryInput & { children: CategoryInput[] })[] = [
  {
    slug: 'kitchen',
    name: { ar: 'المطبخ', en: 'Kitchen' },
    sortOrder: 1,
    children: [
      {
        slug: 'refrigerators',
        name: { ar: 'ثلاجات', en: 'Refrigerators' },
        sortOrder: 1,
        attributes: [
          {
            key: 'capacity_liters',
            label: { ar: 'السعة', en: 'Capacity' },
            unit: { ar: 'لتر', en: 'L' },
            type: 'number',
            isRequired: true,
            isFilterable: true,
          },
          yes('no_frost', 'نوفروست', 'No Frost'),
          {
            key: 'doors',
            label: { ar: 'عدد الأبواب', en: 'Doors' },
            type: 'enum',
            isFilterable: true,
            options: [
              { value: 'two', label: { ar: 'بابين', en: 'Two doors' } },
              { value: 'side_by_side', label: { ar: 'سايد باي سايد', en: 'Side by side' } },
            ],
          },
          {
            key: 'energy_class',
            label: { ar: 'فئة الطاقة', en: 'Energy class' },
            type: 'enum',
            isFilterable: true,
            options: [
              { value: 'a_plus_plus', label: { ar: 'A++', en: 'A++' } },
              { value: 'a_plus', label: { ar: 'A+', en: 'A+' } },
              { value: 'a', label: { ar: 'A', en: 'A' } },
            ],
          },
          color,
        ],
        children: [],
      },
      {
        slug: 'cookers',
        name: { ar: 'بوتاجازات', en: 'Cookers' },
        sortOrder: 2,
        attributes: [
          {
            key: 'burners',
            label: { ar: 'عدد الشعلات', en: 'Burners' },
            type: 'number',
            isRequired: true,
            isFilterable: true,
          },
          {
            key: 'size',
            label: { ar: 'المقاس', en: 'Size' },
            unit: { ar: 'سم', en: 'cm' },
            type: 'enum',
            isFilterable: true,
            options: [
              { value: '60x60', label: { ar: '60×60', en: '60×60' } },
              { value: '90x60', label: { ar: '90×60', en: '90×60' } },
            ],
          },
          yes('oven_fan', 'مروحة فرن', 'Oven fan'),
          yes('safety_valves', 'صمامات أمان', 'Safety valves', false),
          color,
        ],
        children: [],
      },
      {
        slug: 'microwaves',
        name: { ar: 'ميكروويف', en: 'Microwaves' },
        sortOrder: 3,
        attributes: [
          {
            key: 'capacity_liters',
            label: { ar: 'السعة', en: 'Capacity' },
            unit: { ar: 'لتر', en: 'L' },
            type: 'number',
            isRequired: true,
            isFilterable: true,
          },
          yes('grill', 'شواية', 'Grill'),
          color,
        ],
        children: [],
      },
    ],
  },
  {
    slug: 'laundry',
    name: { ar: 'الغسيل', en: 'Laundry' },
    sortOrder: 2,
    children: [
      {
        slug: 'washers',
        name: { ar: 'غسالات', en: 'Washing machines' },
        sortOrder: 1,
        attributes: [
          {
            key: 'capacity_kg',
            label: { ar: 'السعة', en: 'Capacity' },
            unit: { ar: 'كجم', en: 'kg' },
            type: 'number',
            isRequired: true,
            isFilterable: true,
          },
          {
            key: 'load_type',
            label: { ar: 'نوع التحميل', en: 'Load type' },
            type: 'enum',
            isFilterable: true,
            options: [
              { value: 'front', label: { ar: 'تحميل أمامي', en: 'Front load' } },
              { value: 'top', label: { ar: 'تحميل علوي', en: 'Top load' } },
            ],
          },
          yes('inverter', 'موتور إنفرتر', 'Inverter motor'),
          {
            key: 'max_spin_rpm',
            label: { ar: 'سرعة العصر', en: 'Max spin' },
            unit: { ar: 'لفة/دقيقة', en: 'rpm' },
            type: 'number',
          },
          color,
        ],
        children: [],
      },
    ],
  },
  {
    slug: 'tv-audio',
    name: { ar: 'شاشات وصوتيات', en: 'TV & audio' },
    sortOrder: 3,
    children: [
      {
        slug: 'tvs',
        name: { ar: 'شاشات', en: 'TVs' },
        sortOrder: 1,
        attributes: [
          {
            key: 'screen_size',
            label: { ar: 'حجم الشاشة', en: 'Screen size' },
            unit: { ar: 'بوصة', en: 'in' },
            type: 'number',
            isRequired: true,
            isFilterable: true,
          },
          {
            key: 'resolution',
            label: { ar: 'الدقة', en: 'Resolution' },
            type: 'enum',
            isFilterable: true,
            options: [
              { value: 'full_hd', label: { ar: 'Full HD', en: 'Full HD' } },
              { value: 'uhd_4k', label: { ar: '4K', en: '4K' } },
            ],
          },
          yes('smart', 'سمارت', 'Smart TV'),
          {
            key: 'panel',
            label: { ar: 'نوع الشاشة', en: 'Panel' },
            type: 'enum',
            options: [
              { value: 'led', label: { ar: 'LED', en: 'LED' } },
              { value: 'qled', label: { ar: 'QLED', en: 'QLED' } },
              { value: 'oled', label: { ar: 'OLED', en: 'OLED' } },
            ],
          },
        ],
        children: [],
      },
    ],
  },
  {
    slug: 'cooling',
    name: { ar: 'التكييف', en: 'Cooling' },
    sortOrder: 4,
    children: [
      {
        slug: 'acs',
        name: { ar: 'تكييفات', en: 'Air conditioners' },
        sortOrder: 1,
        attributes: [
          {
            key: 'capacity_hp',
            label: { ar: 'القدرة', en: 'Capacity' },
            unit: { ar: 'حصان', en: 'HP' },
            type: 'enum',
            isRequired: true,
            isFilterable: true,
            options: [
              { value: '1_5', label: { ar: '1.5', en: '1.5' } },
              { value: '2_25', label: { ar: '2.25', en: '2.25' } },
              { value: '3', label: { ar: '3', en: '3' } },
            ],
          },
          {
            key: 'mode',
            label: { ar: 'النوع', en: 'Mode' },
            type: 'enum',
            isFilterable: true,
            options: [
              { value: 'cool', label: { ar: 'بارد فقط', en: 'Cool only' } },
              { value: 'cool_heat', label: { ar: 'بارد ساخن', en: 'Cool and heat' } },
            ],
          },
          yes('inverter', 'إنفرتر', 'Inverter'),
        ],
        children: [],
      },
    ],
  },
];

const BRANDS = [
  { slug: 'samsung', name: { ar: 'سامسونج', en: 'Samsung' } },
  { slug: 'lg', name: { ar: 'إل جي', en: 'LG' } },
  { slug: 'toshiba', name: { ar: 'توشيبا', en: 'Toshiba' } },
  { slug: 'sharp', name: { ar: 'شارب', en: 'Sharp' } },
  { slug: 'fresh', name: { ar: 'فريش', en: 'Fresh' } },
  { slug: 'tornado', name: { ar: 'تورنيدو', en: 'Tornado' } },
  { slug: 'unionaire', name: { ar: 'يونيون إير', en: 'Unionaire' } },
];

type SampleProduct = Omit<ProductInput, 'categoryId' | 'brandId' | 'variants'> & {
  category: string;
  brand: string;
  publish: boolean;
  variants: (Omit<ProductInput['variants'][number], 'price' | 'salePrice'> & {
    egp: number;
    saleEgp?: number;
  })[];
};

const PRODUCTS: SampleProduct[] = [
  {
    category: 'refrigerators',
    brand: 'samsung',
    slug: 'samsung-no-frost-fridge-385l',
    name: { ar: 'ثلاجة سامسونج نوفروست 385 لتر', en: 'Samsung No Frost Refrigerator 385L' },
    shortDescription: {
      ar: 'ثلاجة بابين بتقنية التبريد الثنائي وموتور إنفرتر موفر للطاقة.',
      en: 'Two-door fridge with twin cooling and an energy-saving inverter compressor.',
    },
    specs: { capacity_liters: 385, no_frost: true, doors: 'two', energy_class: 'a_plus' },
    isLargeItem: true,
    warrantyMonths: 60,
    publish: true,
    variants: [
      {
        sku: 'SAM-RF385-SL',
        modelNumber: 'RT38CG6420S9',
        options: { color: 'silver' },
        egp: 31_999,
        saleEgp: 29_499,
      },
      {
        sku: 'SAM-RF385-BK',
        modelNumber: 'RT38CG6420B1',
        options: { color: 'black' },
        egp: 32_999,
      },
    ],
  },
  {
    category: 'refrigerators',
    brand: 'lg',
    slug: 'lg-side-by-side-fridge-617l',
    name: { ar: 'ثلاجة إل جي سايد باي سايد 617 لتر', en: 'LG Side-by-Side Refrigerator 617L' },
    specs: {
      capacity_liters: 617,
      no_frost: true,
      doors: 'side_by_side',
      energy_class: 'a_plus_plus',
    },
    isLargeItem: true,
    warrantyMonths: 120,
    publish: true,
    variants: [
      { sku: 'LG-SBS617-IN', modelNumber: 'GC-B257JLYV', options: { color: 'inox' }, egp: 74_999 },
    ],
  },
  {
    category: 'refrigerators',
    brand: 'toshiba',
    slug: 'toshiba-no-frost-fridge-355l',
    name: { ar: 'ثلاجة توشيبا نوفروست 355 لتر', en: 'Toshiba No Frost Refrigerator 355L' },
    specs: { capacity_liters: 355, no_frost: true, doors: 'two', energy_class: 'a' },
    isLargeItem: true,
    warrantyMonths: 60,
    publish: true,
    variants: [
      {
        sku: 'TOS-RF355-SL',
        modelNumber: 'GR-EF40P-R-S',
        options: { color: 'silver' },
        egp: 24_499,
        saleEgp: 22_999,
      },
      {
        sku: 'TOS-RF355-WH',
        modelNumber: 'GR-EF40P-R-W',
        options: { color: 'white' },
        egp: 23_999,
      },
    ],
  },
  {
    category: 'cookers',
    brand: 'fresh',
    slug: 'fresh-cooker-5-burners-90x60',
    name: { ar: 'بوتاجاز فريش 5 شعلة 90×60', en: 'Fresh 5-Burner Cooker 90×60' },
    specs: { burners: 5, size: '90x60', oven_fan: true, safety_valves: true },
    isLargeItem: true,
    warrantyMonths: 24,
    publish: true,
    variants: [
      {
        sku: 'FRS-CK5-IN',
        modelNumber: 'PROF-5B-90',
        options: { color: 'inox' },
        egp: 15_999,
        saleEgp: 14_799,
      },
      { sku: 'FRS-CK5-BK', modelNumber: 'PROF-5B-90B', options: { color: 'black' }, egp: 15_499 },
    ],
  },
  {
    category: 'cookers',
    brand: 'unionaire',
    slug: 'unionaire-cooker-4-burners-60x60',
    name: { ar: 'بوتاجاز يونيون إير 4 شعلة 60×60', en: 'Unionaire 4-Burner Cooker 60×60' },
    specs: { burners: 4, size: '60x60', oven_fan: false, safety_valves: true },
    isLargeItem: true,
    warrantyMonths: 24,
    publish: true,
    variants: [
      { sku: 'UNI-CK4-SL', modelNumber: 'C6060SS-AC', options: { color: 'silver' }, egp: 10_999 },
    ],
  },
  {
    category: 'microwaves',
    brand: 'sharp',
    slug: 'sharp-microwave-25l-grill',
    name: { ar: 'ميكروويف شارب 25 لتر بالشواية', en: 'Sharp Microwave 25L with Grill' },
    specs: { capacity_liters: 25, grill: true },
    warrantyMonths: 24,
    publish: true,
    variants: [
      { sku: 'SHP-MW25-BK', modelNumber: 'R-750MR(K)', options: { color: 'black' }, egp: 5_299 },
    ],
  },
  {
    category: 'microwaves',
    brand: 'tornado',
    slug: 'tornado-microwave-36l',
    name: { ar: 'ميكروويف تورنيدو 36 لتر', en: 'Tornado Microwave 36L' },
    specs: { capacity_liters: 36, grill: false },
    warrantyMonths: 24,
    publish: true,
    variants: [
      { sku: 'TOR-MW36-WH', modelNumber: 'TM-36MS', options: { color: 'white' }, egp: 6_199 },
    ],
  },
  {
    category: 'washers',
    brand: 'lg',
    slug: 'lg-front-load-washer-9kg-inverter',
    name: { ar: 'غسالة إل جي فول أوتوماتيك 9 كجم إنفرتر', en: 'LG Front Load Washer 9kg Inverter' },
    specs: { capacity_kg: 9, load_type: 'front', inverter: true, max_spin_rpm: 1400 },
    isLargeItem: true,
    warrantyMonths: 120,
    publish: true,
    variants: [
      {
        sku: 'LG-WM9-SL',
        modelNumber: 'F4R5VYG2T',
        options: { color: 'silver' },
        egp: 27_999,
        saleEgp: 25_999,
      },
      { sku: 'LG-WM9-WH', modelNumber: 'F4R5VYG0W', options: { color: 'white' }, egp: 26_999 },
    ],
  },
  {
    category: 'washers',
    brand: 'toshiba',
    slug: 'toshiba-top-load-washer-10kg',
    name: { ar: 'غسالة توشيبا تحميل علوي 10 كجم', en: 'Toshiba Top Load Washer 10kg' },
    specs: { capacity_kg: 10, load_type: 'top', inverter: false, max_spin_rpm: 800 },
    isLargeItem: true,
    warrantyMonths: 60,
    publish: true,
    variants: [
      { sku: 'TOS-WM10-WH', modelNumber: 'AW-1100GE', options: { color: 'white' }, egp: 18_499 },
    ],
  },
  {
    category: 'tvs',
    brand: 'samsung',
    slug: 'samsung-55-inch-4k-smart-tv',
    name: { ar: 'شاشة سامسونج 55 بوصة 4K سمارت', en: 'Samsung 55" 4K Smart TV' },
    specs: { screen_size: 55, resolution: 'uhd_4k', smart: true, panel: 'qled' },
    isLargeItem: true,
    warrantyMonths: 24,
    publish: true,
    variants: [{ sku: 'SAM-TV55-Q60', modelNumber: 'QA55Q60DAUXEG', egp: 27_999, saleEgp: 24_999 }],
  },
  {
    category: 'tvs',
    brand: 'lg',
    slug: 'lg-65-inch-oled-tv',
    name: { ar: 'شاشة إل جي 65 بوصة OLED', en: 'LG 65" OLED TV' },
    specs: { screen_size: 65, resolution: 'uhd_4k', smart: true, panel: 'oled' },
    isLargeItem: true,
    warrantyMonths: 24,
    publish: true,
    variants: [{ sku: 'LG-TV65-C4', modelNumber: 'OLED65C46LA', egp: 89_999 }],
  },
  {
    category: 'tvs',
    brand: 'tornado',
    slug: 'tornado-43-inch-full-hd-tv',
    name: { ar: 'شاشة تورنيدو 43 بوصة Full HD', en: 'Tornado 43" Full HD TV' },
    specs: { screen_size: 43, resolution: 'full_hd', smart: false, panel: 'led' },
    warrantyMonths: 24,
    publish: false, // left as a draft to show the dashboard's status filter
    variants: [{ sku: 'TOR-TV43-FHD', modelNumber: '43ES9500E', egp: 9_999 }],
  },
  {
    category: 'acs',
    brand: 'sharp',
    slug: 'sharp-split-ac-1-5hp-inverter',
    name: { ar: 'تكييف شارب سبليت 1.5 حصان إنفرتر', en: 'Sharp Split AC 1.5HP Inverter' },
    specs: { capacity_hp: '1_5', mode: 'cool_heat', inverter: true },
    isLargeItem: true,
    warrantyMonths: 60,
    publish: true,
    variants: [{ sku: 'SHP-AC15-INV', modelNumber: 'AH-XP13YHE', egp: 36_999, saleEgp: 34_499 }],
  },
  {
    category: 'acs',
    brand: 'unionaire',
    slug: 'unionaire-split-ac-2-25hp',
    name: { ar: 'تكييف يونيون إير سبليت 2.25 حصان', en: 'Unionaire Split AC 2.25HP' },
    specs: { capacity_hp: '2_25', mode: 'cool', inverter: false },
    isLargeItem: true,
    warrantyMonths: 60,
    publish: true,
    variants: [{ sku: 'UNI-AC225-CL', modelNumber: 'M18CO-ARTIX', egp: 41_999 }],
  },
];

export interface CatalogServices {
  categories: CategoriesService;
  brands: BrandsService;
  products: ProductsService;
}

/** Seeds the sample catalog unless the catalog already has categories. */
export async function seedSampleCatalog({ categories, brands, products }: CatalogServices) {
  if ((await categories.list()).length > 0) return { skipped: true as const };

  const categoryIds = new Map<string, string>();
  for (const { children, ...parent } of CATEGORIES) {
    const created = await categories.create(categoryInputSchema.parse(parent));
    categoryIds.set(created.slug, created.id);
    for (const child of children) {
      const createdChild = await categories.create(
        categoryInputSchema.parse({ ...child, parentId: created.id }),
      );
      categoryIds.set(createdChild.slug, createdChild.id);
    }
  }

  const brandIds = new Map<string, string>();
  for (const [index, brand] of BRANDS.entries()) {
    const created = await brands.create(brandInputSchema.parse({ ...brand, sortOrder: index }));
    brandIds.set(created.slug, created.id);
  }

  for (const { category, brand, publish, variants, ...rest } of PRODUCTS) {
    const created = await products.create(
      productInputSchema.parse({
        ...rest,
        categoryId: categoryIds.get(category),
        brandId: brandIds.get(brand),
        variants: variants.map(({ egp, saleEgp, ...v }) => ({
          ...v,
          price: egpToPiasters(egp),
          salePrice: saleEgp ? egpToPiasters(saleEgp) : null,
        })),
      }),
    );
    if (publish) await products.setStatus(created.id, 'active');
  }

  return {
    skipped: false as const,
    categories: categoryIds.size,
    brands: brandIds.size,
    products: PRODUCTS.length,
  };
}

/**
 * Sample stock at the default location, so the dashboard and shop show realistic states:
 * mostly in stock, a few low, one sold out. Only runs while no stock has ever been recorded.
 */
export async function seedSampleStock(
  prisma: PrismaService,
  inventory: InventoryService,
  actorId: string | null,
) {
  if ((await prisma.stockMovement.count()) > 0) return { skipped: true as const };
  const location = (await inventory.locations()).find((l) => l.isDefault);
  if (!location) return { skipped: true as const };

  const variants = await prisma.productVariant.findMany({
    where: { product: { deletedAt: null } },
    orderBy: [{ product: { slug: 'asc' } }, { sortOrder: 'asc' }],
    select: { id: true },
  });
  // Repeating pattern: 0 = sold out, 1–2 = low (threshold 2), the rest in stock.
  const quantities = [12, 6, 2, 9, 0, 15, 4, 1, 8, 20, 5, 7];
  for (const [index, variant] of variants.entries()) {
    const quantity = quantities[index % quantities.length]!;
    if (quantity > 0) {
      await inventory.adjust(
        {
          variantId: variant.id,
          locationId: location.id,
          type: 'receive',
          quantity,
          reason: 'Sample stock',
        },
        actorId,
      );
    }
    await inventory.setThreshold({
      variantId: variant.id,
      locationId: location.id,
      lowStockThreshold: 2,
    });
  }
  return { skipped: false as const, variants: variants.length };
}
