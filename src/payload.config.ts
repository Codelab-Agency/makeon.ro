import path from "node:path";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import sharp from "sharp";
import { ro } from "@payloadcms/translations/languages/ro";
import { Users, Media, Products, Orders } from "./cms/collections";

const r2Ready = [
  "R2_ENDPOINT",
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_URL",
].every((key) => Boolean(process.env[key]));
const adminOrigins = [
  process.env.APP_URL || "http://localhost:3000",
  ...(process.env.ADMIN_ALLOWED_ORIGINS || "").split(","),
]
  .filter(Boolean)
  .map((value) => new URL(value.trim()).origin);

export default buildConfig({
  i18n: { supportedLanguages: { ro }, fallbackLanguage: "ro" },
  admin: {
    user: "users",
    meta: {
      titleSuffix: "— Makeon",
      icons: [{ rel: "icon", url: "/images/makeon-logo.svg" }],
    },
    components: {
      graphics: {
        Logo: "/components/admin/brand#AdminLogo",
        Icon: "/components/admin/brand#AdminIcon",
      },
      beforeDashboard: ["/components/admin/brand#AdminWelcome"],
    },
    importMap: { baseDir: path.resolve(process.cwd(), "src") },
  },
  collections: [Users, Media, Products, Orders],
  secret:
    process.env.PAYLOAD_SECRET || "unconfigured-build-only-no-runtime-access",
  // Keep admin API requests on the origin where the admin is open; APP_URL is
  // the canonical storefront/Stripe URL, not a cross-origin admin API host.
  serverURL: "",
  csrf: adminOrigins,
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://localhost/makeon_unconfigured",
      max: 10,
      connectionTimeoutMillis: 10000,
    },
    // Schema push can remove custom SQL constraints. Opt in only for disposable
    // development databases; shared databases always use reviewed migrations.
    push:
      process.env.NODE_ENV !== "production" &&
      process.env.PAYLOAD_DB_PUSH === "true",
    migrationDir: path.resolve(process.cwd(), "src/migrations"),
  }),
  sharp,
  upload: { limits: { fileSize: 3 * 1024 * 1024 } },
  plugins: [
    s3Storage({
      enabled: r2Ready,
      // Keep the schema stable when R2 credentials are absent during builds.
      alwaysInsertFields: true,
      bucket: process.env.R2_BUCKET || "makeon-unconfigured",
      collections: {
        media: {
          disablePayloadAccessControl: true,
          // Browsers use the public media domain, not the authenticated S3 endpoint.
          generateFileURL: ({ filename }) =>
            `${process.env.R2_PUBLIC_URL!.replace(/\/$/, "")}/${encodeURIComponent(filename)}`,
        },
      },
      config: {
        endpoint: process.env.R2_ENDPOINT,
        region: "auto",
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(process.cwd(), "src/payload-types.ts"),
  },
});
