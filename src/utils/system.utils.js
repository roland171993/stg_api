const os = require('os');
const { execFile, exec } = require('child_process');

function getMemoryInfo() {
  return {
    freeBytes: os.freemem(),
    totalBytes: os.totalmem(),
  };
}

function getDiskInfo() {
  return new Promise((resolve) => {
    const path = process.env.HEALTH_STORAGE_PATH || '/';
    const platform = process.platform;

    if (platform === 'linux' || platform === 'darwin' || platform === 'freebsd' || platform === 'openbsd') {
      execFile('df', ['-B1', '-P', path], (err, stdout) => {
        if (err || !stdout) return resolve({ availableBytes: null, totalBytes: null });
        const lines = stdout.trim().split('\n');
        const cols = lines[1]?.split(/\s+/);
        if (!cols || cols.length < 6) return resolve({ availableBytes: null, totalBytes: null });

        const total = Number(cols[1]);
        const avail = Number(cols[3]);

        resolve({
          availableBytes: Number.isFinite(avail) ? avail : null,
          totalBytes: Number.isFinite(total) ? total : null,
        });
      });
      return;
    }

    exec('wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /value', (err, stdout) => {
      if (!err && stdout) {
        const freeMatch = stdout.match(/FreeSpace=(\d+)/);
        const sizeMatch = stdout.match(/Size=(\d+)/);
        if (freeMatch && sizeMatch) {
          return resolve({
            availableBytes: Number(freeMatch[1]),
            totalBytes: Number(sizeMatch[1]),
          });
        }
      }
      exec('powershell -Command "(Get-PSDrive -Name C).Free, (Get-PSDrive -Name C).Used + (Get-PSDrive -Name C).Free"', (psErr, psOut) => {
        if (!psErr && psOut) {
          const nums = psOut.trim().split(/\s+/).map(Number);
          if (nums.length >= 2 && nums.every(n => Number.isFinite(n))) {
            return resolve({ availableBytes: nums[0], totalBytes: nums[1] });
          }
        }
        resolve({ availableBytes: null, totalBytes: null });
      });
    });
  });
}

function bytesToMB(bytes) {
  if (!bytes || Number.isNaN(bytes)) return null;
  return Math.round(bytes / (1024 * 1024));
}

module.exports = {
  getMemoryInfo,
  getDiskInfo,
  bytesToMB,
};
