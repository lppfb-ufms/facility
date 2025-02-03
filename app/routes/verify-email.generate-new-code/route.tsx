import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { auth, generateEmailVerificationCode, lucia } from "~/.server/auth";
import { transporter } from "~/.server/email";
import { db } from "~/db/connection.server";
import { emailVerificationCodeTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function action({ request }: Route.ActionArgs) {
  const { user, session } = await auth(request);

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    return redirect("/login", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  if (user.emailVerified) {
    return null;
  }

  const [lastCode] = await db
    .select({ expiresAt: emailVerificationCodeTable.expiresAt })
    .from(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.userId, user.id))
    .orderBy(emailVerificationCodeTable.expiresAt)
    .limit(1);

  if (lastCode && lastCode.expiresAt.getTime() - 13 * 60 * 1000 > Date.now()) {
    return null;
  }
  const code = await generateEmailVerificationCode(user.id, user.email);

  transporter.sendMail({
    to: user.email,
    subject: "Verificação de email",
    text: `Seu código de verificação é: ${code}. Válido por 15 minutos.`,
  });

  return null;
}

export async function loader() {
  return redirect("/");
}
