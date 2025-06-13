import { registerDate } from './registerDate';
import { DateRepository } from '../domain/ports/DateRepository';
import { DateRequest } from '../domain/entities/Date';

describe('registerDate', () => {
  it('debe guardar una cita con status "pending"', async () => {
    const mockRepo: DateRepository = {
      save: jest.fn(),
      updateStatusToCompleted: jest.fn(),
      findByInsuredId: jest.fn(),
    };

    const request: DateRequest = {
      insuredId: '123',
      scheduleId: 456,
      countryISO: 'PE',
    };

    await registerDate(request, mockRepo);

    expect(mockRepo.save).toHaveBeenCalledWith({
      ...request,
      status: 'pending',
    });
  });
});