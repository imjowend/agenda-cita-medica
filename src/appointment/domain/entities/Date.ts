export interface DateRequest {
  insuredId: string;
  scheduleId: number;
  countryISO: string;
}

export interface Date extends DateRequest {
  status: 'pending' | 'completed';
}