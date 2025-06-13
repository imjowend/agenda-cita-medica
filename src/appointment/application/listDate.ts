import { DateRepository } from '../domain/ports/DateRepository';
import { Date } from '../domain/entities/Date';

export const listDatesByInsuredId = async (
  insuredId: string,
  repository: DateRepository
): Promise<Date[]> => {
  return await repository.findByInsuredId(insuredId);
};