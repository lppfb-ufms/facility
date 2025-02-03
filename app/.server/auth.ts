import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { eq } from "drizzle-orm";
import {
  Lucia,
  TimeSpan,
  type User,
  generateIdFromEntropySize,
  verifyRequestOrigin,
} from "lucia";
import { alphabet, generateRandomString, sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import { db } from "~/db/connection.server";
import {
  emailVerificationCodeTable,
  passwordResetTokenTable,
  sessionTable,
  userTable,
} from "~/db/schema";

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);

export const lucia = new Lucia(adapter, {
  sessionExpiresIn: new TimeSpan(2, "w"),
  getUserAttributes: (attributes) => ({
    email: attributes.email,
    emailVerified: attributes.emailVerified,
    displayName: attributes.displayName,
    createdAt: attributes.createdAt,
    isAdmin: attributes.isAdmin,
  }),
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      emailVerified: boolean;
      displayName: string;
      createdAt: Date;
      isAdmin: boolean;
    };
  }
}

export async function generateEmailVerificationCode(
  userId: string,
  email: string,
): Promise<string> {
  await db
    .delete(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.userId, userId));
  const code = generateRandomString(6, alphabet("0-9", "a-z"));
  await db.insert(emailVerificationCodeTable).values({
    userId,
    email,
    code,
  });
  return code;
}

export async function verifyVerificationCode(
  user: User,
  code: string,
): Promise<boolean> {
  const [databaseCode] = await db
    .select({
      code: emailVerificationCodeTable.code,
      expiresAt: emailVerificationCodeTable.expiresAt,
      email: emailVerificationCodeTable.email,
    })
    .from(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.userId, user.id))
    .limit(1);
  if (!databaseCode || databaseCode.code !== code) {
    return false;
  }

  await db
    .delete(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.userId, user.id));

  if (
    databaseCode.expiresAt < new Date() ||
    databaseCode.email !== user.email
  ) {
    return false;
  }
  return true;
}

export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  await db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, userId));
  const tokenId = generateIdFromEntropySize(25); // 40 character
  const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));
  await db.insert(passwordResetTokenTable).values({
    tokenHash,
    userId,
  });
  return tokenId;
}

export async function auth(request: Request) {
  if (request.method !== "GET") {
    // CSRF protection
    const originHeader = request.headers.get("Origin");
    const hostHeader =
      request.headers.get("Host") ?? request.headers.get("X-Forwarded-Host");
    if (
      !originHeader ||
      !hostHeader ||
      !verifyRequestOrigin(originHeader, [hostHeader])
    ) {
      return { user: null, session: null };
    }
  }

  const cookieHeader = request.headers.get("Cookie");
  const sessionId = lucia.readSessionCookie(cookieHeader ?? "");
  if (!sessionId) {
    return { user: null, session: null };
  }

  return await lucia.validateSession(sessionId);
}
