import { listDatesByInsuredId } from './listDate';
import { DateRepository } from '../domain/ports/DateRepository';
import { Date } from '../domain/entities/Date';

describe('listDatesByInsuredId', () => {
  it('debe retornar las citas del repositorio', async () => {
    const mockDates: Date[] = [
      { insuredId: '1', scheduleId: 2, countryISO: 'PE', status: 'pending' },
    ];
    const mockRepo: DateRepository = {
      save: jest.fn(),
      updateStatusToCompleted: jest.fn(),
      findByInsuredId: jest.fn().mockResolvedValue(mockDates),
    };

    const result = await listDatesByInsuredId('1', mockRepo);

    expect(mockRepo.findByInsuredId).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockDates);
  });
});