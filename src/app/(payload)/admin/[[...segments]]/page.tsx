import config from "@payload-config";
import { RootPage, generatePageMetadata } from "@payloadcms/next/views";
import { importMap } from "../importMap";
import { cmsConfigured } from "@/lib/commerce-env";

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] }>;
};
export const generateMetadata = (args: Args) =>
  cmsConfigured()
    ? generatePageMetadata({ config, ...args })
    : Promise.resolve({ title: "Configurare — Makeon Admin" });
export default function Page(args: Args) {
  if (!cmsConfigured())
    return (
      <main
        style={{
          maxWidth: 640,
          margin: "80px auto",
          padding: 24,
          fontFamily: "sans-serif",
        }}
      >
        <h1>Makeon Admin</h1>
        <p>
          Dashboardul este pregătit. Conectează Neon și configurează
          PAYLOAD_SECRET pentru a-l activa.
        </p>
        <p>
          Instrucțiunile tehnice sunt în docs/commerce-development.md. Catalogul de prezentare
          rămâne disponibil.
        </p>
        <a href="/">Înapoi la site</a>
      </main>
    );
  return RootPage({ config, ...args, importMap });
}
