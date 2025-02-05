import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { createTransport } from "nodemailer";
import { db } from "~/db/connection.server";
import { type User, emailVerificationCodeTable } from "~/db/schema";

const transporter = createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("email successfully connected");
  }
});

export { transporter };

export async function generateEmailVerificationCode(
  userId: number,
  email: string,
): Promise<string> {
  await db
    .delete(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.userId, userId));

  const alphabet = "ABCDEFGHIJKMNOPQRSTUVWXYZ1234567890";
  const codeLength = 6;
  const code = crypto.randomBytes(codeLength).reduce((prev, value) => {
    return prev + alphabet[value % alphabet.length];
  }, "");

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
