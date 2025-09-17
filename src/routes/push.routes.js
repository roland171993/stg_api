const router = require('express').Router();
const auth = require('../middlewares/auth.middleware');
const { body } = require('express-validator');
const { sendToExternalUserIds } = require('../services/notification.service');
const { upsertDevice, updateOpt } = require('../services/device.service');
const { publishNextJobAndNotify } = require('../jobs/add-job.job');

router.post('/devices',
  body('playerId').isString().notEmpty(),
  body('platform').isIn(['android','ios','web']),
  auth.optional, // allow guests but attach userId if logged in
  async (req, res, next) => {
    try {
      const saved = await upsertDevice({ userId: req.user?.id, ...req.body });
      res.json(saved);
    } catch (e) { next(e); }
  }
);

router.post('/opt',
  auth.required,
  async (req, res, next) => {
    try {
      await updateOpt(req.user.id, req.body.categories || {});
      res.json({ ok: true });
    } catch (e) { next(e); }
  }
);

router.post('/test',
  auth.requireAdmin,
  body('userId').isString(),
  async (req, res, next) => {
    try {
      const r = await sendToExternalUserIds({
        userIds: [req.body.userId],
        title: 'Test notification',
        body: 'Hello from backend 👋',
        data: { type: 'TEST' }
      });
      res.json(r);
    } catch (e) { next(e); }
  }
);

router.post('/test-next',
  auth.requireAdmin,
  async (req, res, next) => {
    try {
      await publishNextJobAndNotify();
      res.json({ ok: true });
    } catch (e) { next(e); }
  }
);

module.exports = router;
