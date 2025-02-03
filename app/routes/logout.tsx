import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { lucia } from "~/.server/auth";

export async function action({ request }: ActionFunctionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const sessionId = lucia.readSessionCookie(cookieHeader ?? "");
  if (!sessionId) {
    return redirect("/login");
  }

  await lucia.invalidateSession(sessionId);
  const sessionCookie = lucia.createBlankSessionCookie();
  return redirect("/login", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}
