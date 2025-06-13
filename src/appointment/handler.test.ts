import { httpHandler } from './handler';
import * as registerDateModule from './application/registerDate';
import { APIGatewayProxyResult } from 'aws-lambda';

jest.mock('./application/registerDate');

const mockContext = {} as any;
const mockCallback = jest.fn();

describe('httpHandler', () => {
    it('debe retornar 400 si faltan campos requeridos', async () => {
        const event = {
            httpMethod: 'POST',
            path: '/appointment',
            body: JSON.stringify({ insuredId: '1' }), // faltan campos
        } as any;

        const result = await httpHandler(event, mockContext, mockCallback) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(400);
        expect(JSON.parse(result.body).message).toMatch(/Campos requeridos: insuredId, scheduleId, countryISO/);
    });

    it('debe retornar 201 si la cita se registra correctamente', async () => {
        (registerDateModule.registerDate as jest.Mock).mockResolvedValue({
            insuredId: '1',
            scheduleId: 2,
            countryISO: 'PE',
            status: 'pending',
        });

        const event = {
            httpMethod: 'POST',
            path: '/appointment',
            body: JSON.stringify({ insuredId: '1', scheduleId: 2, countryISO: 'PE' }),
        } as any;

        const result = await httpHandler(event, mockContext, mockCallback) as APIGatewayProxyResult;

        expect(result.statusCode).toBe(201);
        expect(JSON.parse(result.body).message).toMatch(/Cita registrada exitosamente/);
    });
});