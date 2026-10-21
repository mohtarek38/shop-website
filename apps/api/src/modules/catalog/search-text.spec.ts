import { buildSearchText } from './search-text.js';

describe('buildSearchText', () => {
  it('combines normalized names, brand, category and codes without duplicates', () => {
    const text = buildSearchText({
      name: { ar: 'ثلاجة سامسونج نوفروست', en: 'Samsung No Frost Fridge' },
      brandName: { ar: 'سامسونج', en: 'Samsung' },
      categoryName: { ar: 'ثلاجات', en: 'Refrigerators' },
      variants: [
        { sku: 'SAM-RT38-SL', modelNumber: 'RT38K5032S8' },
        { sku: 'SAM-RT38-BK', modelNumber: 'RT38K5032S8' },
      ],
    });

    expect(text.split(' ')).toEqual(
      expect.arrayContaining([
        'ثلاجه', // ة normalized to ه
        'سامسونج',
        'samsung',
        'refrigerators',
        'sam-rt38-sl',
        'samrt38sl', // separator-free form
        'rt38k5032s8',
      ]),
    );
    expect(text.split(' ').filter((w) => w === 'samsung')).toHaveLength(1);
  });
});
