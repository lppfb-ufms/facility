import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { auth, invalidateUserSessions } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function action({ request }: Route.ActionArgs) {
  const { user, session } = await auth(request);

  if (!session) {
    return redirect("/login", {
      headers: {
        "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }),
      },
    });
  }

  await invalidateUserSessions(user.id);
  await db.delete(userTable).where(eq(userTable.id, user.id));

  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }),
    },
  });
}
