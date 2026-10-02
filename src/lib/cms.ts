import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { requireCMS } from "./commerce-env";

export async function getCMS() {
  requireCMS();
  return getPayload({ config });
}
