import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

const validMessage = {
  senderId: '1001',
  username: 'ana_garcia',
  text: '¿Cuál es el precio?',
  isFollower: true,
  receivedAt: '2026-06-01T12:00:00.000Z',
};

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  // Cada test arranca una aplicación nueva: el historial en memoria empieza vacío.
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /flows', () => {
    it('devuelve los flujos del seed', async () => {
      const response = await request(app.getHttpServer()).get('/flows').expect(200);

      expect(response.body).toHaveLength(8);
      expect(response.body[0]).toMatchObject({ id: 'f1', status: 'active', keywords: [] });
    });
  });

  describe('POST /simulate', () => {
    it('responde 200 con el ganador, windowClosed y el trace de todos los flujos', async () => {
      const response = await request(app.getHttpServer())
        .post('/simulate')
        .send(validMessage)
        .expect(200);

      expect(response.body.winner).toEqual({ id: 'f3', name: 'Info precios' });
      expect(response.body.windowClosed).toBe(false);
      expect(response.body.trace).toHaveLength(8);
    });

    it('acepta isFollower = null (desconocido)', async () => {
      await request(app.getHttpServer())
        .post('/simulate')
        .send({ ...validMessage, isFollower: null })
        .expect(200);
    });

    it('registra la ejecución: un flujo once no responde dos veces al mismo remitente', async () => {
      const hello = { ...validMessage, text: 'hola' };
      const server = app.getHttpServer();

      const first = await request(server).post('/simulate').send(hello).expect(200);
      const second = await request(server).post('/simulate').send(hello).expect(200);

      expect(first.body.winner.id).toBe('f1');
      expect(second.body.winner.id).toBe('f2');
    });

    it('responde 400 indicando los campos inválidos', async () => {
      const response = await request(app.getHttpServer())
        .post('/simulate')
        .send({ ...validMessage, senderId: '', isFollower: 'yes', receivedAt: 'ayer' })
        .expect(400);

      const errors: string[] = response.body.message;
      expect(errors.some((error) => error.startsWith('senderId'))).toBe(true);
      expect(errors.some((error) => error.startsWith('isFollower'))).toBe(true);
      expect(errors.some((error) => error.startsWith('receivedAt'))).toBe(true);
    });

    it('responde 400 si falta isFollower (null es válido, ausente no)', async () => {
      const { isFollower: _omitted, ...withoutIsFollower } = validMessage;
      await request(app.getHttpServer())
        .post('/simulate')
        .send(withoutIsFollower)
        .expect(400);
    });

    it('responde 400 si llegan campos que no son del contrato', async () => {
      await request(app.getHttpServer())
        .post('/simulate')
        .send({ ...validMessage, priority: 1 })
        .expect(400);
    });
  });
});
