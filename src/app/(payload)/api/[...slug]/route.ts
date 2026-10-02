import config from "@payload-config";
import {
  REST_GET,
  REST_POST,
  REST_DELETE,
  REST_PATCH,
  REST_PUT,
  REST_OPTIONS,
} from "@payloadcms/next/routes";
import { cmsConfigured } from "@/lib/commerce-env";

export const runtime = "nodejs";
const protect =
  (handler: ReturnType<typeof REST_GET>) =>
  async (...args: Parameters<typeof handler>) => {
    if (!cmsConfigured())
      return Response.json(
        { error: "Administrarea nu este încă configurată." },
        { status: 503 },
      );
    if (new URL(args[0].url).pathname.endsWith("/first-register"))
      return Response.json(
        {
          error:
            "Folosește scriptul de inițializare pentru primul administrator.",
        },
        { status: 403 },
      );
    return handler(...args);
  };
export const GET = protect(REST_GET(config));
export const POST = protect(REST_POST(config));
export const DELETE = protect(REST_DELETE(config));
export const PATCH = protect(REST_PATCH(config));
export const PUT = protect(REST_PUT(config));
export const OPTIONS = protect(REST_OPTIONS(config));
