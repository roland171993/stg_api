/**
 * tests/controllers/ai.controller.test.js
 *
 * Unit tests — all external I/O (AI APIs, mail, filesystem, axios) is mocked.
 */

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */
jest.mock('../../src/services/ai.service', () => ({
  generateText:  jest.fn(),
  generateImage: jest.fn()
}));

jest.mock('../../src/services/mail.service', () => ({
  sendCoverLetterEmail: jest.fn(),
  sendPhotoEmail:       jest.fn()
}));

jest.mock('axios', () => ({
  get: jest.fn()
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn()
}));

jest.mock('../../src/config/logger', () => ({
  info:  jest.fn(),
  warn:  jest.fn(),
  error: jest.fn()
}));

/* ------------------------------------------------------------------ */
/* SUT                                                                 */
/* ------------------------------------------------------------------ */
const { generateCoverLetter, generateProfessionalPhoto } = require('../../src/controllers/ai.controller');
const aiService   = require('../../src/services/ai.service');
const mailService = require('../../src/services/mail.service');
const axios       = require('axios');
const fs          = require('fs');

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
    files:  [],
    file:   undefined,
    ...overrides
  };
}

/* ------------------------------------------------------------------ */
/* generateCoverLetter                                                 */
/* ------------------------------------------------------------------ */
describe('generateCoverLetter', () => {
  let res, next;

  beforeEach(() => {
    res  = mockRes();
    next = jest.fn();
    jest.clearAllMocks();

    // Default: axios returns fake arraybuffer and fs.writeFileSync is a no-op
    axios.get.mockResolvedValue({ data: Buffer.from('fake-image') });
    fs.writeFileSync.mockImplementation(() => {});
  });

  it('1. returns 200 + coverLetter on success', async () => {
    aiService.generateText.mockResolvedValue('Ma super lettre de motivation');

    const req = makeReq({ body: { jobTitle: 'Développeur', provider: 'openai' } });
    await generateCoverLetter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      coverLetter: 'Ma super lettre de motivation'
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('2. calls mailService.sendCoverLetterEmail when sendToEmail is provided', async () => {
    aiService.generateText.mockResolvedValue('Lettre générée');
    mailService.sendCoverLetterEmail.mockResolvedValue();

    const req = makeReq({
      body: { jobTitle: 'Ingénieur', sendToEmail: 'test@example.com', provider: 'openai' }
    });
    await generateCoverLetter(req, res, next);

    expect(mailService.sendCoverLetterEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      jobTitle: 'Ingénieur',
      coverLetter: 'Lettre générée'
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('3. does NOT call mailService when sendToEmail is absent', async () => {
    aiService.generateText.mockResolvedValue('Lettre sans email');

    const req = makeReq({ body: { jobTitle: 'Designer', provider: 'openai' } });
    await generateCoverLetter(req, res, next);

    expect(mailService.sendCoverLetterEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('4. calls aiService.generateText with provider "gemini" when specified', async () => {
    aiService.generateText.mockResolvedValue('Lettre via Gemini');

    const req = makeReq({ body: { jobTitle: 'Chef de projet', provider: 'gemini' } });
    await generateCoverLetter(req, res, next);

    expect(aiService.generateText).toHaveBeenCalledWith(
      expect.any(String),
      'gemini'
    );
  });

  it('5. calls next(err) when aiService.generateText throws', async () => {
    const error = new Error('OpenAI API error');
    aiService.generateText.mockRejectedValue(error);

    const req = makeReq({ body: { jobTitle: 'Manager', provider: 'openai' } });
    await generateCoverLetter(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* generateProfessionalPhoto                                           */
/* ------------------------------------------------------------------ */
describe('generateProfessionalPhoto', () => {
  let res, next;

  beforeEach(() => {
    res  = mockRes();
    next = jest.fn();
    jest.clearAllMocks();

    axios.get.mockResolvedValue({ data: Buffer.from('fake-image-data') });
    fs.writeFileSync.mockImplementation(() => {});
  });

  it('6. returns 200 + photoUrl on success', async () => {
    aiService.generateImage.mockResolvedValue('https://dalle.openai.com/image/abc.jpg');

    const req = makeReq({ body: { jobTitle: 'Consultant' } });
    await generateProfessionalPhoto(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, photoUrl: expect.stringMatching(/^\/uploads\/ai-photos\//) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('7. calls mailService.sendPhotoEmail when sendToEmail is provided', async () => {
    aiService.generateImage.mockResolvedValue('https://dalle.openai.com/image/xyz.jpg');
    mailService.sendPhotoEmail.mockResolvedValue();

    const req = makeReq({
      body: { jobTitle: 'Analyste', sendToEmail: 'user@test.com' }
    });
    await generateProfessionalPhoto(req, res, next);

    expect(mailService.sendPhotoEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com', jobTitle: 'Analyste' })
    );
  });

  it('8. does NOT call mailService when sendToEmail is absent', async () => {
    aiService.generateImage.mockResolvedValue('https://dalle.openai.com/image/no-mail.jpg');

    const req = makeReq({ body: { jobTitle: 'Développeur' } });
    await generateProfessionalPhoto(req, res, next);

    expect(mailService.sendPhotoEmail).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('9. calls next(err) when aiService.generateImage throws', async () => {
    const error = new Error('DALL-E error');
    aiService.generateImage.mockRejectedValue(error);

    const req = makeReq({ body: { jobTitle: 'Architecte' } });
    await generateProfessionalPhoto(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.json).not.toHaveBeenCalled();
  });

  it('10. withSuit="false" → prompt does not contain "formal business suit"', async () => {
    aiService.generateImage.mockResolvedValue('https://dalle.openai.com/image/casual.jpg');

    const req = makeReq({ body: { jobTitle: 'Créatif', withSuit: 'false' } });
    await generateProfessionalPhoto(req, res, next);

    const calledPrompt = aiService.generateImage.mock.calls[0][0];
    expect(calledPrompt).not.toContain('formal business suit');
    expect(calledPrompt).toContain('smart casual attire');
  });
});
