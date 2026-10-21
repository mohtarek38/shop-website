import { egyptianMobileSchema } from '@shop/contracts';
import { z } from 'zod';
import { RequestValidationException, ZodValidationPipe } from './zod-validation.js';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    z.object({ name: z.string().min(1), phone: egyptianMobileSchema }),
  );

  it('returns the parsed, transformed value', () => {
    expect(pipe.transform({ name: 'Ahmed', phone: '01012345678' })).toEqual({
      name: 'Ahmed',
      phone: '+201012345678',
    });
  });

  it('throws RequestValidationException with every issue', () => {
    try {
      pipe.transform({ name: '', phone: '123' });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(RequestValidationException);
      const paths = (error as RequestValidationException).issues.map((i) => i.path.join('.'));
      expect(paths).toEqual(['name', 'phone']);
    }
  });
});
