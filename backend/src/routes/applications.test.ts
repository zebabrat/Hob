import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

// The token has to exist before config.js is evaluated, or every attachment
// route would answer 503 and the upload tests would test nothing.
vi.hoisted(() => {
  process.env['BLOB_READ_WRITE_TOKEN'] = 'vercel_blob_rw_test';
});

// Routes talk to the database through this single module, so mocking it keeps
// the suite hermetic — no Postgres in CI, no test data in a real database.
const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    // POST and PATCH run inside prisma.$transaction(async (tx) => ...); the
    // mock just calls straight through with itself as tx, so every model
    // method below is reachable both directly and through a transaction.
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(prismaMock)),
    $queryRaw: vi.fn(),
    session: { findUnique: vi.fn(), delete: vi.fn() },
    application: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      count: vi.fn(),
    },
    statusChange: { create: vi.fn() },
    interview: { create: vi.fn() },
    attachment: { create: vi.fn() },
  },
}));

const { blobMock } = vi.hoisted(() => ({
  blobMock: { put: vi.fn(), del: vi.fn() },
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));
vi.mock('@vercel/blob', () => ({ put: blobMock.put, del: blobMock.del }));

const { buildApp } = await import('../app.js');
const { config } = await import('../config.js');

const ALICE = { id: 1, email: 'alice@example.com', name: 'Alice' };
const SESSION = 'a'.repeat(64);
const COOKIES = { session: SESSION };

/** A row as Prisma hands it back: real Date objects, relations included. */
const APPLICATION = {
  id: 10,
  userId: ALICE.id,
  company: 'Acme',
  position: 'Backend Engineer',
  recruiter: null,
  status: 'APPLIED' as const,
  priority: 'MEDIUM' as const,
  salary: 180_000,
  salaryType: null,
  workFormat: 'HYBRID' as const,
  jobUrl: 'https://example.com/jobs/1',
  source: [] as string[],
  offerDeadline: null,
  labels: [] as string[],
  summary: null,
  notes: null,
  appliedDate: new Date('2026-08-01T00:00:00.000Z'),
  createdAt: new Date('2026-08-01T09:00:00.000Z'),
  updatedAt: new Date('2026-08-01T09:00:00.000Z'),
  interviews: [],
  attachments: [],
  statusChanges: [],
};

const NEW_APPLICATION = {
  company: 'Acme',
  position: 'Backend Engineer',
  appliedDate: '2026-08-01T00:00:00.000Z',
};

let app: FastifyInstance;

beforeEach(async () => {
  vi.clearAllMocks();
  app = buildApp();
  await app.ready();

  // Every route in this file sits behind requireSession; this is the live
  // session it resolves the cookie into.
  prismaMock.session.findUnique.mockResolvedValue({
    id: 1,
    expiresAt: new Date(Date.now() + 60_000),
    user: ALICE,
  });
});

/**
 * With Prisma mocked, no WHERE clause is ever evaluated, so a test cannot prove
 * that another user's row stays unreachable by returning it. What it can prove
 * is the two halves that make it unreachable in production: that userId is part
 * of the query, and that an empty result becomes a 404. Both are asserted
 * throughout, and this helper reads the filter back out of the call.
 */
function whereOf(mock: { mock: { calls: unknown[][] } }): Record<string, unknown> {
  const args = mock.mock.calls[0]?.[0] as { where?: Record<string, unknown> };
  return args?.where ?? {};
}

describe('POST /api/applications', () => {
  it('creates the application and lets the status default to APPLIED', async () => {
    prismaMock.application.create.mockResolvedValue(APPLICATION);

    const response = await app.inject({
      method: 'POST',
      url: '/api/applications',
      cookies: COOKIES,
      payload: NEW_APPLICATION,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().status).toBe('APPLIED');

    const data = prismaMock.application.create.mock.calls[0]?.[0]?.data;
    // Nothing is sent for status: the column default is what fills it in, so
    // the default lives in one place rather than two.
    expect(data.status).toBeUndefined();
    expect(data.userId).toBe(ALICE.id);
    // The contract takes an ISO string; Prisma is handed a Date.
    expect(data.appliedDate).toBeInstanceOf(Date);
  });

  it('accepts more than one source and a salary type', async () => {
    prismaMock.application.create.mockResolvedValue({
      ...APPLICATION,
      source: ['LinkedIn', 'Referral'],
      salaryType: 'NET',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/applications',
      cookies: COOKIES,
      payload: { ...NEW_APPLICATION, source: ['LinkedIn', 'Referral'], salaryType: 'NET' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json().source).toEqual(['LinkedIn', 'Referral']);
    expect(response.json().salaryType).toBe('NET');

    const data = prismaMock.application.create.mock.calls[0]?.[0]?.data;
    expect(data.source).toEqual(['LinkedIn', 'Referral']);
    expect(data.salaryType).toBe('NET');
  });

  it('records the first status change, naming no prior status', async () => {
    prismaMock.application.create.mockResolvedValue(APPLICATION);

    await app.inject({
      method: 'POST',
      url: '/api/applications',
      cookies: COOKIES,
      payload: NEW_APPLICATION,
    });

    // Read off the created row's own status, not off the request body: a
    // request that sends none still lands on APPLIED via the column default,
    // and the audit row has to name whatever actually landed.
    expect(prismaMock.statusChange.create).toHaveBeenCalledWith({
      data: { applicationId: APPLICATION.id, fromStatus: null, toStatus: APPLICATION.status },
    });
  });

  it('stamps the application with the session user, not with anything sent', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/applications',
      cookies: COOKIES,
      payload: { ...NEW_APPLICATION, userId: 999 },
    });

    // userId is not a writable field, so naming it is a bad request rather than
    // a way to file an application under somebody else's account.
    expect(response.statusCode).toBe(400);
    expect(prismaMock.application.create).not.toHaveBeenCalled();
  });

  it('rejects an implausible year rather than storing a date the database driver cannot read back', async () => {
    // A native date input's own validation guarantees YYYY-MM-DD, not a sane
    // year — found by hand when a mistyped "22026" sailed through unbounded
    // coercion, got stored, and 500ed every later read of that row.
    const response = await app.inject({
      method: 'POST',
      url: '/api/applications',
      cookies: COOKIES,
      payload: { ...NEW_APPLICATION, appliedDate: '22026-08-01T00:00:00.000Z' },
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.application.create).not.toHaveBeenCalled();
  });

  it('401s without a session', async () => {
    prismaMock.session.findUnique.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/applications',
      payload: NEW_APPLICATION,
    });

    expect(response.statusCode).toBe(401);
    expect(prismaMock.application.create).not.toHaveBeenCalled();
  });
});

describe('GET /api/applications', () => {
  it('asks the database only for the current user rows', async () => {
    prismaMock.application.findMany.mockResolvedValue([APPLICATION]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/applications',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(1);
    // The filter is what keeps another user's applications out of the answer.
    expect(whereOf(prismaMock.application.findMany)).toEqual({ userId: ALICE.id });
  });

  it('serialises timestamps as ISO strings and carries the relations', async () => {
    prismaMock.application.findMany.mockResolvedValue([
      {
        ...APPLICATION,
        interviews: [
          {
            id: 3,
            applicationId: APPLICATION.id,
            round: 'Technical',
            scheduledAt: new Date('2026-08-20T10:00:00.000Z'),
            notes: null,
            createdAt: new Date('2026-08-02T09:00:00.000Z'),
          },
        ],
        attachments: [
          {
            id: 4,
            applicationId: APPLICATION.id,
            blobUrl: 'https://blob.example/cv.pdf',
            fileName: 'cv.pdf',
            uploadedAt: new Date('2026-08-02T09:30:00.000Z'),
          },
        ],
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/api/applications',
      cookies: COOKIES,
    });

    const [item] = response.json();
    expect(item.appliedDate).toBe('2026-08-01T00:00:00.000Z');
    expect(item.interviews[0].scheduledAt).toBe('2026-08-20T10:00:00.000Z');
    expect(item.attachments[0].fileName).toBe('cv.pdf');
  });
});

describe('GET /api/applications/:id', () => {
  it('returns one application with its rounds and files', async () => {
    prismaMock.application.findFirst.mockResolvedValue(APPLICATION);

    const response = await app.inject({
      method: 'GET',
      url: '/api/applications/10',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().id).toBe(10);
    expect(whereOf(prismaMock.application.findFirst)).toEqual({
      id: 10,
      userId: ALICE.id,
    });
  });

  it('404s for an application belonging to somebody else', async () => {
    // What the database returns for a row that exists but is not Alice's.
    prismaMock.application.findFirst.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/applications/77',
      cookies: COOKIES,
    });

    // 404 and not 403: a 403 would confirm that application 77 exists.
    expect(response.statusCode).toBe(404);
    expect(response.json().message).toBe('Application not found');
  });
});

describe('PATCH /api/applications/:id', () => {
  beforeEach(() => {
    // The status before the edit — read inside the transaction so the audit
    // row can name where a status change came from. Individual tests override
    // this when the "before" value matters to what they are checking.
    prismaMock.application.findFirst.mockResolvedValue({ status: 'APPLIED' });
    prismaMock.application.updateMany.mockResolvedValue({ count: 1 });
  });

  it('moves a card to another column', async () => {
    prismaMock.application.findUniqueOrThrow.mockResolvedValue({
      ...APPLICATION,
      status: 'INTERVIEW' as const,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { status: 'INTERVIEW' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('INTERVIEW');
    expect(whereOf(prismaMock.application.updateMany)).toEqual({
      id: 10,
      userId: ALICE.id,
    });
  });

  it('records the status change alongside the update', async () => {
    prismaMock.application.findFirst.mockResolvedValue({ status: 'APPLIED' });
    prismaMock.application.findUniqueOrThrow.mockResolvedValue({
      ...APPLICATION,
      status: 'INTERVIEW' as const,
    });

    await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { status: 'INTERVIEW' },
    });

    // Named from the row read before the write, not from anything guessed —
    // that read is the only place "before" ever comes from.
    expect(prismaMock.statusChange.create).toHaveBeenCalledWith({
      data: { applicationId: 10, fromStatus: 'APPLIED', toStatus: 'INTERVIEW' },
    });
  });

  it('does not record a status change when status is not part of the edit', async () => {
    prismaMock.application.findUniqueOrThrow.mockResolvedValue(APPLICATION);

    await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { company: 'New Name' },
    });

    expect(prismaMock.statusChange.create).not.toHaveBeenCalled();
  });

  it('does not record a status change when the status sent matches the current one', async () => {
    prismaMock.application.findFirst.mockResolvedValue({ status: 'OFFER' });
    prismaMock.application.findUniqueOrThrow.mockResolvedValue({
      ...APPLICATION,
      status: 'OFFER' as const,
    });

    await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { status: 'OFFER' },
    });

    // Nothing actually changed, so there is nothing to log — otherwise every
    // re-save of the detail form would add a stage transition that never
    // happened.
    expect(prismaMock.statusChange.create).not.toHaveBeenCalled();
  });

  it('sends only the named fields, leaving the rest untouched', async () => {
    prismaMock.application.findUniqueOrThrow.mockResolvedValue(APPLICATION);

    await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { status: 'OFFER' },
    });

    // Anything else in this object would overwrite a column the caller never
    // mentioned — company and salary must not appear here at all.
    expect(prismaMock.application.updateMany.mock.calls[0]?.[0]?.data).toEqual({
      status: 'OFFER',
    });
  });

  it('clears an optional field when given null', async () => {
    prismaMock.application.findUniqueOrThrow.mockResolvedValue({
      ...APPLICATION,
      salary: null,
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { salary: null },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().salary).toBeNull();
    // null reaches Prisma as null, which clears the column. Were it dropped as
    // "not provided", the old salary would survive the edit.
    expect(prismaMock.application.updateMany.mock.calls[0]?.[0]?.data).toEqual({
      salary: null,
    });
  });

  it('rejects an unknown field', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { statuss: 'OFFER' },
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.application.updateMany).not.toHaveBeenCalled();
  });

  it('rejects an empty body', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: {},
    });

    // An empty PATCH would otherwise be a write that touches nothing while
    // still bumping updatedAt.
    expect(response.statusCode).toBe(400);
    expect(prismaMock.application.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a status outside the enum', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { status: 'GHOSTED' },
    });

    expect(response.statusCode).toBe(400);
    expect(prismaMock.application.updateMany).not.toHaveBeenCalled();
  });

  it('404s for an application belonging to somebody else', async () => {
    // The same ownership-scoped read the route uses to learn the prior status
    // finds nothing for a row that is not Alice's.
    prismaMock.application.findFirst.mockResolvedValue(null);

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/applications/77',
      cookies: COOKIES,
      payload: { status: 'OFFER' },
    });

    expect(response.statusCode).toBe(404);
    expect(prismaMock.application.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.application.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(prismaMock.statusChange.create).not.toHaveBeenCalled();
  });

  it('404s when the row is deleted between the read and the write', async () => {
    // Ownership looked fine at the read, but the write matched nothing — a
    // concurrent delete, say. updateMany's own WHERE is what actually decides
    // this, which is why the route still checks its count rather than trusting
    // the earlier read.
    prismaMock.application.findFirst.mockResolvedValue({ status: 'APPLIED' });
    prismaMock.application.updateMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({
      method: 'PATCH',
      url: '/api/applications/10',
      cookies: COOKIES,
      payload: { status: 'OFFER' },
    });

    expect(response.statusCode).toBe(404);
    expect(prismaMock.statusChange.create).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/applications/:id', () => {
  it('deletes the application', async () => {
    prismaMock.application.findFirst.mockResolvedValue({ id: 10, attachments: [] });
    prismaMock.application.delete.mockResolvedValue({ id: 10 });

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/applications/10',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(204);
    expect(prismaMock.application.delete).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it('404s for an application belonging to somebody else', async () => {
    prismaMock.application.findFirst.mockResolvedValue(null);

    const response = await app.inject({
      method: 'DELETE',
      url: '/api/applications/77',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(404);
    expect(prismaMock.application.delete).not.toHaveBeenCalled();
  });

  /*
   * Rounds and files go with the application by ON DELETE CASCADE, which is a
   * database guarantee the mock cannot act out: a single delete call is all the
   * route makes, and the cascade happens below it. So these tests pin what is
   * observable here — one delete for the application, and the stored files,
   * which have no cascade to follow, removed by hand.
   */
  describe('cascade', () => {
    const withFiles = {
      id: 10,
      attachments: [
        { blobUrl: 'https://blob.example/cv.pdf' },
        { blobUrl: 'https://blob.example/cover.pdf' },
      ],
    };

    it('removes the stored files, which no cascade reaches', async () => {
      prismaMock.application.findFirst.mockResolvedValue(withFiles);
      prismaMock.application.delete.mockResolvedValue({ id: 10 });
      blobMock.del.mockResolvedValue(undefined);

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/applications/10',
        cookies: COOKIES,
      });

      expect(response.statusCode).toBe(204);
      expect(blobMock.del).toHaveBeenCalledTimes(2);
      expect(blobMock.del.mock.calls.map((call) => call[0])).toEqual([
        'https://blob.example/cv.pdf',
        'https://blob.example/cover.pdf',
      ]);
      // One statement; the rows underneath it are the database's business.
      expect(prismaMock.application.delete).toHaveBeenCalledTimes(1);
    });

    it('still deletes the application when the storage call fails', async () => {
      prismaMock.application.findFirst.mockResolvedValue(withFiles);
      prismaMock.application.delete.mockResolvedValue({ id: 10 });
      blobMock.del.mockRejectedValue(new Error('blob is down'));

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/applications/10',
        cookies: COOKIES,
      });

      // Best effort, and best effort means the application still goes. A file
      // nobody references costs storage; an application that cannot be deleted
      // costs the user their trust in the button.
      expect(response.statusCode).toBe(204);
      expect(prismaMock.application.delete).toHaveBeenCalledWith({ where: { id: 10 } });
    });
  });
});

describe('POST /api/applications/:id/interviews', () => {
  const ROUND = {
    id: 3,
    applicationId: 10,
    round: 'Technical',
    scheduledAt: new Date('2026-08-20T10:00:00.000Z'),
    notes: null,
    createdAt: new Date('2026-08-02T09:00:00.000Z'),
  };

  it('adds a round to your own application', async () => {
    prismaMock.application.findFirst.mockResolvedValue({ id: 10 });
    prismaMock.interview.create.mockResolvedValue(ROUND);

    const response = await app.inject({
      method: 'POST',
      url: '/api/applications/10/interviews',
      cookies: COOKIES,
      payload: { round: 'Technical', scheduledAt: '2026-08-20T10:00:00.000Z' },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      round: 'Technical',
      scheduledAt: '2026-08-20T10:00:00.000Z',
      applicationId: 10,
    });
    expect(prismaMock.interview.create.mock.calls[0]?.[0]?.data.applicationId).toBe(10);
  });

  it('404s when the application is somebody else', async () => {
    prismaMock.application.findFirst.mockResolvedValue(null);

    const response = await app.inject({
      method: 'POST',
      url: '/api/applications/77/interviews',
      cookies: COOKIES,
      payload: { round: 'Technical' },
    });

    expect(response.statusCode).toBe(404);
    // The ownership check comes first, so nothing is written on the way to it.
    expect(prismaMock.interview.create).not.toHaveBeenCalled();
  });

  it('rejects a round without a name', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/applications/10/interviews',
      cookies: COOKIES,
      payload: { round: '   ' },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe('POST /api/applications/:id/attachments', () => {
  const FILE = Buffer.from('%PDF-1.4 pretend this is a CV');
  const STORED = {
    id: 4,
    applicationId: 10,
    blobUrl: 'https://blob.example/applications/10/cv-abc123.pdf',
    fileName: 'cv.pdf',
    uploadedAt: new Date('2026-08-02T09:30:00.000Z'),
  };

  function upload(url = '/api/applications/10/attachments?fileName=cv.pdf') {
    return app.inject({
      method: 'POST',
      url,
      cookies: COOKIES,
      headers: { 'content-type': 'application/pdf' },
      payload: FILE,
    });
  }

  it('stores the file and records it against the application', async () => {
    prismaMock.application.findFirst.mockResolvedValue({ id: 10 });
    blobMock.put.mockResolvedValue({ url: STORED.blobUrl });
    prismaMock.attachment.create.mockResolvedValue(STORED);

    const response = await upload();

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      fileName: 'cv.pdf',
      blobUrl: STORED.blobUrl,
      applicationId: 10,
    });

    const [pathname, body, options] = blobMock.put.mock.calls[0] ?? [];
    // Keyed by application so the storage listing stays readable.
    expect(pathname).toBe('applications/10/cv.pdf');
    expect(body).toEqual(FILE);
    expect(options).toMatchObject({ access: 'public', addRandomSuffix: true });

    // The row keeps the URL that Blob actually answered with, not one guessed
    // from the file name — the random suffix means only Blob knows it.
    expect(prismaMock.attachment.create.mock.calls[0]?.[0]?.data).toEqual({
      applicationId: 10,
      blobUrl: STORED.blobUrl,
      fileName: 'cv.pdf',
    });
  });

  it('404s for an application belonging to somebody else', async () => {
    prismaMock.application.findFirst.mockResolvedValue(null);

    const response = await upload('/api/applications/77/attachments?fileName=cv.pdf');

    expect(response.statusCode).toBe(404);
    // Nothing is uploaded before the application is known to be the caller's.
    expect(blobMock.put).not.toHaveBeenCalled();
  });

  it.each([
    ['text/plain', 'notes.txt', 'just some notes'],
    ['application/json', 'profile.json', '{"role":"backend"}'],
  ])('takes a %s file, which Fastify would otherwise parse', async (type, fileName, content) => {
    /*
     * Both of these have a parser of their own in Fastify: text/plain arrives
     * as a string and application/json as an object, and the route wants
     * bytes. Uploading a .txt used to answer 400 "Request body is empty"
     * because neither is a Buffer. The upload route now has its own parser
     * scope, and this is what stops that from coming back.
     */
    prismaMock.application.findFirst.mockResolvedValue({ id: 10 });
    blobMock.put.mockResolvedValue({ url: `https://blob.example/${fileName}` });
    prismaMock.attachment.create.mockResolvedValue({ ...STORED, fileName });

    const response = await app.inject({
      method: 'POST',
      url: `/api/applications/10/attachments?fileName=${fileName}`,
      cookies: COOKIES,
      headers: { 'content-type': type },
      payload: Buffer.from(content),
    });

    expect(response.statusCode).toBe(201);
    expect(blobMock.put.mock.calls[0]?.[1]).toEqual(Buffer.from(content));
  });

  it('still parses JSON on the routes outside the upload scope', async () => {
    prismaMock.application.create.mockResolvedValue(APPLICATION);

    const response = await app.inject({
      method: 'POST',
      url: '/api/applications',
      cookies: COOKIES,
      payload: NEW_APPLICATION,
    });

    // Removing the JSON parser is scoped to uploads; creating an application
    // in the same plugin must still read its body as JSON.
    expect(response.statusCode).toBe(201);
    expect(prismaMock.application.create).toHaveBeenCalled();
  });

  it('requires a file name', async () => {
    const response = await upload('/api/applications/10/attachments');

    expect(response.statusCode).toBe(400);
    expect(blobMock.put).not.toHaveBeenCalled();
  });

  it('answers 503 when file storage is not configured', async () => {
    // Simulates a deployment with no BLOB_READ_WRITE_TOKEN. The server still
    // runs; only this feature is unavailable, and it says so.
    const token = config.blobToken;
    config.blobToken = null;

    try {
      const response = await upload();

      expect(response.statusCode).toBe(503);
      expect(response.json().message).toBe('File storage is not configured');
      expect(blobMock.put).not.toHaveBeenCalled();
    } finally {
      config.blobToken = token;
    }
  });
});

describe('GET /api/applications/analytics', () => {
  /*
   * loadAnalytics issues its reads inside one Promise.all, in this literal
   * order: status groupBy, workFormat groupBy, salary aggregate, then eight
   * $queryRaw calls (overTime, stageTransitions, bySource, byRole,
   * responseBuckets, medianResponse, reachedInterview, offersEver), then
   * five application.count calls (sourceUnspecified, noResponse,
   * rejectedBeforeInterview, rejectedAfterInterview, withdrawn). JS evaluates
   * that array left to right before Promise.all awaits it, so
   * mockResolvedValueOnce calls queued in the same order land on the query
   * they are meant for.
   */
  function mockAnalyticsQueries({
    statusCounts = [],
    workFormatCounts = [],
    salaryAgg = {
      _min: { salary: null },
      _max: { salary: null },
      _avg: { salary: null },
      _count: { salary: 0 },
    },
    overTimeRows = [],
    transitionRows = [],
    sourceRows = [],
    roleRows = [],
    responseBucketRows = [],
    medianDays = null,
    reachedInterview = 0,
    offers = 0,
    sourceUnspecified = 0,
    noResponse = 0,
    rejectedBeforeInterview = 0,
    rejectedAfterInterview = 0,
    withdrawn = 0,
  }: {
    statusCounts?: { status: string; _count: { _all: number } }[]
    workFormatCounts?: { workFormat: string | null; _count: { _all: number } }[]
    salaryAgg?: {
      _min: { salary: number | null }
      _max: { salary: number | null }
      _avg: { salary: number | null }
      _count: { salary: number }
    }
    overTimeRows?: { period: Date; count: number }[]
    transitionRows?: { from_status: string; to_status: string; median_days: number | null; sample_count: number }[]
    sourceRows?: { key: string; sent: number; interviewed: number }[]
    roleRows?: { key: string; sent: number; interviewed: number }[]
    responseBucketRows?: { bucket: string; count: number }[]
    medianDays?: number | null
    reachedInterview?: number
    offers?: number
    sourceUnspecified?: number
    noResponse?: number
    rejectedBeforeInterview?: number
    rejectedAfterInterview?: number
    withdrawn?: number
  } = {}) {
    prismaMock.application.groupBy
      .mockResolvedValueOnce(statusCounts)
      .mockResolvedValueOnce(workFormatCounts);
    prismaMock.application.aggregate.mockResolvedValueOnce(salaryAgg);
    prismaMock.$queryRaw
      .mockResolvedValueOnce(overTimeRows)
      .mockResolvedValueOnce(transitionRows)
      .mockResolvedValueOnce(sourceRows)
      .mockResolvedValueOnce(roleRows)
      .mockResolvedValueOnce(responseBucketRows)
      .mockResolvedValueOnce([{ median: medianDays }])
      .mockResolvedValueOnce([{ count: reachedInterview }])
      .mockResolvedValueOnce([{ count: offers }]);
    prismaMock.application.count
      .mockResolvedValueOnce(sourceUnspecified)
      .mockResolvedValueOnce(noResponse)
      .mockResolvedValueOnce(rejectedBeforeInterview)
      .mockResolvedValueOnce(rejectedAfterInterview)
      .mockResolvedValueOnce(withdrawn);
  }

  it('401s without a session', async () => {
    prismaMock.session.findUnique.mockResolvedValue(null);

    const response = await app.inject({ method: 'GET', url: '/api/applications/analytics' });

    expect(response.statusCode).toBe(401);
  });

  it('fills every status and work format in even when nothing is there yet', async () => {
    mockAnalyticsQueries();

    const response = await app.inject({
      method: 'GET',
      url: '/api/applications/analytics',
      cookies: COOKIES,
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();

    // Every enum value gets a row at zero — a status nobody has reached yet
    // must not be missing from the funnel, or the chart it feeds would too.
    expect(body.funnel).toEqual([
      { status: 'APPLIED', count: 0 },
      { status: 'SCREENING', count: 0 },
      { status: 'INTERVIEW', count: 0 },
      { status: 'OFFER', count: 0 },
      { status: 'ACCEPTED', count: 0 },
      { status: 'REJECTED', count: 0 },
      { status: 'WITHDRAWN', count: 0 },
    ]);
    expect(body.byWorkFormat).toEqual([
      { workFormat: 'REMOTE', count: 0 },
      { workFormat: 'HYBRID', count: 0 },
      { workFormat: 'ONSITE', count: 0 },
    ]);
    expect(body.workFormatUnspecified).toBe(0);
    // Every one of the three real forward transitions gets a row, just an empty one.
    expect(body.stageTransitions).toEqual([
      { from: 'APPLIED', to: 'SCREENING', medianDays: null, sampleCount: 0 },
      { from: 'SCREENING', to: 'INTERVIEW', medianDays: null, sampleCount: 0 },
      { from: 'INTERVIEW', to: 'OFFER', medianDays: null, sampleCount: 0 },
    ]);
    expect(body.bySource).toEqual([]);
    expect(body.byRole).toEqual([]);
    expect(body.responseTimeDistribution).toEqual([
      { bucket: '1-2', count: 0 },
      { bucket: '3-4', count: 0 },
      { bucket: '5-7', count: 0 },
      { bucket: '8-14', count: 0 },
      { bucket: '15-21', count: 0 },
      { bucket: '22-30', count: 0 },
      { bucket: '30+', count: 0 },
    ]);
    expect(body.salaryStats).toEqual({ min: null, max: null, avg: null, count: 0 });
    expect(body.summary).toEqual({
      totalApplications: 0,
      reachedInterview: 0,
      medianDaysToFirstResponse: null,
      offers: 0,
    });
    // Below 5 applications, an insight would be noise rather than signal.
    expect(body.seasonSummary).toEqual([]);
  });

  it('reports counts, conversions and the salary range from what the database sends back', async () => {
    mockAnalyticsQueries({
      statusCounts: [
        { status: 'APPLIED', _count: { _all: 2 } },
        { status: 'INTERVIEW', _count: { _all: 1 } },
        { status: 'OFFER', _count: { _all: 1 } },
        { status: 'REJECTED', _count: { _all: 1 } },
      ],
      workFormatCounts: [
        { workFormat: 'REMOTE', _count: { _all: 3 } },
        { workFormat: null, _count: { _all: 2 } },
      ],
      salaryAgg: {
        _min: { salary: 120_000 },
        _max: { salary: 200_000 },
        _avg: { salary: 160_000 },
        _count: { salary: 3 },
      },
      overTimeRows: [
        { period: new Date('2026-07-06T00:00:00.000Z'), count: 2 },
        { period: new Date('2026-08-03T00:00:00.000Z'), count: 3 },
      ],
      transitionRows: [
        { from_status: 'APPLIED', to_status: 'SCREENING', median_days: 2.5, sample_count: 3 },
      ],
      sourceRows: [{ key: 'Referral', sent: 3, interviewed: 2 }],
      roleRows: [{ key: 'Frontend Engineer', sent: 5, interviewed: 1 }],
      responseBucketRows: [
        { bucket: '3-4', count: 2 },
        { bucket: '8-14', count: 1 },
      ],
      medianDays: 4.5,
      reachedInterview: 2,
      offers: 1,
      sourceUnspecified: 2,
      noResponse: 1,
      rejectedBeforeInterview: 1,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/applications/analytics',
      cookies: COOKIES,
    });

    const body = response.json();

    expect(body.funnel).toEqual(
      expect.arrayContaining([
        { status: 'APPLIED', count: 2 },
        { status: 'INTERVIEW', count: 1 },
        { status: 'OFFER', count: 1 },
        { status: 'REJECTED', count: 1 },
        { status: 'SCREENING', count: 0 },
        { status: 'WITHDRAWN', count: 0 },
      ]),
    );
    expect(body.byWorkFormat).toEqual(
      expect.arrayContaining([
        { workFormat: 'REMOTE', count: 3 },
        { workFormat: 'HYBRID', count: 0 },
        { workFormat: 'ONSITE', count: 0 },
      ]),
    );
    // The two applications with no format picked are counted, not dropped —
    // otherwise this and totalApplications could never be reconciled.
    expect(body.workFormatUnspecified).toBe(2);
    // The Monday each week starts on, not a calendar month.
    expect(body.overTime).toEqual([
      { period: '2026-07-06', count: 2 },
      { period: '2026-08-03', count: 3 },
    ]);
    expect(body.stageTransitions).toContainEqual({
      from: 'APPLIED',
      to: 'SCREENING',
      medianDays: 2.5,
      sampleCount: 3,
    });
    // A transition that has never happened still gets a row, just an empty one.
    expect(body.stageTransitions).toContainEqual({
      from: 'INTERVIEW',
      to: 'OFFER',
      medianDays: null,
      sampleCount: 0,
    });
    expect(body.bySource).toEqual([
      { source: 'Referral', sent: 3, interviewed: 2, conversionRate: 2 / 3 },
    ]);
    expect(body.sourceUnspecified).toBe(2);
    expect(body.byRole).toEqual([
      { role: 'Frontend Engineer', sent: 5, interviewed: 1, conversionRate: 1 / 5 },
    ]);
    expect(body.responseTimeDistribution).toContainEqual({ bucket: '3-4', count: 2 });
    expect(body.responseTimeDistribution).toContainEqual({ bucket: '8-14', count: 1 });
    expect(body.responseTimeDistribution).toContainEqual({ bucket: '1-2', count: 0 });
    expect(body.lost).toEqual({
      noResponse: 1,
      rejectedBeforeInterview: 1,
      rejectedAfterInterview: 0,
      withdrawn: 0,
    });
    expect(body.salaryStats).toEqual({ min: 120_000, max: 200_000, avg: 160_000, count: 3 });
    expect(body.summary).toEqual({
      totalApplications: 5,
      reachedInterview: 2,
      medianDaysToFirstResponse: 4.5,
      offers: 1,
    });
    // 5 applications clears the noise floor, and there is exactly one real
    // signal in this fixture (one transition has data, one source alone
    // cannot be compared against another) — the slowest-step insight.
    expect(body.seasonSummary).toHaveLength(1);
    expect(body.seasonSummary[0]).toContain('Applied → Screening');
  });
});
