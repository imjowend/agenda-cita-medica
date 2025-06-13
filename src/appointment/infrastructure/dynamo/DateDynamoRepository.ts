import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { DateRepository } from '../../domain/ports/DateRepository';
import { Date } from '../../domain/entities/Date';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { UpdateItemCommand } from '@aws-sdk/client-dynamodb';


const client = new DynamoDBClient({ region: process.env.AWS_REGION });

export class DateDynamoRepository implements DateRepository {
  private tableName = process.env.DYNAMO_DATE_TABLE!;

  async save(date: Date): Promise<void> {
    try {
      console.log('Attempting to save date:', date);
      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(date)
      });
      await client.send(command);
      console.log('Date saved successfully');
    } catch (error) {
      console.error('Error saving to DynamoDB:', error);
      throw error;
    }
  }

  async findByInsuredId(insuredId: string): Promise<Date[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'insuredId = :insuredId',
      ExpressionAttributeValues: {
        ':insuredId': { S: insuredId }
      }
    });

    const result = await client.send(command);
    return (result.Items || []).map((item) => unmarshall(item) as Date);
  }

  async updateStatusToCompleted(insuredId: string): Promise<void> {
    try {
      const updateCommand = new UpdateItemCommand({
        TableName: this.tableName,
        Key: marshall({
          insuredId: insuredId
        }),
        UpdateExpression: 'SET #status = :completed',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: marshall({
          ':completed': 'completed'
        })
      });

      await client.send(updateCommand);
      console.log(`Status updated to completed for insuredId: ${insuredId}`);
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  }

}
