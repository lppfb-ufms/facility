import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { auth } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function action({ params, request }: Route.ActionArgs) {
  const { session, user } = await auth(request);

  if (!session) {
    return redirect("/login", {
      headers: {
        "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }),
      },
    });
  }

  if (session.fresh) {
    const sessionToken = await sessionCookie.parse(
      request.headers.get("cookie"),
    );
    return redirect(request.url, {
      headers: {
        "Set-Cookie": await sessionCookie.serialize(sessionToken),
      },
    });
  }

  if (!user.isAdmin || !user.emailVerified) {
    return redirect("/");
  }

  const id = params.id;
  if (!id || Number.isNaN(Number(id))) {
    return { message: "Id inválido", ok: false };
  }

  if (user.id === Number(id)) {
    return { message: "Operação inválida", ok: false };
  }

  const item = await db.query.userTable.findFirst({
    where: eq(userTable.id, Number(id)),
  });

  if (!item) {
    return { message: "Usuário não encontrado", ok: false };
  }

  await db.delete(userTable).where(eq(userTable.id, item.id));

  return redirect("/admin/usuarios");
}
