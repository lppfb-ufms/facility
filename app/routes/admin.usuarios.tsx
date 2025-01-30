import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { TbShieldMinus, TbShieldPlus, TbTrash } from "react-icons/tb";
import { auth } from "~/.server/auth";
import { db } from "~/.server/db/connection";
import { userTable } from "~/.server/db/schema";

export async function loader({ request }: LoaderFunctionArgs) {
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

export async function action({ request }: ActionFunctionArgs) {
  const { user } = await auth(request);

  if (!user || !user.isAdmin) {
    return redirect("/");
  }

  const formData = await request.formData();

  const id = formData.get("id");
  const isAdmin = formData.get("isAdmin");

  if (!id || !action || typeof id !== "string" || typeof isAdmin !== "string") {
    return null;
  }

  if (user.id === id) {
    return null;
  }

  await db
    .update(userTable)
    .set({ isAdmin: isAdmin === "true" })
    .where(eq(userTable.id, id));
  return null;
}

export default function Usuarios() {
  const { users, user } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();

  return (
    <>
      <h1 className="mb-4 text-center text-xl font-bold text-cyan-600">
        Usuários
      </h1>
      <ul className="flex flex-col gap-8">
        {users.map(
          ({ id, displayName, email, emailVerified, createdAt, isAdmin }) => (
            <li key={id} className="rounded-lg bg-neutral-100 p-4">
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
