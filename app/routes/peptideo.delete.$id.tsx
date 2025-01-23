import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { auth, lucia } from "~/.server/auth";
import { db } from "~/.server/db/connection";
import { peptideoTable } from "~/.server/db/schema";

export async function action({ params, request }: ActionFunctionArgs) {
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

  const item = await db.query.peptideoTable.findFirst({
    where: eq(peptideoTable.id, Number(id)),
  });

  if (!item) {
    return { message: "Peptídeo não encontrado", ok: false };
  }

  await db.delete(peptideoTable).where(eq(peptideoTable.id, item.id));

  return redirect("/admin/listar");
}

export async function loader() {
  return redirect("/");
}
