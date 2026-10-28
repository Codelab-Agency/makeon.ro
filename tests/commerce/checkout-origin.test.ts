import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST as checkout } from '../../src/app/api/checkout/route';
import { POST as cancel } from '../../src/app/api/checkout/cancel/route';

test('checkout accepts the serving origin even when its canonical URL differs, while rejecting foreign and absent origins', async () => {
  const configuration = {
    DATABASE_URL: 'postgresql://unused-for-origin-check', PAYLOAD_SECRET: 'x'.repeat(32),
    STRIPE_SECRET_KEY: 'sk_test_unused', STRIPE_WEBHOOK_SECRET: 'whsec_unused',
    APP_URL: 'https://canonical.example', SHIPPING_PRICE_BANI: '2000', ADMIN_ALLOWED_ORIGINS: '',
  };
  const previous = Object.fromEntries(Object.keys(configuration).map(key => [key, process.env[key]]));
  Object.assign(process.env, configuration);
  try {
    for (const origin of ['http://localhost:3001', 'https://makeon.ro']) {
      const response = await checkout(new Request(`${origin}/api/checkout`, {
        method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{}',
      }));
      // Input validation stops before inventory, database writes or a Stripe session.
      assert.equal(response.status, 400);
      assert.notEqual((await response.json()).error, 'Cerere neautorizată.');
    }
    for (const handler of [checkout, cancel]) {
      for (const origin of ['https://foreign.example', 'null', '']) {
        const headers: Record<string, string> = { 'content-type': 'application/json' };
        if (origin) headers.origin = origin;
        const response = await handler(new Request('https://makeon.ro/api/checkout', {
          method: 'POST', headers, body: '{}',
        }));
        assert.equal(response.status, 403);
      }
    }
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
