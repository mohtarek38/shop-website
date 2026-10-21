import { describe, expect, it } from 'vitest';
import { normalizeArabic } from './arabic';
import { localize } from './localized-text';
import { ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from './permissions';

describe('normalizeArabic', () => {
  it('unifies letter variants and strips diacritics', () => {
    expect(normalizeArabic('ثلاجةٌ')).toBe('ثلاجه');
    expect(normalizeArabic('أجهزة إلكترونية')).toBe('اجهزه الكترونيه');
    expect(normalizeArabic('مكيّف  هوائى')).toBe('مكيف هوايي');
    expect(normalizeArabic('هوائي')).toBe(normalizeArabic('هوائى'));
    expect(normalizeArabic('Samsung RT38')).toBe('samsung rt38');
    expect(normalizeArabic('سامسونـــج')).toBe('سامسونج');
  });
});

describe('localize', () => {
  it('falls back to Arabic when English is missing', () => {
    expect(localize({ ar: 'ثلاجة' }, 'en')).toBe('ثلاجة');
    expect(localize({ ar: 'ثلاجة', en: 'Fridge' }, 'en')).toBe('Fridge');
    expect(localize(null, 'ar')).toBe('');
  });
});

describe('permissions', () => {
  it('gives owner every permission and keeps driver minimal', () => {
    expect(DEFAULT_ROLE_PERMISSIONS.owner).toEqual(ALL_PERMISSIONS);
    expect(DEFAULT_ROLE_PERMISSIONS.driver).toEqual(['delivery.own']);
    expect(DEFAULT_ROLE_PERMISSIONS.manager).not.toContain('roles.manage');
  });
});
