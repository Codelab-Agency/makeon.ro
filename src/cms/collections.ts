import type { CollectionConfig, Field } from "payload";
import { sql, type PostgresAdapter } from "@payloadcms/db-postgres";
import { adminOnly, nobody } from "./access";

const protectedAccess = {
  create: adminOnly,
  read: adminOnly,
  update: adminOnly,
  delete: adminOnly,
};
const integer = (value: number | null | undefined) =>
  value == null || Number.isSafeInteger(value) || "Introdu un număr întreg.";

export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Administrator", plural: "Administratori" },
  auth: { maxLoginAttempts: 5, lockTime: 600000 },
  access: protectedAccess,
  admin: { useAsTitle: "email", group: "Administrare" },
  fields: [{ name: "name", type: "text", label: "Nume" }],
  hooks: {
    beforeOperation: [
      ({ operation, req }) => {
        if (operation === "create" && !req.user && !req.context.bootstrap)
          throw new Error(
            "Inițializează administratorul din scriptul securizat.",
          );
      },
    ],
  },
};

/** Public image metadata with admin-only uploads; binary files are stored in R2. */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Imagine", plural: "Imagini" },
  access: { ...protectedAccess, read: () => true },
  admin: { group: "Magazin", useAsTitle: "alt" },
  upload: {
    disableLocalStorage: true,
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    imageSizes: [{ name: "card", width: 800, height: 1000, fit: "inside" }],
    adminThumbnail: "card",
  },
  fields: [
    { name: "alt", label: "Descriere imagine", type: "text", required: true },
  ],
  hooks: {
    beforeOperation: [
      ({ operation, req }) => {
        if (
          (operation === "create" || operation === "update") &&
          req.file &&
          ![
            "R2_ENDPOINT",
            "R2_BUCKET",
            "R2_ACCESS_KEY_ID",
            "R2_SECRET_ACCESS_KEY",
            "R2_PUBLIC_URL",
          ].every((key) => Boolean(process.env[key]))
        )
          throw new Error(
            "Configurează Cloudflare R2 înainte de a încărca imagini.",
          );
      },
    ],
  },
};

/** Deactivate products instead of deleting them to preserve historical order relationships. */
export const Products: CollectionConfig = {
  slug: "products",
  labels: { singular: "Produs", plural: "Produse" },
  access: { ...protectedAccess, delete: nobody },
  admin: {
    useAsTitle: "name",
    group: "Magazin",
    defaultColumns: ["name", "category", "price", "stock", "active"],
  },
  fields: [
    { name: "name", label: "Nume", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      validate: (value: string | null | undefined) =>
        !value ||
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ||
        "Folosește litere mici, cifre și cratime.",
    },
    {
      name: "active",
      label: "Vizibil în magazin",
      type: "checkbox",
      defaultValue: true,
    },
    {
      name: "category",
      label: "Categorie",
      type: "select",
      required: true,
      options: [
        { label: "Boabe", value: "boabe" },
        { label: "Măcinată", value: "macinata" },
        { label: "Solubilă", value: "solubila" },
        { label: "Alternative", value: "alternative" },
      ],
    },
    { name: "collection", label: "Colecție", type: "text", required: true },
    {
      name: "grams",
      label: "Gramaj",
      type: "number",
      required: true,
      min: 1,
      validate: integer,
    },
    {
      name: "price",
      label: "Preț în RON (TVA inclus)",
      type: "number",
      min: 0.01,
      admin: {
        description:
          "Lăsat gol: preț la cerere. Plata se activează doar cu preț și stoc disponibile.",
        components: { Cell: "/components/admin/list-layout#ProductPriceCell" },
      },
      validate: (value: number | null | undefined) =>
        value == null ||
        Math.abs(value * 100 - Math.round(value * 100)) < 0.00001 ||
        "Maximum două zecimale.",
    },
    {
      name: "stock",
      label: "Stoc fizic (ambalaje)",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0,
      validate: integer,
    },
    {
      name: "reserved",
      label: "Rezervat pentru plăți în curs",
      type: "number",
      required: true,
      min: 0,
      defaultValue: 0,
      access: { create: () => false, update: () => false },
      admin: { readOnly: true },
    },
    {
      name: "image",
      label: "Imagine produs",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "description",
      label: "Descriere",
      type: "textarea",
      required: true,
    },
    {
      name: "notes",
      label: "Note de degustare",
      type: "array",
      fields: [{ name: "note", type: "text", required: true }],
    },
    {
      name: "color",
      label: "Culoare ambalaj ilustrat",
      type: "text",
      defaultValue: "#b5934a",
      validate: (value: string | null | undefined) =>
        !value ||
        /^#[0-9a-f]{6}$/i.test(value) ||
        "Folosește formatul #aabbcc.",
    },
    ...Object.entries({
      origin: "Origine",
      altitude: "Altitudine",
      variety: "Varietate",
      processing: "Procesare",
      roast: "Prăjire",
    }).map(([name, label]) => ({ name, label, type: "text" as const })),
  ],
  hooks: {
    beforeOperation: [
      async ({ operation, args, req }) => {
        if (operation !== "update") return;
        // Payload can rewrite a whole product document. Lock before it reads the
        // original row, so admin edits cannot restore an old reserved/stock value
        // while a checkout or payment is updating inventory.
        if (!("id" in args) || args.id == null)
          throw new Error(
            "Editează produsele individual pentru a proteja stocul.",
          );
        const transactionID = await req.transactionID;
        if (transactionID == null)
          throw new Error("Actualizarea produselor necesită o tranzacție.");
        const adapter = req.payload.db as unknown as PostgresAdapter;
        await adapter.sessions[String(transactionID)].db.execute(
          sql`SELECT id FROM products WHERE id = ${Number(args.id)} FOR UPDATE`,
        );
        if (args.data && typeof args.data === "object")
          delete args.data.reserved;
      },
    ],
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (data?.stock != null && data.stock < (originalDoc?.reserved ?? 0))
          throw new Error(
            "Stocul nu poate fi mai mic decât cantitatea rezervată.",
          );
        return data;
      },
    ],
  },
};

export const Orders: CollectionConfig = {
  slug: "orders",
  labels: { singular: "Comandă", plural: "Comenzi" },
  access: {
    read: adminOnly,
    create: nobody,
    update: adminOnly,
    delete: nobody,
  },
  admin: {
    useAsTitle: "id",
    hideAPIURL: true,
    group: "Magazin",
    defaultColumns: [
      "id",
      "fulfillmentStatus",
      "status",
      "customerEmail",
      "createdAt",
    ],
  },
  hooks: {
    beforeOperation: [
      async ({ operation, args, req }) => {
        if (operation !== "update") return;
        if (!("id" in args) || args.id == null)
          throw new Error("Editează comenzile individual.");
        const transactionID = await req.transactionID;
        if (transactionID == null)
          throw new Error("Actualizarea comenzii necesită o tranzacție.");
        const adapter = req.payload.db as unknown as PostgresAdapter;
        // Use the same lock as checkout/webhooks before Payload reads the original
        // document, so an admin save cannot restore stale payment data.
        await adapter.sessions[String(transactionID)].db.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(reference)) FROM orders WHERE id = ${Number(args.id)}`,
        );
      },
    ],
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (
          originalDoc?.orderType === "production" &&
          data?.fulfillmentStatus &&
          data.fulfillmentStatus !== "new" &&
          originalDoc.status !== "paid"
        ) {
          throw new Error(
            "Comanda la cerere poate fi pregătită numai după confirmarea plății.",
          );
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "orderType",
      label: "Tip comandă",
      type: "select",
      defaultValue: "stock",
      options: [
        { value: "stock", label: "Din stoc" },
        { value: "production", label: "La cerere / producție" },
      ],
    },
    { name: "requestFingerprint", type: "text" },
    { name: "customerNote", label: "Mesaj client", type: "textarea" },
    { name: "paymentAttempt", type: "number", defaultValue: 0 },
    { name: "paymentUrl", type: "text" },
    {
      name: "reference",
      label: "Referință",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "status",
      label: "Status plată",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { value: "requested", label: "De confirmat telefonic" },
        { value: "pending", label: "În așteptarea plății" },
        { value: "paid", label: "Plătită" },
        { value: "expired", label: "Expirată" },
        { value: "failed", label: "Eșuată" },
      ],
    },
    { name: "stripeSessionId", type: "text", unique: true, index: true },
    { name: "paymentIntentId", type: "text" },
    { name: "expiresAt", type: "date" },
    { name: "customerEmail", label: "Email client", type: "email" },
    { name: "customerName", label: "Nume client", type: "text" },
    { name: "customerPhone", label: "Telefon", type: "text" },
    { name: "shippingAddress", label: "Adresă de livrare", type: "json" },
    { name: "currency", type: "text", required: true, defaultValue: "ron" },
    {
      name: "totalBani",
      label: "Total (RON)",
      type: "number",
      required: true,
      admin: {
        components: { Cell: "/components/admin/list-layout#OrderAmountCell" },
      },
    },
    {
      name: "shippingBani",
      label: "Transport (RON)",
      type: "number",
      required: true,
      admin: {
        components: { Cell: "/components/admin/list-layout#OrderAmountCell" },
      },
    },
    {
      name: "items",
      label: "Produse comandate",
      type: "array",
      required: true,
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        { name: "slug", type: "text", required: true },
        { name: "name", label: "Denumire", type: "text", required: true },
        {
          name: "grind",
          label: "Format / măcinare",
          type: "text",
          required: true,
        },
        {
          name: "quantity",
          label: "Cantitate",
          type: "number",
          required: true,
        },
        {
          name: "unitPriceBani",
          label: "Preț unitar (bani)",
          type: "number",
          required: true,
        },
      ],
    },
  ],
};

// Fulfillment is the only editable order state in the admin. Payment status,
// customer details, items and amounts belong to the server-side Stripe snapshot.
// Field access enforces this for API requests; hiding inputs alone is insufficient.
Orders.fields = [
  {
    name: "fulfillmentStatus",
    label: "Status comandă",
    type: "select",
    required: true,
    defaultValue: "new",
    admin: {
      description:
        "Alege etapa comenzii și apasă Salvează. Statusul plății este actualizat automat.",
    },
    options: [
      { value: "new", label: "Nouă" },
      { value: "processing", label: "În pregătire" },
      { value: "shipped", label: "Expediată" },
      { value: "delivered", label: "Livrată" },
    ],
  },
  {
    name: "orderSummary",
    type: "ui",
    admin: {
      components: { Field: "/components/admin/order-summary#OrderSummary" },
    },
  },
  ...Orders.fields.map(
    (field): Field =>
      ({
        ...field,
        access: { update: () => false },
        admin: { ...field.admin, hidden: true, readOnly: true },
      }) as Field,
  ),
];

// Unnamed rows organize the form without changing field paths or the database.
for (const collection of [Products, Orders, Media, Users]) {
  collection.admin = {
    ...collection.admin,
    hideAPIURL: true,
    components: {
      ...collection.admin?.components,
      beforeListTable: ["/components/admin/list-layout#ResponsiveList"],
    },
  };
}
const pairedFields = [
  ["name", "slug"],
  ["category", "collection"],
  ["grams", "price"],
  ["stock", "reserved"],
  ["origin", "altitude"],
  ["variety", "processing"],
];
const originalProductFields = Products.fields;
Products.fields = originalProductFields.flatMap((field): Field[] => {
  if (!("name" in field)) return [field];
  const pair = pairedFields.find((names) => names.includes(field.name));
  if (!pair) return [field];
  if (field.name !== pair[0]) return [];
  return [
    {
      type: "row",
      fields: pair.map((name) => {
        const paired = originalProductFields.find(
          (f) => "name" in f && f.name === name,
        )!;
        return { ...paired, admin: { ...paired.admin, width: "50%" } } as Field;
      }),
    },
  ];
});
