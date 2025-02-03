import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { auth, lucia } from "~/.server/auth";
import { db } from "~/db/connection.server";
import { glossarioTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function action({ params, request }: Route.ActionArgs) {
  const { session, user } = await auth(request);

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    return redirect("/login", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  if (session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    return redirect(request.url, {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
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

  const item = await db.query.glossarioTable.findFirst({
    where: eq(glossarioTable.id, Number(id)),
  });

  if (!item) {
    return { message: "Item não encontrado", ok: false };
  }

  await db.delete(glossarioTable).where(eq(glossarioTable.id, item.id));

  return redirect("/admin/glossario");
}

export async function loader() {
  return redirect("/");
}
