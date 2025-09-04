const express = require('express');
const { getMemoryInfo, getDiskInfo, bytesToMB } = require('../utils/system.utils');

const router = express.Router();

router.get('/health', async (_req, res) => {
  const memory = getMemoryInfo();
  const disk = await getDiskInfo();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      freeMB: bytesToMB(memory.freeBytes),
      totalMB: bytesToMB(memory.totalBytes),
    },
    storage: {
      availableMB: bytesToMB(disk.availableBytes),
      totalMB: bytesToMB(disk.totalBytes),
    },
  });
});

router.get('/isServerConnectedToInternet', (_req, res) => {
  res.json({ connected: true });
});

module.exports = router;
