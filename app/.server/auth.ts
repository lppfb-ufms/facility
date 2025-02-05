import { eq } from "drizzle-orm";
import { db } from "~/db/connection.server";
import {
  type Session,
  type User,
  passwordResetTokenTable,
  sessionTable,
  userTable,
} from "~/db/schema";
import { sessionCookie } from "./cookie";

export function generateSessionToken(): string {
  return Bun.randomUUIDv7();
}

export async function createSession(
  token: string,
  userId: string,
): Promise<Session> {
  const [session] = await db
    .insert(sessionTable)
    .values({
      id: new Bun.CryptoHasher("sha256").update(token).digest("hex"),
      userId,
    })
    .returning();

  return session;
}

export async function validateSession(
  token: string,
): Promise<
  | { session: Session & { fresh: boolean }; user: User }
  | { session: null; user: null }
> {
  const sessionId = new Bun.CryptoHasher("sha256").update(token).digest("hex");

  const result = await db
    .select({ user: userTable, session: sessionTable })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(eq(sessionTable.id, sessionId));

  if (result.length < 1) {
    return { session: null, user: null };
  }
  const { user, session } = result[0];
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
    return { session: null, user: null };
  }

  let fresh = false;
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 7) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    await db
      .update(sessionTable)
      .set({
        expiresAt: session.expiresAt,
      })
      .where(eq(sessionTable.id, session.id));
    fresh = true;
  }

  return { session: { ...session, fresh }, user };
}

export async function invalidateSession(token: string): Promise<void> {
  const sessionId = new Bun.CryptoHasher("sha256").update(token).digest("hex");

  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}

export async function auth(request: Request) {
  if (request.method !== "GET") {
    // CSRF protection
    const originHeader = request.headers.get("Origin");
    const hostHeader =
      request.headers.get("Host") ?? request.headers.get("X-Forwarded-Host");
    if (!verifyRequestOrigin(originHeader, hostHeader)) {
      return { user: null, session: null };
    }
  }

  const cookieHeader = request.headers.get("Cookie");
  const sessionId = await sessionCookie.parse(cookieHeader);
  if (!sessionId) {
    return { user: null, session: null };
  }

  return await validateSession(sessionId);
}

function verifyRequestOrigin(origin: string | null, host: string | null) {
  if (!origin || !host) {
    return false;
  }
  const originHost = new URL(origin).host;
  const hostUrl =
    host.startsWith("http://") || host.startsWith("https://")
      ? new URL(host)
      : new URL(`https://${host}`);
  if (originHost === hostUrl.host) {
    return true;
  }
  return false;
}

export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  await db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, userId));
  const tokenId = Bun.randomUUIDv7("base64url"); // 40 character
  await db.insert(passwordResetTokenTable).values({
    tokenHash: new Bun.CryptoHasher("sha256").update(tokenId).digest("hex"),
    userId,
  });
  return tokenId;
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<string | null> {
  const tokenHash = new Bun.CryptoHasher("sha256").update(token).digest("hex");
  const results = await db
    .select({
      userId: passwordResetTokenTable.userId,
      expiresAt: passwordResetTokenTable.expiresAt,
    })
    .from(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.tokenHash, tokenHash));
  if (results.length < 1) {
    return null;
  }

  const [{ userId, expiresAt }] = results;
  if (!userId || expiresAt < new Date()) {
    return null;
  }
  return userId;
}
