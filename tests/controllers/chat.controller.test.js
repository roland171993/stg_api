/**
 * tests/controllers/chat.controller.test.js
 *
 * Unit tests — all I/O (DB, Socket.io) is mocked.
 *
 * Mongoose query chains used by the controller:
 *   Room.find({}).sort({}).lean()
 *   Room.findOne({}).lean()
 *   Message.find({}).sort({}).limit(n).lean()
 */

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */
jest.mock('../../src/models', () => ({
  Room: {
    find:             jest.fn(),
    findOne:          jest.fn(),
    findOneAndUpdate: jest.fn()
  },
  Message: {
    find:       jest.fn(),
    create:     jest.fn(),
    updateMany: jest.fn()
  }
}));

jest.mock('../../src/services/socket.service', () => ({
  getIO: jest.fn()
}));

jest.mock('../../src/config/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn()
}));

/* ------------------------------------------------------------------ */
/* SUT                                                                  */
/* ------------------------------------------------------------------ */
const { getRooms, getMessages, uploadFile } = require('../../src/controllers/chat.controller');
const { Room, Message }  = require('../../src/models');
const socketService       = require('../../src/services/socket.service');

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function mockRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
}

function makeReq(overrides = {}) {
  return {
    user:   { id: 'uid123', role: 'user' },
    userId: 'uid123',
    params: {},
    query:  {},
    body:   {},
    file:   undefined,
    ...overrides
  };
}

/**
 * Build a mock Mongoose chain: find({}).sort({}).lean() → value
 */
function mockFindSortLean(value) {
  const leanMock = jest.fn().mockResolvedValue(value);
  const sortMock = jest.fn().mockReturnValue({ lean: leanMock });
  Room.find.mockReturnValue({ sort: sortMock });
  return { sortMock, leanMock };
}

/**
 * Build a mock Mongoose chain: findOne({}).lean() → value
 */
function mockFindOneLean(value) {
  const leanMock = jest.fn().mockResolvedValue(value);
  Room.findOne.mockReturnValue({ lean: leanMock });
  return { leanMock };
}

/**
 * Build a mock Mongoose chain: Message.find({}).sort({}).limit(n).lean() → value
 */
function mockMessageFindChain(value) {
  const leanMock  = jest.fn().mockResolvedValue(value);
  const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
  const sortMock  = jest.fn().mockReturnValue({ limit: limitMock });
  Message.find.mockReturnValue({ sort: sortMock });
  return { sortMock, limitMock, leanMock };
}

/* ------------------------------------------------------------------ */
/* getRooms                                                            */
/* ------------------------------------------------------------------ */
describe('getRooms', () => {
  let res, next;

  beforeEach(() => {
    res  = mockRes();
    next = jest.fn();
    Room.find.mockReset();
    Room.findOne.mockReset();
  });

  it('user gets only their own room (found)', async () => {
    const room = { roomId: 'support-uid123' };
    mockFindOneLean(room);
    await getRooms(makeReq(), res, next);
    expect(res.json).toHaveBeenCalledWith({ rooms: [room] });
  });

  it('user gets empty array when room does not exist yet', async () => {
    mockFindOneLean(null);
    await getRooms(makeReq(), res, next);
    expect(res.json).toHaveBeenCalledWith({ rooms: [] });
  });

  it('admin gets all rooms via Room.find sorted', async () => {
    const rooms = [{ roomId: 'support-a' }, { roomId: 'support-b' }];
    mockFindSortLean(rooms);
    await getRooms(makeReq({ user: { id: 'admin1', role: 'admin' }, userId: 'admin1' }), res, next);
    expect(Room.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ rooms });
  });

  it('calls next(err) on unexpected DB error', async () => {
    Room.findOne.mockReturnValue({
      lean: jest.fn().mockRejectedValue(new Error('DB fail'))
    });
    await getRooms(makeReq(), res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

/* ------------------------------------------------------------------ */
/* getMessages                                                         */
/* ------------------------------------------------------------------ */
describe('getMessages', () => {
  let res, next;

  beforeEach(() => {
    res  = mockRes();
    next = jest.fn();
    Message.find.mockReset();
  });

  it('403 when non-admin requests another user room', async () => {
    const req = makeReq({ params: { roomId: 'support-other' } });
    await getMessages(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns paginated messages in ascending order (reversed)', async () => {
    const msgs = [{ content: 'b' }, { content: 'a' }];
    mockMessageFindChain([...msgs]);
    const req = makeReq({ params: { roomId: 'support-uid123' } });
    await getMessages(req, res, next);
    // Controller calls .reverse() — so ['b','a'] becomes ['a','b']
    expect(res.json).toHaveBeenCalledWith({ messages: [{ content: 'a' }, { content: 'b' }] });
  });

  it('adds $lt createdAt filter when "before" query param provided', async () => {
    const iso = '2025-01-01T00:00:00.000Z';
    mockMessageFindChain([]);
    const req = makeReq({ params: { roomId: 'support-uid123' }, query: { before: iso } });
    await getMessages(req, res, next);
    expect(Message.find).toHaveBeenCalledWith(
      expect.objectContaining({ createdAt: { $lt: new Date(iso) } })
    );
  });

  it('admin can query any room', async () => {
    mockMessageFindChain([]);
    const req = makeReq({
      user:   { id: 'admin1', role: 'admin' },
      userId: 'admin1',
      params: { roomId: 'support-uid123' }
    });
    await getMessages(req, res, next);
    expect(res.json).toHaveBeenCalledWith({ messages: [] });
  });

  it('calls next(err) on DB error', async () => {
    Message.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('DB fail'))
        })
      })
    });
    const req = makeReq({ params: { roomId: 'support-uid123' } });
    await getMessages(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

/* ------------------------------------------------------------------ */
/* uploadFile                                                          */
/* ------------------------------------------------------------------ */
describe('uploadFile', () => {
  let res, next;
  const mockFile = {
    filename:     '1234-test.jpg',
    originalname: 'test.jpg',
    size:         20480
  };

  beforeEach(() => {
    res  = mockRes();
    next = jest.fn();
    Message.create.mockReset();
    Room.findOneAndUpdate.mockReset();
    socketService.getIO.mockReset();
  });

  it('400 when no file attached', async () => {
    const req = makeReq({ params: { roomId: 'support-uid123' } });
    await uploadFile(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('403 when user requests another room', async () => {
    const req = makeReq({ params: { roomId: 'support-other' }, file: mockFile });
    await uploadFile(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('201 + broadcasts new_message for image upload', async () => {
    const savedMessage = { _id: 'msg1', roomId: 'support-uid123', fileType: 'image' };
    Message.create.mockResolvedValue(savedMessage);
    Room.findOneAndUpdate.mockResolvedValue({});

    const emitMock = jest.fn();
    const ioMock   = { to: jest.fn().mockReturnValue({ emit: emitMock }) };
    socketService.getIO.mockReturnValue(ioMock);

    const req = makeReq({ params: { roomId: 'support-uid123' }, file: mockFile });
    await uploadFile(req, res, next);

    expect(Message.create).toHaveBeenCalledWith(
      expect.objectContaining({ fileType: 'image', fileUrl: '/uploads/chat/1234-test.jpg' })
    );
    expect(ioMock.to).toHaveBeenCalledWith('support-uid123');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: savedMessage });
  });

  it('detects document type for .pdf extension', async () => {
    const pdfFile    = { filename: '999-doc.pdf', originalname: 'report.pdf', size: 5000 };
    const savedMsg   = { _id: 'msg2', fileType: 'document' };
    Message.create.mockResolvedValue(savedMsg);
    Room.findOneAndUpdate.mockResolvedValue({});
    socketService.getIO.mockReturnValue(null); // no Socket.io server in unit tests

    const req = makeReq({ params: { roomId: 'support-uid123' }, file: pdfFile });
    await uploadFile(req, res, next);

    expect(Message.create).toHaveBeenCalledWith(
      expect.objectContaining({ fileType: 'document' })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('admin can upload to any room', async () => {
    const savedMsg = { _id: 'msg3', fileType: 'image' };
    Message.create.mockResolvedValue(savedMsg);
    Room.findOneAndUpdate.mockResolvedValue({});
    socketService.getIO.mockReturnValue(null);

    const req = makeReq({
      user:   { id: 'admin1', role: 'admin' },
      userId: 'admin1',
      params: { roomId: 'support-uid123' },
      file:   mockFile
    });
    await uploadFile(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('calls next(err) on unexpected error', async () => {
    Message.create.mockRejectedValue(new Error('DB fail'));
    const req = makeReq({ params: { roomId: 'support-uid123' }, file: mockFile });
    await uploadFile(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
