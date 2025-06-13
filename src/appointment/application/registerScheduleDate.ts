import { ScheduleDateRepository } from '../domain/ports/ScheduleDateRepository';
import { ScheduleDate } from '../domain/entities/ScheduleDate';

export const createScheduleDate = async (
  scheduleId: number,
  repository: ScheduleDateRepository
): Promise<void> => {
  const scheduleDate: ScheduleDate = {
    scheduleId,
    centerId: Math.floor(Math.random() * 1000), 
    specialtyId: Math.floor(Math.random() * 1000), 
    medicId: Math.floor(Math.random() * 1000),
    date: new Date().toISOString() 
  };

  await repository.save(scheduleDate);
};