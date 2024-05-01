/* eslint-disable import/first */
const mockSearchByCriteria = jest.fn();
const mockUpdateVehicle = jest.fn();
const mockPublish = jest.fn();

import { handler } from '../../../src/handler/mot-update-vrm';
import { StatusCode } from '../../../src/util/enum';
import logger from '../../../src/util/logger';
import updateEventMultiple from '../../resources/mot-vrm-update-event-multiple.json';
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

  it('should log when no records are found', async () => {
    mockSearchByCriteria.mockReturnValue([]);

    const loggerSpy = jest.spyOn(logger, 'info');

    updateEvent.Records[0].body = JSON.stringify({
      vin: '1',
      vrm: '3',
    });

    await handler(updateEvent);

    expect(loggerSpy).toHaveBeenCalledWith('No record found for VIN: 1');
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('should log when no current records are found', async () => {
    mockSearchByCriteria.mockReturnValue([
      {
        primaryVrm: '1',
        vin: '2',
        techRecord_statusCode: StatusCode.ARCHIVED,
        systemNumber: '15',
      },
    ]);

    const loggerSpy = jest.spyOn(logger, 'info');

    updateEvent.Records[0].body = JSON.stringify({
      vin: '1',
      vrm: '3',
    });

    await handler(updateEvent);

    expect(loggerSpy).toHaveBeenCalledWith('No current record found for VIN: 1');
    expect(mockPublish).not.toHaveBeenCalled();
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

  it('should run three events, pass one, fail one, pass the third one', async () => {
    mockSearchByCriteria.mockReturnValueOnce([{
      primaryVrm: '1',
      vin: '2',
      techRecord_statusCode: StatusCode.CURRENT,
      systemNumber: '15',
    },
    ]).mockReturnValueOnce([]).mockReturnValue([
      {
        primaryVrm: '10',
        vin: '5',
        techRecord_statusCode: StatusCode.CURRENT,
        systemNumber: '16',
      },
    ]);

    mockUpdateVehicle.mockResolvedValue(true);

    const loggerSpy = jest.spyOn(logger, 'info');

    updateEventMultiple.Records[0].body = JSON.stringify({
      vin: '2',
      vrm: '3',
    });

    updateEventMultiple.Records[1].body = JSON.stringify({
      vin: '3',
      vrm: '4',
    });

    updateEventMultiple.Records[2].body = JSON.stringify({
      vin: '5',
      vrm: '6',
    });

    await handler(updateEventMultiple);

    expect(loggerSpy).toHaveBeenCalledWith('Updated systemNumber 15 with VRM 3');
    expect(loggerSpy).toHaveBeenCalledWith('No record found for VIN: 3');
    expect(loggerSpy).toHaveBeenCalledWith('Updated systemNumber 16 with VRM 6');
    expect(mockUpdateVehicle).toHaveBeenCalledTimes(2);
    expect(mockPublish).toHaveBeenCalled();
    expect(loggerSpy).toHaveBeenLastCalledWith('All records processed in SQS event');
  });
});
