import config from "@payload-config";
import "@payloadcms/next/css";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import "./admin.css";
import { RootLayout, handleServerFunctions } from "@payloadcms/next/layouts";
import type { ServerFunctionClient } from "payload";
import { importMap } from "./admin/importMap";
import { cmsConfigured, requireCMS } from "@/lib/commerce-env";

export const dynamic = "force-dynamic";
const serverFunction: ServerFunctionClient = async (args) => {
  "use server";
  requireCMS();
  return handleServerFunctions({ ...args, config, importMap });
};

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!cmsConfigured())
    return (
      <html lang="ro">
        <body>{children}</body>
      </html>
    );
  return (
    <RootLayout
      config={config}
      importMap={importMap}
      serverFunction={serverFunction}
    >
      {children}
    </RootLayout>
  );
}
