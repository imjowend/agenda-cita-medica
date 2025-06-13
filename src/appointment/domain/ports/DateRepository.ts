import { Date } from '../entities/Date';

export interface DateRepository {
  save(date: Date): Promise<void>;
  updateStatusToCompleted(insuredId: string): Promise<void>;
  findByInsuredId(insuredId: string): Promise<Date[]>;
}
