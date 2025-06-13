import { DateRepository } from '../domain/ports/DateRepository';
import { Date } from '../../appointment/domain/entities/Date';

export const saveToRds = async (
  data: Date,
  repository: DateRepository
): Promise<void> => {
  const { insuredId, scheduleId, countryISO } = data;
  await repository.save({ insuredId, scheduleId, countryISO });
};