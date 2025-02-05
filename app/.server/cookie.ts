import crypto from "node:crypto";
import { createCookie } from "react-router";

export const sessionCookie = createCookie("session", {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
  maxAge: 60 * 60 * 24 * 14,

  secrets: [
    process.env.SESSION_COOKIE_SECRET ?? crypto.randomBytes(20).toString("hex"),
  ],
  secure: process.env.NODE_ENV === "production",
});
