import { HttpModule } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nock = require('nock') as typeof import('nock');
import { MhDteConsultaService } from './mh-dte-consulta.service';

const MH_TEST_HOST = 'https://apitest.dtes.mh.gob.sv';
const CONSULTA_PATH = '/fesv/recepcion/consultadte/';

describe('MhDteConsultaService', () => {
  let service: MhDteConsultaService;

  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [MhDteConsultaService],
    }).compile();
    service = mod.get(MhDteConsultaService);
  });

  const params = {
    codigoGeneracion: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
    ambiente: '00' as const,
    mhToken: 'fake-token',
  };

  it('returns VERIFIED on 200 + PROCESADO', async () => {
    nock(MH_TEST_HOST)
      .post(CONSULTA_PATH)
      .reply(200, {
        estado: 'PROCESADO',
        selloRecepcion: 'MH-SELLO-XYZ',
        fhProcesamiento: '15/03/2026 14:30:45',
      });

    const result = await service.verify(params);
    expect(result.status).toBe('VERIFIED');
    expect(result.mhSelloRecepcion).toBe('MH-SELLO-XYZ');
    expect(result.mhFhProcesamiento).toBeInstanceOf(Date);
  });

  it('returns HARD_FAIL_MISMATCH on 200 + RECHAZADO', async () => {
    nock(MH_TEST_HOST)
      .post(CONSULTA_PATH)
      .reply(200, { estado: 'RECHAZADO' });

    const result = await service.verify(params);
    expect(result.status).toBe('HARD_FAIL_MISMATCH');
  });

  it('returns HARD_FAIL_NOT_FOUND on 404', async () => {
    nock(MH_TEST_HOST).post(CONSULTA_PATH).reply(404);
    const result = await service.verify(params);
    expect(result.status).toBe('HARD_FAIL_NOT_FOUND');
  });

  it('returns RETRY_AUTH on 401 with empty body', async () => {
    nock(MH_TEST_HOST).post(CONSULTA_PATH).reply(401);
    const result = await service.verify(params);
    expect(result.status).toBe('RETRY_AUTH');
  });

  it('returns RETRY_5XX on 500', async () => {
    nock(MH_TEST_HOST).post(CONSULTA_PATH).reply(500, 'Internal error');
    const result = await service.verify(params);
    expect(result.status).toBe('RETRY_5XX');
  });

  it('returns RETRY_TIMEOUT on connection timeout', async () => {
    nock(MH_TEST_HOST)
      .post(CONSULTA_PATH)
      .delayConnection(10000) // simulate 10s delay
      .reply(200, {});

    const result = await service.verify({ ...params, timeoutMs: 1000 }); // 1s timeout
    expect(result.status).toBe('RETRY_TIMEOUT');
  }, 15000); // jest timeout 15s to allow the nock delay

  it('does NOT include Bearer prefix in Authorization header', async () => {
    const scope = nock(MH_TEST_HOST, {
      reqheaders: {
        Authorization: (v: string) => v === 'fake-token', // raw token, NO "Bearer "
      },
    })
      .post(CONSULTA_PATH)
      .reply(200, { estado: 'PROCESADO', selloRecepcion: 'X', fhProcesamiento: '15/03/2026 00:00:00' });

    await service.verify(params);
    expect(scope.isDone()).toBe(true);
  });

  it('uses production URL when ambiente = 01', async () => {
    nock('https://api.dtes.mh.gob.sv')
      .post(CONSULTA_PATH)
      .reply(200, { estado: 'PROCESADO', selloRecepcion: 'X', fhProcesamiento: '15/03/2026 00:00:00' });

    const result = await service.verify({ ...params, ambiente: '01' });
    expect(result.status).toBe('VERIFIED');
  });
});
