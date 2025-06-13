import { EventBridgeEvent } from 'aws-lambda';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});

interface AppointmentConfirmation {
  insuredId: string;
  scheduleId: number;
  status: boolean;
}

export const eventBridgeHandler = async (
  event: EventBridgeEvent<'appointment.confirmed', AppointmentConfirmation>
): Promise<void> => {
  try {
    const { insuredId, scheduleId, status } = event.detail;
    console.log('Recibida conformidad de agendamiento:', { insuredId, scheduleId, status });

    if (status) {
      const message = {
        insuredId,
        scheduleId,
        action: 'UPDATE_STATUS'
      };

      await sqs.send(new SendMessageCommand({
        QueueUrl: process.env.APPOINTMENT_STATUS_QUEUE_URL,
        MessageBody: JSON.stringify(message)
      }));

      console.log(`Confirmación enviada a SQS para actualización de estado: ${insuredId}`);
    } else {
      console.error(`Fallo en la confirmación para insuredId: ${insuredId}`);
    }
  } catch (error) {
    console.error('Error procesando evento de EventBridge:', error);
    throw error;
  }
};