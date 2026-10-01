import { Response } from "supertest";

export function extractCookie(res: Response): string {
  const cookies = res.headers["set-cookie"];
  if (!cookies) return "";
  const list = Array.isArray(cookies) ? cookies : [cookies];
  return list.map((c) => c.split(";")[0]).join("; ");
}
