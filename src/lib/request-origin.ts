/** Accept only this server's origin or explicitly configured canonical/admin origins. */
export function allowedRequestOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configured = [
    new URL(request.url).origin,
    process.env.APP_URL,
    ...(process.env.ADMIN_ALLOWED_ORIGINS || "").split(","),
  ];
  return configured.some((value) => {
    if (!value?.trim()) return false;
    try {
      return new URL(value.trim()).origin === origin;
    } catch {
      return false;
    }
  });
}
