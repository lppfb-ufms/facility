import { type LoaderFunctionArgs, redirect } from "react-router";
import { Form, Link, useFetcher, useLoaderData } from "react-router";
import { TbShieldCheckFilled, TbShieldFilled, TbShieldX } from "react-icons/tb";
import { auth } from "~/.server/auth";
import { Container } from "~/components/container";

export async function loader({ request }: LoaderFunctionArgs) {
  const { user } = await auth(request);
  if (!user) {
    return redirect("/login");
  }
  return { user };
}

export default function Perfil() {
  const { user } = useLoaderData<typeof loader>();

  const fetcher = useFetcher();

  return (
    <Container title="Perfil">
      <div className="grid grid-cols-2 gap-x-2">
        {" "}
        {/* Added gap-x-2 for horizontal spacing between columns */}
        <span className="justify-self-end font-bold text-cyan-600">Nome: </span>
        <span>{user.displayName}</span>
        <span className="justify-self-end font-bold text-cyan-600">
          Email:{" "}
        </span>
        <span>{user.email}</span>
        <span className="justify-self-end font-bold text-cyan-600">
          Data de criação de conta:{" "}
        </span>
        <span>
          {new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "long",
          }).format(new Date(user.createdAt))}
        </span>
        <span className="justify-self-end font-bold text-cyan-600">
          Email verificado:
        </span>
        {user.emailVerified ? (
          <TbShieldCheckFilled className="size-4 self-center text-cyan-600" />
        ) : (
          <TbShieldX className="size-4 self-center text-red-800" />
        )}
      </div>
      <div className="mx-2 mt-12 flex flex-col items-center justify-center gap-6">
        {!user.emailVerified ? (
          <Link
            to="/verify-email"
            className="rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2 text-lg font-bold text-white"
            onClick={() =>
              fetcher.submit(null, {
                action: "/verify-email/generate-new-code",
                method: "post",
              })
            }
          >
            Verificar email
          </Link>
        ) : null}
        <Link
          prefetch="intent"
          to="edit"
          className="rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2 text-lg font-bold text-white"
        >
          Editar dados
        </Link>
        <Form
          action="delete"
          method="post"
          onSubmit={(event) => {
            const response = confirm(
              "Tem certeza que deseja excluir sua conta?",
            );
            if (!response) {
              event.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            className="rounded-full bg-gradient-to-r from-red-800 to-red-700 px-6 py-2 text-lg font-bold text-white"
          >
            Apagar conta
          </button>
        </Form>
      </div>
      {user.isAdmin && user.emailVerified && (
        <div className="mt-6 h-full border-t-2 border-neutral-100">
          <div className="mx-2 mt-6 flex flex-col items-center justify-center gap-6">
            <Link
              prefetch="intent"
              to="/admin"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2 text-lg font-bold text-white"
            >
              <TbShieldFilled className="size-4" /> Área administrativa
            </Link>
          </div>
        </div>
      )}
    </Container>
  );
}
