import { saveToRds } from './saveToRds';
import { DateRepository } from '../domain/ports/DateRepository';
import { Date } from '../../appointment/domain/entities/Date';

describe('saveToRds', () => {
  let mockRepository: jest.Mocked<DateRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should call repository.save with correct data for Peru', async () => {
    const data: Date = {
      insuredId: '123',
      scheduleId: 123,
      countryISO: 'PE',
    } as Date;

    await saveToRds(data, mockRepository);

    expect(mockRepository.save).toHaveBeenCalledWith({
      insuredId: '123',
      scheduleId: 123,
      countryISO: 'PE',
    });
  });
});