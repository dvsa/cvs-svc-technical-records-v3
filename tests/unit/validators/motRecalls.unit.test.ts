/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable import/first */
/* eslint-disable jest/no-conditional-expect */
const mockGetProfile = jest.fn();

import { addHttpHeaders } from '../../../src/util/httpHeaders';
import { validateFeatureFlags, validateSingleVin } from '../../../src/validators/motRecalls';

jest.mock('@dvsa/cvs-feature-flags/profiles/vtx', () => ({
  getProfile: mockGetProfile,
}));

const cases: any = [['V123456789', true], [undefined, false], [null, false],
  ['V1', false], ['V12345678989497453543543345', false], [123456, false], ['V123456789+', false],
  ['V123456789Q', false], ['V123456789I', false], ['V123456789O', false]];

describe('validateSingleVin', () => {
  test.each<[string | null | undefined | number, boolean] >(cases)(
    'given %p as the vin, return %p',
    (vin, expectedResult) => {
      const res = validateSingleVin(vin as string);
      expect(res).toBe(expectedResult);
    },
  );
});

describe('validateFeatureFlags', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('should return an error if the get profile fails', async () => {
    expect.assertions(1);

    mockGetProfile.mockImplementationOnce(() => { throw new Error('error getting profile'); });

    try {
      await validateFeatureFlags();
    } catch (e) {
      expect((e as Error).message).toBe('error getting profile');
    }
  });
  it('should return a 500 if the feature flag is undefined', async () => {
    mockGetProfile.mockResolvedValue({
      someIncorrectFlag: {
        enabled: true,
      },
    });

    const res = await validateFeatureFlags();

    expect(res).toStrictEqual(addHttpHeaders({
      statusCode: 500,
      body: 'Recall Feature Flag is undefined',
    }));
  });
  it('should return a 200 if the feature flag is disabled', async () => {
    mockGetProfile.mockResolvedValue({
      recallsApi: {
        enabled: false,
      },
    });

    const res = await validateFeatureFlags();

    expect(res).toStrictEqual(addHttpHeaders({
      statusCode: 200,
      body: JSON.stringify({
        manufacturer: null,
        hasRecall: false,
      }),
    }));
  });
  it('should return undefined if everything works', async () => {
    mockGetProfile.mockResolvedValue({
      recallsApi: {
        enabled: true,
      },
    });
    const res = await validateFeatureFlags();

    expect(res).toBeUndefined();
  });
});
