import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router";
import "./tailwind.css";
import type { ReactNode } from "react";
import { auth } from "~/.server/auth";
import { Container } from "~/components/container";
import type { Route } from "./+types/root";

export const links: Route.LinksFunction = () => {
  return [
    {
      rel: "icon",
      href: "/favicon.svg",
    },
    {
      rel: "icon",
      href: "/favicon.png",
      type: "image/png",
      sizes: "64x64",
    },
    { rel: "preconnect", href: "https://rsms.me/" },
    {
      rel: "stylesheet",
      href: "https://rsms.me/inter/inter.css",
    },
  ];
};

export const meta: Route.MetaFunction = () => {
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

export async function loader({ request }: Route.LoaderArgs) {
  return await auth(request);
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

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

import type { User } from "lucia";
import { TbLogin, TbLogout, TbUserCircle, TbUserPlus } from "react-icons/tb";
import { Form, NavLink } from "react-router";

export function Header({ user }: { user: Pick<User, "displayName"> | null }) {
  return (
    <header className="bg-neutral-100 py-6 px-6 md:px-9 lg:px-14 flex flex-col gap-8">
      <div className="flex min-h-32 items-center justify-between">
        <a
          href="https://lppfb.ufms.br/"
          title="Retornar ao site principal do LPPFB"
          className="contents"
        >
          <img
            className="h-28 max-w-md text-balance"
            src="/images/static/logo.svg"
            alt="UFMS - LABORATÓRIO DE PURIFICAÇÃO DE PROTEÍNAS E SUAS FUNÇÕES BIOLÓGICAS"
          />
        </a>
        {user ? (
          <div className="my-6 flex flex-wrap justify-end gap-3">
            <NavLink
              to="/perfil"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2 text-lg font-bold text-white"
            >
              {user.displayName} <TbUserCircle size="2rem" />
            </NavLink>
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-3xl bg-gradient-to-r from-neutral-200 to-neutral-300 py-2 pr-4 pl-5 text-lg font-bold"
              >
                Sair <TbLogout size="2rem" />
              </button>
            </Form>
          </div>
        ) : (
          <div className="my-6 flex flex-wrap justify-end gap-3">
            <NavLink
              to="/login"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 pr-4 pl-5 text-lg font-bold text-white"
            >
              Entrar <TbLogin size="2rem" />
            </NavLink>
            <NavLink
              to="/register"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-neutral-200 to-neutral-300 py-2 pr-4 pl-5 text-lg font-bold"
            >
              Cadastrar <TbUserPlus size="2rem" />
            </NavLink>
          </div>
        )}
      </div>
      <nav className="contents">
        <ul className="flex flex-wrap items-center justify-evenly gap-2 text-lg sm:justify-normal font-medium">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${
                  isActive
                    ? "rounded-2xl text-cyan-800 font-bold bg-neutral-200"
                    : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Início
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/banco-de-dados"
              className={({ isActive }) =>
                `${
                  isActive
                    ? "rounded-2xl text-cyan-800 font-bold bg-neutral-200"
                    : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Banco de Dados
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/pesquisa"
              className={({ isActive }) =>
                `${
                  isActive
                    ? "rounded-2xl text-cyan-800 font-bold bg-neutral-200"
                    : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Pesquisar
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/glossario"
              className={({ isActive }) =>
                `${
                  isActive
                    ? "rounded-2xl text-cyan-800 font-bold bg-neutral-200"
                    : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Glossário
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/fotos"
              className={({ isActive }) =>
                `${
                  isActive
                    ? "rounded-2xl text-cyan-800 font-bold bg-neutral-200"
                    : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Fotos
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/descobertas-lppfb"
              className={({ isActive }) =>
                `${
                  isActive
                    ? "rounded-2xl text-cyan-800 font-bold bg-neutral-200"
                    : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Descobertas do LPPFB
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/casos-de-sucesso"
              className={({ isActive }) =>
                `${
                  isActive
                    ? "rounded-2xl text-cyan-800 font-bold bg-neutral-200"
                    : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Casos de Sucesso
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/sobre"
              className={({ isActive }) =>
                `${
                  isActive
                    ? "rounded-2xl text-cyan-800 font-bold bg-neutral-200"
                    : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Sobre
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
