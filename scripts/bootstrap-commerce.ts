import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) throw new Error('Completează DATABASE_URL și PAYLOAD_SECRET.');
  const { getPayload } = await import('payload');
  const { default: config } = await import('../src/payload.config');
  const { coffeeProducts } = await import('../src/lib/coffee-catalog');
  const cms = await getPayload({ config });
  const users = await cms.find({ collection: 'users', limit: 1 });
  if (!users.docs.length) {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 16)
      throw new Error('Setează ADMIN_EMAIL și ADMIN_PASSWORD (minimum 16 caractere) pentru primul administrator.');
    await cms.create({ collection: 'users', context: { bootstrap: true }, data: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD, name: 'Makeon Admin' } });
    console.log('Administrator creat. Elimină ADMIN_PASSWORD din mediu după inițializare.');
  }
  let added = 0;
  for (const product of coffeeProducts) {
    const existing = await cms.find({ collection: 'products', where: { slug: { equals: product.slug } }, limit: 1 });
    if (existing.docs.length) continue;
    const { source, notes, ...data } = product;
    await cms.create({ collection: 'products', data: { ...data, active: true, stock: 0, reserved: 0, notes: notes.map(note => ({ note })) } });
    added++;
  }
  console.log(`Catalog importat: ${added} produse noi. Produsele existente nu au fost suprascrise.`);
  await cms.destroy();
}
main().then(() => process.exit(0)).catch(error => { console.error(error instanceof Error ? error.message : 'Inițializare eșuată.'); process.exit(1); });
