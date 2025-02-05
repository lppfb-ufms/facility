import type { Route } from "./+types/route";

import { redirect } from "react-router";
import { sessionCookie } from "~/.server/cookie";

export async function action({ request }: Route.ActionArgs) {
  const cookieHeader = request.headers.get("Cookie");
  const sessionId = await sessionCookie.parse(cookieHeader);

  if (!sessionId) {
    return redirect("/");
  }

  return redirect("/login", {
    headers: {
      "Set-Cookie": await sessionCookie.serialize("", { maxAge: 0 }),
    },
  });
}
