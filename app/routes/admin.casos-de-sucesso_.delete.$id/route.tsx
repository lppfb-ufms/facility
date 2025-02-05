import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { auth } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { db } from "~/db/connection.server";
import { casoSucessoTable } from "~/db/schema";
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
  if (!id) {
    return { message: "Id inválido", ok: false };
  }

  const item = await db.query.casoSucessoTable.findFirst({
    where: eq(casoSucessoTable.id, Number(id)),
  });

  if (!item) {
    return { message: "Item não encontrado", ok: false };
  }

  await db.delete(casoSucessoTable).where(eq(casoSucessoTable.id, item.id));

  return redirect("/admin/casos-de-sucesso");
}
