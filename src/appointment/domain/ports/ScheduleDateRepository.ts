import { ScheduleDate } from '../entities/ScheduleDate';

export interface ScheduleDateRepository {
  save(scheduleDate: ScheduleDate): Promise<void>;
  findByScheduleDate(scheduleDate: number): Promise<ScheduleDate[]>;
}
