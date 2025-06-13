export interface DateRepository {
  save(data: { insuredId: string; scheduleId: number; countryISO: string }): Promise<void>;
}