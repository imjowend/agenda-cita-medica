import { DateRepository } from '../domain/ports/DateRepository';
import { Date, DateRequest } from '../domain/entities/Date';

export const registerDate = async (
  requestData: DateRequest,
  repository: DateRepository
): Promise<Date> => {
  const dateWithStatus: Date = {
    ...requestData,
    status: 'pending'
  };
  
  await repository.save(dateWithStatus);
  return dateWithStatus;
};