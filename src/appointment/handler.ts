import { APIGatewayProxyHandler, SQSHandler } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { DateDynamoRepository } from './infrastructure/dynamo/DateDynamoRepository';
import { ScheduleDateDynamoRepository } from './infrastructure/dynamo/ScheduleDateDynamoRepository';
import { registerDate } from './application/registerDate';
import { listDatesByInsuredId } from './application/listDate';
import { createScheduleDate } from './application/registerScheduleDate';
import { DateRequest } from './domain/entities/Date';

const dateRepo = new DateDynamoRepository();
const scheduleRepo = new ScheduleDateDynamoRepository();
const sns = new SNSClient({});

// HTTP Handler para endpoints REST
export const httpHandler: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === 'POST' && event.path === '/appointment') {
      const requestData = JSON.parse(event.body!) as DateRequest;
      
      // Validación de campos requeridos
      if (!requestData.insuredId || !requestData.scheduleId || !requestData.countryISO) {
        return {
          statusCode: 400,
          body: JSON.stringify({ 
            message: 'Campos requeridos: insuredId, scheduleId, countryISO' 
          })
        };
      }

      // 1. Registrar en DynamoDB (status se agrega en registerDate)
      const data = await registerDate(requestData, dateRepo);

      // 2. Enviar a SNS
      await sns.send(new PublishCommand({
        TopicArn: process.env.APPOINTMENT_TOPIC_ARN,
        Message: JSON.stringify(data),
        MessageAttributes: {
          countryISO: {
            DataType: 'String',
            StringValue: data.countryISO
          }
        }
      }));

      return { 
        statusCode: 201, 
        body: JSON.stringify({ message: 'Cita registrada exitosamente' }) 
      };
    }

    if (event.httpMethod === 'GET' && event.pathParameters?.insuredId) {
      const insuredId = event.pathParameters.insuredId;
      const dates = await listDatesByInsuredId(insuredId, dateRepo);
      return { 
        statusCode: 200, 
        body: JSON.stringify(dates) 
      };
    }

    return { 
      statusCode: 400, 
      body: JSON.stringify({ message: 'Ruta o método no soportado' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error interno del servidor' })
    };
  }
};

export const sqsHandler: SQSHandler = async (event) => {
  try {
    for (const record of event.Records) {
      console.log('Processing SQS message:', record.body);
      
      const body = JSON.parse(record.body);
      const { insuredId, scheduleId } = body;

      if (!insuredId || !scheduleId) {
        console.error('Invalid message format - missing insuredId or scheduleId');
        continue;
      }

      // 1. Registrar ScheduleDate
      await createScheduleDate(scheduleId, scheduleRepo);
      console.log(`ScheduleDate created for scheduleId: ${scheduleId}`);

      // 2. Actualizar estado de la cita a "completed" usando insuredId
      await dateRepo.updateStatusToCompleted(insuredId);
      console.log(`Appointment status updated to completed for insuredId: ${insuredId}`);
    }
  } catch (error) {
    console.error('Error processing SQS message:', error);
    throw error;
  }
};