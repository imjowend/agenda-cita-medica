import { ScheduleDateRepository } from '../../domain/ports/ScheduleDateRepository';
import { ScheduleDate } from '../../domain/entities/ScheduleDate';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const client = new DynamoDBClient({});

export class ScheduleDateDynamoRepository implements ScheduleDateRepository {
  async save(scheduleDate: ScheduleDate): Promise<void> {
    const command = new PutItemCommand({
      TableName: process.env.DYNAMO_SCHEDULE_DATE_TABLE,
      Item: marshall(scheduleDate)
    });

    await client.send(command);
  }

  async findByScheduleDate(scheduleId: number): Promise<ScheduleDate[]> {
    const command = new GetItemCommand({
      TableName: process.env.DYNAMO_SCHEDULE_DATE_TABLE,
      Key: marshall({
        scheduleId: scheduleId
      })
    });

    const response = await client.send(command);

    if (!response.Item) {
      return [];
    }

    return [unmarshall(response.Item) as ScheduleDate];
  }
}