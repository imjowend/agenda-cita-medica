import { SQSEvent } from 'aws-lambda';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { DateRdsRepository } from './infrastructure/rds/DateRdsRepository';
import { saveToRds } from './application/saveToRds';

const repository = new DateRdsRepository();
const eventBridge = new EventBridgeClient({});

export const sqsHandler = async (event: SQSEvent): Promise<void> => {
  try {
    for (const record of event.Records) {
      console.log('🇨🇱 CL - Mensaje recibido:', record.body);
      
      const body = JSON.parse(record.body);
      console.log('🇨🇱 CL - Datos a procesar:', {
        insuredId: body.insuredId,
        scheduleId: body.scheduleId,
        countryISO: body.countryISO
      });

     
      await saveToRds(body, repository);
      console.log('🇨🇱 CL - Datos guardados en RDS exitosamente');

      
      const eventBridgeParams = {
        Entries: [
          {
            Source: 'appointment-service',
            DetailType: 'appointment.confirmed',
            Detail: JSON.stringify({
              insuredId: body.insuredId,
              scheduleId: body.scheduleId,
              status: true 
            }),
            EventBusName: process.env.EVENT_BUS_NAME || 'default'
          }
        ]
      };

      await eventBridge.send(new PutEventsCommand(eventBridgeParams));
      console.log('🇨🇱 CL - Conformidad enviada a EventBridge');
    }
  } catch (error) {
    console.error('🇨🇱 CL - Error procesando mensaje:', error);
    throw error;
  }
};