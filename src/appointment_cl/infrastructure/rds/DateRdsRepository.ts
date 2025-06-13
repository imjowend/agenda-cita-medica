import { DateRepository } from '../../domain/ports/DateRepository';
import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: process.env.DB2_HOST,
  port: Number(process.env.DB2_PORT),
  database: process.env.DB2_NAME,
  user: process.env.DB2_USER,
  password: process.env.DB2_PASS
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