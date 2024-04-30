/* eslint-disable import/first */
const mockSearchByCriteria = jest.fn();
const mockUpdateVehicle = jest.fn();
const mockPublish = jest.fn();

import { handler } from '../../../src/handler/mot-update-vrm';
import { StatusCode } from '../../../src/util/enum';
import logger from '../../../src/util/logger';
import updateEvent from '../../resources/mot-vrm-update-event.json';

jest.mock('../../../src/services/database.ts', () => ({
  searchByCriteria: mockSearchByCriteria,
  updateVehicle: mockUpdateVehicle,
}));

jest.mock('../../../src/services/sns', () => ({
  publish: mockPublish,
}));

describe('Test Mot Update Vrm Lambda Function', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  it('should log when a current record with a duplicate VIN is found', async () => {
    mockSearchByCriteria.mockReturnValue([{
      primaryVrm: '1',
      vin: '2',
      techRecord_statusCode: StatusCode.CURRENT,
      systemNumber: '15',
    },
    {
      primaryVrm: '1',
      vin: '2',
      techRecord_statusCode: StatusCode.CURRENT,
      systemNumber: '16',
    }]);

    const loggerSpy = jest.spyOn(logger, 'info');

    updateEvent.Records[0].body = JSON.stringify({
      vin: '1',
      vrm: '3',
    });

    await handler(updateEvent);

    expect(loggerSpy).toHaveBeenCalledWith('Duplicate current records found for VIN 1');
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('should log when a current record with a duplicate VIN and VRM is found', async () => {
    mockSearchByCriteria.mockReturnValue([{
      primaryVrm: '1',
      vin: '2',
      techRecord_statusCode: StatusCode.CURRENT,
      systemNumber: '15',
    },
    ]);

    const loggerSpy = jest.spyOn(logger, 'info');

    updateEvent.Records[0].body = JSON.stringify({
      vin: '2',
      vrm: '1',
    });

    await handler(updateEvent);

    expect(loggerSpy).toHaveBeenCalledWith('No update needed for VRM 1 and VIN 2');
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('should log when there is a current record with a matching VIN and no matching VRM', async () => {
    mockSearchByCriteria.mockReturnValue([{
      primaryVrm: '1',
      vin: '2',
      techRecord_statusCode: StatusCode.CURRENT,
      systemNumber: '15',
    },
    ]);

    mockUpdateVehicle.mockResolvedValue(true);

    const loggerSpy = jest.spyOn(logger, 'info');

    updateEvent.Records[0].body = JSON.stringify({
      vin: '2',
      vrm: '3',
    });

    await handler(updateEvent);

    expect(loggerSpy).toHaveBeenCalledWith('Updated systemNumber 15 with VRM 3');
    expect(mockUpdateVehicle).toHaveBeenCalled();
    expect(mockPublish).toHaveBeenCalled();
  });
});
