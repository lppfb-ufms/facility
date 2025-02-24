import { eq } from "drizzle-orm";
import { TbShieldMinus, TbShieldPlus, TbTrash } from "react-icons/tb";
import type { Route } from "./+types/route";

import { Form, redirect, useFetcher } from "react-router";
import { auth } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";

export async function loader({ request }: Route.LoaderArgs) {
  const { user } = await auth(request);

  if (!user) {
    return redirect("/");
  }

  const users = await db
    .select({
      id: userTable.id,
      displayName: userTable.displayName,
      email: userTable.email,
      emailVerified: userTable.emailVerified,
      createdAt: userTable.createdAt,
      isAdmin: userTable.isAdmin,
    })
    .from(userTable);

  return { users, user };
}

export async function action({ request }: Route.ActionArgs) {
  const { user, session } = await auth(request);

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

  const formData = await request.formData();

  const id = formData.get("id");
  const isAdmin = formData.get("isAdmin");

  if (!id || typeof id !== "string" || !isAdmin || user.id === id) {
    return null;
  }

  await db
    .update(userTable)
    .set({ isAdmin: isAdmin === "true" })
    .where(eq(userTable.id, id));
  return null;
}

export default function Usuarios({ loaderData }: Route.ComponentProps) {
  const { users, user } = loaderData;

  const fetcher = useFetcher();

  return (
    <>
      <h1 className="mb-4 text-center text-xl font-bold text-cyan-600">
        Usuários
      </h1>
      <ul className="flex flex-col gap-8">
        {users.map(
          ({ id, displayName, email, emailVerified, createdAt, isAdmin }) => (
            <li key={id} className="rounded-lg bg-neutral-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-cyan-600">
                    {displayName} {user.id === id ? "(você)" : null}
                  </p>
                  <p className="text-sm">
                    <span className="text-cyan-600">Email: </span>
                    <span className="text-neutral-700 italic">{email}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-cyan-600">Conta criada em: </span>
                    <span className="text-neutral-700 italic">
                      {Intl.DateTimeFormat("pt-BR", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                      }).format(new Date(createdAt))}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-cyan-600">Email verificado: </span>
                    <span className="text-neutral-700 italic">
                      {emailVerified ? "sim" : "não"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-cyan-600">Administrador: </span>
                    <span className="text-neutral-700 italic">
                      {isAdmin ? "sim" : "não"}
                    </span>
                  </p>
                </div>
                {user.id !== id && (
                  <div className="flex gap-6">
                    {isAdmin ? (
                      <button
                        type="button"
                        className="flex w-min items-center gap-2 rounded-2xl bg-gradient-to-r from-neutral-600 to-neutral-700 py-1 pr-4 pl-2 text-center text-sm font-bold text-white"
                        onClick={() =>
                          fetcher.submit(
                            {
                              id,
                              isAdmin: false,
                            },
                            {
                              method: "post",
                            },
                          )
                        }
                      >
                        <TbShieldMinus size="2.5rem" /> Remover Permissões
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="flex w-min items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 py-1 pr-4 pl-2 text-center text-sm font-bold text-white"
                        onClick={() =>
                          fetcher.submit(
                            {
                              id,
                              isAdmin: true,
                            },
                            {
                              method: "post",
                            },
                          )
                        }
                      >
                        <TbShieldPlus size="2.5rem" /> Tornar Administrador
                      </button>
                    )}

                    <Form
                      action={`delete/${id}`}
                      method="post"
                      onSubmit={(event) => {
                        const response = confirm(
                          "Tem certeza que deseja apagar este usuário?",
                        );
                        if (!response) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <button
                        type="submit"
                        className="flex w-min items-center gap-2 rounded-2xl bg-gradient-to-r from-red-800 to-red-700 py-1 pr-4 pl-2 text-sm font-bold text-white"
                      >
                        <TbTrash size="2.5rem" /> Apagar Usuário
                      </button>
                    </Form>
                  </div>
                )}
              </div>
            </li>
          ),
        )}
      </ul>
    </>
  );
}
