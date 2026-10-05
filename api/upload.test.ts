// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Se mockea el AWS SDK: los tests no tocan S3 ni necesitan credenciales reales.
const getSignedUrl = vi.fn();
vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: (...args: unknown[]) => getSignedUrl(...args) }));
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(function (this: any, input: unknown) { this.input = input; }),
}));

import handler from './upload';

const makeRes = () => {
  const res: any = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

const jsonResponse = (body: unknown, ok = true) => ({ ok, json: async () => body });

// Simula las dos llamadas de verificación: Identity Toolkit (token -> uid) y Firestore (uid -> rol)
const mockFirebase = (role: string | null, tokenOk = true) => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url.includes('identitytoolkit')) {
      return tokenOk ? jsonResponse({ users: [{ localId: 'uid-1' }] }) : jsonResponse({}, false);
    }
    return role ? jsonResponse({ fields: { role: { stringValue: role } } }) : jsonResponse({}, false);
  }));
};

const adminReq = (body: Record<string, unknown>) => ({
  method: 'POST',
  headers: { authorization: 'Bearer token-valido' },
  body,
});

describe('api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env.AWS_REGION = 'sa-east-1';
    process.env.AWS_S3_BUCKET_NAME = 'bucket-test';
    process.env.AWS_ACCESS_KEY_ID = 'AKIATEST';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    process.env.FIREBASE_API_KEY = 'api-key';
    process.env.FIREBASE_PROJECT_ID = 'proyecto';
    getSignedUrl.mockResolvedValue('https://bucket-test.s3.amazonaws.com/firmada');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('rechaza métodos que no sean POST', async () => {
    const res = makeRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('devuelve 401 si no viene el token', async () => {
    const res = makeRes();
    await handler({ method: 'POST', headers: {}, body: { filetype: 'image/png' } }, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('devuelve 403 si el token es válido pero el usuario es customer', async () => {
    mockFirebase('customer');
    const res = makeRes();
    await handler(adminReq({ filetype: 'image/png', size: 1000 }), res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('devuelve 403 si Firebase rechaza el token', async () => {
    mockFirebase('admin', false);
    const res = makeRes();
    await handler(adminReq({ filetype: 'image/png', size: 1000 }), res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('rechaza tipos de archivo que no son imagen', async () => {
    mockFirebase('admin');
    const res = makeRes();
    await handler(adminReq({ filetype: 'application/x-msdownload', size: 1000 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('rechaza imágenes de más de 5 MB', async () => {
    mockFirebase('admin');
    const res = makeRes();
    await handler(adminReq({ filetype: 'image/png', size: 6 * 1024 * 1024 }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('para un admin devuelve la URL prefirmada y la URL pública con la extensión según el tipo', async () => {
    mockFirebase('admin');
    const res = makeRes();
    await handler(adminReq({ filename: 'foto.exe', filetype: 'image/png', size: 1000 }), res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.url).toBe('https://bucket-test.s3.amazonaws.com/firmada');
    expect(body.key).toMatch(/^products\/[0-9a-f-]+\.png$/);
    expect(body.publicUrl).toBe(`https://bucket-test.s3.sa-east-1.amazonaws.com/${body.key}`);
    expect(getSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('devuelve 500 si falla la firma de S3', async () => {
    mockFirebase('admin');
    getSignedUrl.mockRejectedValue(new Error('boom'));
    const res = makeRes();
    await handler(adminReq({ filetype: 'image/jpeg', size: 1000 }), res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
