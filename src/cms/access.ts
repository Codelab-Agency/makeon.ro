import type { Access } from "payload";

// Every account in this collection is an administrator. Public registration is disabled.
export const adminOnly: Access = ({ req }) =>
  Boolean(req.user?.collection === "users");
export const nobody: Access = () => false;
