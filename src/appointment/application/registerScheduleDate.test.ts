import { createScheduleDate } from './registerScheduleDate';
import { ScheduleDateRepository } from '../domain/ports/ScheduleDateRepository';

describe('createScheduleDate', () => {
  it('debe guardar un ScheduleDate generado a partir del scheduleId', async () => {
    const mockRepo: ScheduleDateRepository = {
      save: jest.fn(),
    findByScheduleDate: jest.fn()
    };

    const scheduleId = 456;

    await createScheduleDate(scheduleId, mockRepo);

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        scheduleId,
        centerId: expect.any(Number),
        specialtyId: expect.any(Number),
        medicId: expect.any(Number),
        date: expect.any(String),
      })
    );
  });
});

