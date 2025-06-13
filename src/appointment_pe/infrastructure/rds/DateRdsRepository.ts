import { DateRepository } from '../../domain/ports/DateRepository';
import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: process.env.DB1_HOST,
  port: Number(process.env.DB1_PORT),
  database: process.env.DB1_NAME,
  user: process.env.DB1_USER,
  password: process.env.DB1_PASS
});

export class DateRdsRepository implements DateRepository {
  async save({ insuredId, scheduleId, countryISO }: {
    insuredId: string; scheduleId: number; countryISO: string;
  }): Promise<void> {
    const conn = await pool.getConnection();
    try {
      await conn.execute(
        'INSERT INTO Date (insuredId, scheduleId, countryISO) VALUES (?, ?, ?)',
        [insuredId, scheduleId, countryISO]
      );
    } finally {
      conn.release();
    }
  }
}