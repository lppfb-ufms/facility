import { eq } from "drizzle-orm";
import { type ActionFunctionArgs, redirect } from "react-router";
import { auth, lucia } from "~/.server/auth";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";

export async function action({ request }: ActionFunctionArgs) {
  const { user, session } = await auth(request);

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    return redirect("/login", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  await lucia.invalidateUserSessions(user.id);
  await db.delete(userTable).where(eq(userTable.id, user.id));

  const sessionCookie = lucia.createBlankSessionCookie();
  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}
