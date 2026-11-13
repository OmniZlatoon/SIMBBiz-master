const assert = require('node:assert/strict');
const test = require('node:test');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('loads and registers all password recovery routes documented for POST /api', () => {
  const script = `
    const router = require('./routes/index');
    const expected = [
      '/auth/forget-password',
      '/auth/forget-password/email',
      '/auth/forget-password/whatsapp',
      '/auth/forget-password/whatsapp/status',
      '/auth/forget-password/verify-otp',
      '/auth/reset-password',
      '/webhooks/whatsapp'
    ];
    const registered = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({ path: layer.route.path, methods: layer.route.methods }));
    const missing = expected.filter((route) =>
      !registered.some((entry) => entry.path === route && entry.methods.post)
    );
    const missingWebhookVerification = !registered.some((entry) =>
      entry.path === '/webhooks/whatsapp' && entry.methods.get
    );
    if (missing.length || missingWebhookVerification) {
      console.error('Missing password recovery or webhook routes:', {
        missing,
        missingWebhookVerification
      });
      process.exit(1);
    }
    console.log('All documented password recovery routes are registered.');
    process.exit(0);
  `;
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    timeout: 15000
  });

  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /All documented password recovery routes are registered/);
});
