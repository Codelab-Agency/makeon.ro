import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { requireCMS } from "./commerce-env";

/** Server-only Payload entry point; fail early when database credentials are absent. */
export async function getCMS() {
  requireCMS();
  return getPayload({ config });
}
