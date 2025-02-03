import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useNavigate,
  useRouteError,
} from "react-router";
import "./tailwind.css";
import type { ReactNode } from "react";
import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "react-router";
import { auth } from "~/.server/auth";
import { Container } from "~/components/container";
import { Header } from "~/components/header";

export const links: LinksFunction = () => {
  return [
    {
      rel: "icon",
      href: "/favicon.png",
      type: "image/png",
      sizes: "64x64",
    },
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap",
    },
  ];
};

export const meta: MetaFunction = () => {
  return [
    { title: "Facility FoodTech do Cerrado-Pantanal" },
    {
      charset: "utf-8",
    },
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    },
    {
      name: "description",
      content:
        "Bem-vindo ao nosso site dedicado à pesquisa biológica com enfoque exclusivo nas riquezas naturais do cerrado e pantanal!",
    },
  ];
};

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  return await auth(request);
}

export default function App() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <>
      <Header user={user} />
      <Outlet />
    </>
  );
}

export function HydrateFallback() {
  return null;
}

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  if (isRouteErrorResponse(error)) {
    return (
      <Container
        title={`Erro ${error.status} - "${error.statusText.toUpperCase()}"`}
      >
        <p className="rounded-xl bg-red-50 p-2 text-base text-red-800">
          {error.data}
        </p>
        <button
          type="button"
          onClick={() => {
            window.history.back();
          }}
          className="mx-auto my-4 flex self-center rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2 text-lg font-bold text-white"
        >
          Voltar
        </button>
      </Container>
    );
  }

  return (
    <Container title="Erro">
      <p className="rounded-xl bg-red-50 p-2 text-base text-red-800">
        {error instanceof Error ? error.message : "Erro desconhecido. 😢"}
      </p>
      <button
        type="button"
        onClick={() => {
          navigate(-1);
        }}
        className="mx-auto my-4 flex self-center rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2 text-lg font-bold text-white"
      >
        Voltar
      </button>
    </Container>
  );
}
