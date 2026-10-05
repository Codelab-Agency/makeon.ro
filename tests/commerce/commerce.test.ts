import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Payload } from 'payload';
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres';
import type Stripe from 'stripe';
import { parseLines, validGrind, priceBani } from '../../src/lib/commerce-validation';
import { legal } from '../../src/lib/legal';

let cms: Payload;
let commerce: typeof import('../../src/lib/commerce');
const sessions = new Map<string, Stripe.Checkout.Session>();
const keys = new Map<string, Stripe.Checkout.Session>();
let creates = 0;
const fakeStripe = { checkout: { sessions: {
  create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
    if (keys.has(options.idempotencyKey)) return keys.get(options.idempotencyKey)!;
    creates++;
    const total = params.line_items!.reduce((sum, line) => sum + line.quantity! * line.price_data!.unit_amount!, 0)
      + params.shipping_options![0].shipping_rate_data!.fixed_amount!.amount;
    const session = { id: `cs_test_${randomUUID().replaceAll('-', '')}`, url: 'https://checkout.stripe.com/test', status: 'open', payment_status: 'unpaid',
      client_reference_id: params.client_reference_id, amount_total: total, currency: 'ron', expires_at: params.expires_at,
    } as Stripe.Checkout.Session;
    sessions.set(session.id, session); keys.set(options.idempotencyKey, session);
    return session;
  },
  retrieve: async (id: string) => sessions.get(id)!,
  expire: async (id: string) => {
    const session = sessions.get(id)!; session.status = 'expired'; return session;
  },
} } } as unknown as Stripe;

before(async () => {
  // This suite is deliberately restricted to an isolated local database.
  process.env.DATABASE_URL = 'postgresql://postgres:makeon-local-test-only@127.0.0.1:55432/makeon_test';
  process.env.PAYLOAD_DB_PUSH = 'true';
  process.env.PAYLOAD_SECRET = 'local-integration-test-secret-not-for-production';
  process.env.STRIPE_SECRET_KEY = 'sk_test_local_mock'; process.env.STRIPE_WEBHOOK_SECRET = 'whsec_local_mock';
  process.env.APP_URL = 'http://localhost:3000'; process.env.SHIPPING_PRICE_BANI = '2000';
  Object.assign(process.env, { NODE_ENV: 'development' });
  const { getPayload } = await import('payload');
  const { default: config } = await import('../../src/payload.config');
  cms = await getPayload({ config });
  await (cms.db as unknown as PostgresAdapter).drizzle.execute(sql`TRUNCATE orders, products RESTART IDENTITY CASCADE`);
  const constraints = await import('../../src/migrations/20261002_121000_inventory_constraints');
  const adapter = cms.db as unknown as PostgresAdapter;
  await adapter.drizzle.execute(sql`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_inventory_valid;
    ALTER TABLE products DROP CONSTRAINT IF EXISTS products_price_valid;`);
  await constraints.up({ db: adapter.drizzle } as Parameters<typeof constraints.up>[0]);
  commerce = await import('../../src/lib/commerce');
});
after(async () => { if (cms) {
  const adapter = cms.db as unknown as PostgresAdapter;
  assert.deepEqual(Object.keys(adapter.sessions), []);
  await cms.destroy();
} });

async function product(stock = 5) {
  return cms.create({ collection: 'products', data: { slug: `test-${randomUUID()}`, name: 'Cafea test', category: 'boabe',
    collection: 'Teste', grams: 500, description: 'Produs pentru verificarea comenzilor.', price: 49.99, stock, reserved: 0, active: true } });
}

test('admin order edits preserve payment snapshots and concurrent stock settlement', async () => {
  const p = await product(3); const key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], key, fakeStripe, cms);
  const order = (await cms.find({ collection: 'orders', where: { reference: { equals: `MK-${key}` } } })).docs[0];
  const user = { id: 999, collection: 'users' as const, email: 'admin@example.test' };
  await assert.rejects(cms.update({ collection: 'orders', id: order.id, overrideAccess: false, data: { fulfillmentStatus: 'processing' } }));
  const session = keys.get(`MK-${key}`)!;
  await Promise.all([
    commerce.applySession({ ...session, status: 'complete', payment_status: 'paid' }, cms),
    cms.update({ collection: 'orders', id: order.id, overrideAccess: false, user,
      data: { fulfillmentStatus: 'processing', status: 'failed', totalBani: 1, shippingAddress: { fake: true } } }),
  ]);
  const saved = await cms.findByID({ collection: 'orders', id: order.id });
  assert.equal(saved.fulfillmentStatus, 'processing'); assert.equal(saved.status, 'paid');
  assert.equal(saved.totalBani, order.totalBani); assert.equal(saved.shippingAddress, null);
  const inventory = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(inventory.stock, 2); assert.equal(inventory.reserved, 0);
});

test('constraint repair preserves data, is repeatable, and rejects invalid inventory', async () => {
  const adapter = cms.db as unknown as PostgresAdapter;
  const repair = await import('../../src/migrations/20261005_120000_restore_inventory_constraints');
  const p = await product(3);
  await adapter.drizzle.execute(sql`ALTER TABLE products DROP CONSTRAINT products_inventory_valid;
    ALTER TABLE products DROP CONSTRAINT products_price_valid;`);
  await adapter.drizzle.execute(sql`UPDATE products SET stock = -1 WHERE id = ${p.id}`);
  await assert.rejects(adapter.drizzle.transaction(async (db) => {
    await repair.up({ db } as unknown as Parameters<typeof repair.up>[0]);
  }));
  const invalid = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(invalid.stock, -1);
  await adapter.drizzle.execute(sql`UPDATE products SET stock = 3 WHERE id = ${p.id}`);
  await adapter.drizzle.transaction(async (db) => {
    await repair.up({ db } as unknown as Parameters<typeof repair.up>[0]);
    await repair.up({ db } as unknown as Parameters<typeof repair.up>[0]);
  });
  const saved = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(saved.stock, 3);
  assert.equal(saved.name, p.name);
  assert.equal(saved.price, p.price);
  await assert.rejects(adapter.drizzle.execute(sql`UPDATE products SET reserved = 4 WHERE id = ${p.id}`));
  await assert.rejects(adapter.drizzle.execute(sql`UPDATE products SET price = -1 WHERE id = ${p.id}`));
});

test('validates cart input and ignores client-supplied prices', () => {
  assert.deepEqual(parseLines({ items: [{ slug: 'intense', grind: 'Boabe', quantity: 1, price: 0.01 }, { slug: 'intense', grind: 'Boabe', quantity: 2 }] }),
    [{ slug: 'intense', grind: 'Boabe', quantity: 3 }]);
  for (const quantity of [0, -1, 0.5, 100, '2']) assert.throws(() => parseLines({ items: [{ slug: 'intense', grind: 'Boabe', quantity }] }));
  assert.throws(() => parseLines({ items: [] })); assert.throws(() => priceBani(null));
  assert.equal(priceBani(49.99), 4999); assert.equal(validGrind('boabe', 'Espresso'), false);
});

test('reserves stock, snapshots server price, and retries checkout idempotently', async () => {
  const p = await product(); const key = randomUUID(); const beforeCreates = creates;
  const lines = [{ slug: p.slug, grind: 'Boabe', quantity: 2 }];
  await commerce.createCheckout(lines, key, fakeStripe, cms);
  await commerce.createCheckout(lines, key, fakeStripe, cms);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 5); assert.equal(updated.reserved, 2); assert.equal(creates, beforeCreates + 1);
  const orders = await cms.find({ collection: 'orders', where: { reference: { equals: `MK-${key}` } }, depth: 0 });
  assert.equal(orders.docs.length, 1); assert.equal(orders.docs[0].totalBani, 11998);
  await assert.rejects(commerce.createCheckout([{ ...lines[0], quantity: 1 }], key, fakeStripe, cms));
});

test('concurrent buyers cannot reserve the last item twice', async () => {
  const p = await product(1);
  const results = await Promise.allSettled([0, 1].map(() => commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], randomUUID(), fakeStripe, cms)));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 1); assert.equal(updated.reserved, 1);
});

test('signed-session processing is idempotent under concurrent delivery and rejects mismatched totals', async () => {
  const p = await product(3); const key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 2 }], key, fakeStripe, cms);
  const session = keys.get(`MK-${key}`)!;
  session.status = 'complete'; session.payment_status = 'paid';
  await assert.rejects(commerce.applySession({ ...session, amount_total: 1 }, cms));
  assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 2);
  await Promise.all([commerce.applySession(session, cms), commerce.applySession(session, cms)]);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 1); assert.equal(updated.reserved, 0);
});

test('expiration releases reservations without reducing physical stock', async () => {
  const p = await product(2); const key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 2 }], key, fakeStripe, cms);
  const session = keys.get(`MK-${key}`)!; session.status = 'expired';
  await commerce.applySession(session, cms); await commerce.applySession(session, cms);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 2); assert.equal(updated.reserved, 0);
});

test('an invalid multi-product checkout rolls back every reservation', async () => {
  const a = await product(5), b = await product(0);
  await assert.rejects(commerce.createCheckout([{ slug: a.slug, grind: 'Boabe', quantity: 2 }, { slug: b.slug, grind: 'Boabe', quantity: 1 }], randomUUID(), fakeStripe, cms));
  assert.equal((await cms.findByID({ collection: 'products', id: a.id })).reserved, 0);
});

test('orders and admin accounts are inaccessible without authentication', async () => {
  await assert.rejects(cms.find({ collection: 'orders', overrideAccess: false }));
  await assert.rejects(cms.create({ collection: 'users', overrideAccess: false, data: { email: 'public@example.test', password: 'cannot-register-this-account' } }));
});

test('returning from cancelled checkout releases stock and keeps the physical quantity', async () => {
  const p = await product(2); const key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 2 }], key, fakeStripe, cms);
  await commerce.cancelCheckout(key, fakeStripe, cms);
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 2); assert.equal(updated.reserved, 0);
});

test('an interrupted Stripe response can be recovered without a second order or reservation', async () => {
  const p = await product(2); const key = randomUUID();
  let interrupted = true;
  const networkStripe = { checkout: { sessions: { ...fakeStripe.checkout.sessions,
    create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
      const session = await fakeStripe.checkout.sessions.create(params, options);
      if (interrupted) { interrupted = false; throw new Error('Simulated lost response'); }
      return session;
    },
  } } } as unknown as Stripe;
  const lines = [{ slug: p.slug, grind: 'Boabe', quantity: 1 }];
  await assert.rejects(commerce.createCheckout(lines, key, networkStripe, cms));
  await commerce.createCheckout(lines, key, networkStripe, cms);
  assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 1);
  const orders = await cms.find({ collection: 'orders', where: { reference: { equals: `MK-${key}` } } });
  assert.equal(orders.docs.length, 1);
});

test('webhook rejects an unsigned or forged request', async () => {
  const { POST } = await import('../../src/app/api/stripe/webhook/route');
  assert.equal((await POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', body: '{}' }))).status, 400);
  assert.equal((await POST(new Request('http://localhost/api/stripe/webhook', { method: 'POST', headers: { 'stripe-signature': 'invalid' }, body: '{}' }))).status, 400);
});

test('many simultaneous retries create only one Stripe session and one reservation', async () => {
  const p = await product(5), key = randomUUID(), beforeCreates = creates;
  let activeCreates = 0;
  const slowStripe = { checkout: { sessions: { ...fakeStripe.checkout.sessions,
    create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
      assert.equal(activeCreates++, 0, 'Stripe creation must be serialized by PostgreSQL');
      try {
        await new Promise(resolve => setTimeout(resolve, 30));
        return await fakeStripe.checkout.sessions.create(params, options);
      } finally { activeCreates--; }
    },
  } } } as unknown as Stripe;
  const results = await Promise.all(Array.from({ length: 12 }, () => commerce.createCheckout([
    { slug: p.slug, grind: 'Boabe', quantity: 2 },
  ], key, slowStripe, cms)));
  assert.equal(new Set(results.map(r => r.url)).size, 1);
  assert.equal(creates, beforeCreates + 1);
  assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 2);
});

test('out-of-stock, inactive, and negative-quantity orders never open Stripe checkout', async () => {
  const empty = await product(0), inactive = await product(5), available = await product(5);
  await cms.update({ collection: 'products', id: inactive.id, data: { active: false } });
  const beforeCreates = creates;
  for (const [p, quantity] of [[empty, 1], [inactive, 1], [available, -1]] as const) {
    await assert.rejects(commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity }], randomUUID(), fakeStripe, cms));
    assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 0);
  }
  assert.equal(creates, beforeCreates);
});

test('many competing buyers cannot oversell and paid retries cannot create a second payment', async () => {
  const p = await product(3), beforeCreates = creates;
  const buyerKeys = Array.from({ length: 15 }, () => randomUUID());
  const results = await Promise.allSettled(buyerKeys.map(key => commerce.createCheckout([
    { slug: p.slug, grind: 'Boabe', quantity: 1 },
  ], key, fakeStripe, cms)));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 3);
  const winners = buyerKeys.filter((_, i) => results[i].status === 'fulfilled');
  await Promise.all(winners.flatMap(key => {
    const session = keys.get(`MK-${key}`)!;
    session.status = 'complete'; session.payment_status = 'paid';
    return Array.from({ length: 5 }, () => commerce.applySession(session, cms));
  }));
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 0); assert.equal(updated.reserved, 0);
  await assert.rejects(commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], winners[0], fakeStripe, cms));
  assert.equal(creates, beforeCreates + 3);
});

test('a webhook arriving during Stripe creation waits for the session ID to be persisted', async () => {
  const p = await product(1), key = randomUUID();
  let webhook: Promise<unknown> | undefined;
  const earlyWebhookStripe = { checkout: { sessions: { ...fakeStripe.checkout.sessions,
    create: async (params: Stripe.Checkout.SessionCreateParams, options: { idempotencyKey: string }) => {
      const session = await fakeStripe.checkout.sessions.create(params, options);
      webhook = commerce.applySession({ ...session, status: 'complete', payment_status: 'paid' }, cms);
      await new Promise(resolve => setTimeout(resolve, 30));
      return session;
    },
  } } } as unknown as Stripe;
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], key, earlyWebhookStripe, cms);
  await webhook;
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.stock, 0); assert.equal(updated.reserved, 0);
});

test('an order-save failure rolls back stock deductions and a retry settles exactly once', async () => {
  const p = await product(2), key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], key, fakeStripe, cms);
  const session = { ...keys.get(`MK-${key}`)!, status: 'complete', payment_status: 'paid' } as Stripe.Checkout.Session;
  const failingCMS = new Proxy(cms, { get(target, name) {
    if (name === 'update') return async (args: { collection: string; data: { status?: string } }) => {
      if (args.collection === 'orders' && args.data.status === 'paid') throw new Error('Simulated database write failure');
      return target.update(args as Parameters<Payload['update']>[0]);
    };
    const value = Reflect.get(target, name);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
  await assert.rejects(commerce.applySession(session, failingCMS));
  const unchanged = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(unchanged.stock, 2); assert.equal(unchanged.reserved, 1);
  await commerce.applySession(session, cms);
  await commerce.applySession(session, cms);
  const settled = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(settled.stock, 1); assert.equal(settled.reserved, 0);
});

test('database constraints reject negative stock and stock below an active reservation', async () => {
  const p = await product(2), key = randomUUID();
  await commerce.createCheckout([{ slug: p.slug, grind: 'Boabe', quantity: 1 }], key, fakeStripe, cms);
  const db = (cms.db as unknown as PostgresAdapter).drizzle;
  await assert.rejects(db.execute(sql`UPDATE products SET stock = -1 WHERE id = ${p.id}`));
  await assert.rejects(db.execute(sql`UPDATE products SET stock = 0 WHERE id = ${p.id}`));
  assert.equal((await cms.findByID({ collection: 'products', id: p.id })).reserved, 1);
});

test('an admin edit waits for the inventory row lock and preserves server reservations', async () => {
  const p = await product(5);
  const adapter = cms.db as unknown as PostgresAdapter;
  const transactionID = await cms.db.beginTransaction();
  assert.ok(transactionID != null);
  await adapter.sessions[String(transactionID)].db.execute(sql`UPDATE products SET reserved = 1 WHERE id = ${p.id}`);
  let completed = false;
  const edit = cms.update({ collection: 'products', id: p.id, data: { price: 59.99, reserved: 0 } }).then(result => {
    completed = true; return result;
  });
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(completed, false);
  await cms.db.commitTransaction(transactionID!);
  await edit;
  const updated = await cms.findByID({ collection: 'products', id: p.id });
  assert.equal(updated.reserved, 1); assert.equal(updated.price, 59.99);
});

test('production requests and payment retries are idempotent without consuming physical inventory',async()=>{
  const {parseProductionRequest,createProductionRequest,generateProductionPayment}=await import('../../src/lib/production-orders');
  const empty=await product(0),available=await product(5), key=randomUUID(), beforeCreates=creates;
  const input=parseProductionRequest({key,name:'Client test',email:'client@example.test',phone:'+40744123456',items:[
    {slug:empty.slug,grind:'Boabe',quantity:2},{slug:available.slug,grind:'Boabe',quantity:1}],note:'Confirmare telefonică'});
  await Promise.all(Array.from({length:5},()=>createProductionRequest(input,cms)));
  const found=await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}},depth:0});
  assert.equal(found.docs.length,1);const order=found.docs[0];assert.equal(order.status,'requested');
  assert.equal(creates,beforeCreates);
  await assert.rejects(createProductionRequest({...input,phone:'+40744999999'},cms));
  await assert.rejects(cms.update({collection:'orders',id:order.id,data:{fulfillmentStatus:'processing'}}));
  await assert.rejects(generateProductionPayment(order.id,{unitPrices:[0,40],shipping:20},fakeStripe,cms));
  await Promise.all(Array.from({length:8},()=>generateProductionPayment(order.id,{unitPrices:[50,40],shipping:20},fakeStripe,cms)));
  assert.equal(creates,beforeCreates+1);
  const pending=await cms.findByID({collection:'orders',id:order.id});assert.equal(pending.totalBani,16000);
  await generateProductionPayment(order.id,{unitPrices:[1,1],shipping:0},fakeStripe,cms);
  assert.equal((await cms.findByID({collection:'orders',id:order.id})).totalBani,16000);
  const session=sessions.get(pending.stripeSessionId!)!;session.status='complete';session.payment_status='paid';
  await assert.rejects(commerce.applySession({...session,amount_total:1},cms));
  await Promise.all(Array.from({length:5},()=>commerce.applySession(session,cms)));
  const paid=await cms.findByID({collection:'orders',id:order.id});assert.equal(paid.status,'paid');assert.equal(paid.customerPhone,input.phone);
  await assert.rejects(generateProductionPayment(order.id,{unitPrices:[50,40],shipping:20},fakeStripe,cms));
  await cms.update({collection:'orders',id:order.id,data:{fulfillmentStatus:'processing'}});
  for(const p of [empty,available]) {
    const unchanged=await cms.findByID({collection:'products',id:p.id});assert.equal(unchanged.stock,p.stock);assert.equal(unchanged.reserved,0);
  }
});

test('production link regeneration ignores old expiration webhooks and recovers lost Stripe responses',async()=>{
  const {parseProductionRequest,createProductionRequest,generateProductionPayment}=await import('../../src/lib/production-orders');
  const p=await product(0),key=randomUUID();
  await createProductionRequest(parseProductionRequest({key,name:'Client test',email:'client@example.test',phone:'+40744123456',items:[{slug:p.slug,grind:'Boabe',quantity:1}]}),cms);
  const order=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}},depth:0})).docs[0];
  let interrupted=true;
  const networkStripe={checkout:{sessions:{...fakeStripe.checkout.sessions,create:async(params:Stripe.Checkout.SessionCreateParams,options:{idempotencyKey:string})=>{
    const result=await fakeStripe.checkout.sessions.create(params,options);if(interrupted){interrupted=false;throw new Error('lost response');}return result;
  }}}} as unknown as Stripe;
  const beforeCreates=creates;
  await assert.rejects(generateProductionPayment(order.id,{unitPrices:[50],shipping:20},networkStripe,cms));
  await generateProductionPayment(order.id,{unitPrices:[1],shipping:0},networkStripe,cms);
  let saved=await cms.findByID({collection:'orders',id:order.id});assert.equal(saved.totalBani,7000);assert.equal(creates,beforeCreates+1);
  const old=sessions.get(saved.stripeSessionId!)!;old.status='expired';await commerce.applySession(old,cms);
  await Promise.all(Array.from({length:5},()=>generateProductionPayment(order.id,{unitPrices:[60],shipping:20},fakeStripe,cms)));
  saved=await cms.findByID({collection:'orders',id:order.id});assert.equal(saved.paymentAttempt,2);assert.equal(creates,beforeCreates+2);
  await commerce.applySession(old,cms);assert.equal((await cms.findByID({collection:'orders',id:order.id})).status,'pending');
});

test('production HTTP requests validate contact data, reject foreign origins, and deduplicate retries',async()=>{
  const {POST}=await import('../../src/app/api/orders/request/route');
  const p=await product(0),input={key:randomUUID(),name:'Client test',email:'client@example.test',phone:'+40744123456',termsAccepted:true,legalVersion:legal.version,items:[{slug:p.slug,grind:'Boabe',quantity:1}]};
  const request=(body:unknown,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/orders/request',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await POST(request(input,'https://foreign.example'))).status,403);
  for(const change of [{termsAccepted:false},{termsAccepted:'true'},{legalVersion:'outdated'},{phone:''},{email:'bad'},{name:'x'},{website:'spam'},{items:[{slug:p.slug,grind:'Boabe',quantity:0}]}])assert.equal((await POST(request({...input,...change}))).status,400);
  for(let i=0;i<2;i++){const response=await POST(request(input));assert.equal(response.status,200);assert.deepEqual(await response.json(),{reference:`MK-${input.key}`});}
  assert.equal((await cms.find({collection:'orders',where:{reference:{equals:`MK-${input.key}`}}})).docs.length,1);
  const saved=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${input.key}`}}})).docs[0];
  assert.equal(saved.legalVersion,legal.version);assert.ok(saved.legalAcceptedAt);
});

test('stock checkout rejects missing legal acknowledgement before reserving stock or contacting Stripe',async()=>{
  const {POST}=await import('../../src/app/api/checkout/route');
  const p=await product(3);const input={key:randomUUID(),items:[{slug:p.slug,grind:'Boabe',quantity:1}]};
  for(const extra of [{},{termsAccepted:false,legalVersion:legal.version},{termsAccepted:true,legalVersion:'outdated'}]){
    const response=await POST(new Request('http://localhost:3000/api/checkout',{method:'POST',headers:{origin:'http://localhost:3000','Content-Type':'application/json'},body:JSON.stringify({...input,...extra})}));
    assert.equal(response.status,400);
  }
  assert.equal((await cms.findByID({collection:'products',id:p.id})).reserved,0);
  const key=randomUUID();await commerce.createCheckout(input.items,key,fakeStripe,cms,legal.version);
  const first=(await cms.find({collection:'orders',where:{reference:{equals:`MK-${key}`}}})).docs[0];
  await commerce.createCheckout(input.items,key,fakeStripe,cms,legal.version);
  const second=await cms.findByID({collection:'orders',id:first.id});
  assert.equal(first.legalVersion,legal.version);assert.ok(first.legalAcceptedAt);
  assert.equal(second.legalAcceptedAt,first.legalAcceptedAt);
  await assert.rejects(commerce.createCheckout(input.items,key,fakeStripe,cms,'new-version'));
});

test('production payment-link endpoint requires an authenticated administrator',async()=>{
  const {POST}=await import('../../src/app/api/orders/payment-link/route');
  const response=await POST(new Request('http://localhost:3000/api/orders/payment-link',{method:'POST',headers:{origin:'http://localhost:3000','Content-Type':'application/json'},body:JSON.stringify({orderID:1,unitPrices:[0.01],shipping:0})}));
  assert.equal(response.status,401);
});
