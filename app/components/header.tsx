import { Form, NavLink } from "@remix-run/react";
import type { User } from "lucia";
import { TbLogin, TbLogout, TbUserCircle, TbUserPlus } from "react-icons/tb";

export function Header({ user }: { user: Pick<User, "displayName"> | null }) {
  return (
    <header>
      <div className="flex min-h-26 items-center justify-between bg-white px-4">
        <a
          href="https://lppfb.ufms.br/"
          title="Retornar ao site principal do LPPFB"
        >
          <img
            className="my-2 h-24 max-w-md text-center text-balance"
            src="/images/static/lppfb-logo.jpg"
            alt="UFMS - LABORATÓRIO DE PURIFICAÇÃO DE PROTEÍNAS E SUAS FUNÇÕES BIOLÓGICAS"
          />
        </a>
        {user ? (
          <div className="my-6 flex flex-wrap justify-end gap-3">
            <NavLink
              prefetch="intent"
              to="/perfil"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2 text-lg font-bold text-white"
            >
              {user.displayName as string} <TbUserCircle size="2rem" />
            </NavLink>
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-full bg-gradient-to-l from-neutral-200 to-neutral-100 py-2 pr-4 pl-5 text-lg font-bold"
              >
                Sair <TbLogout size="2rem" />
              </button>
            </Form>
          </div>
        ) : (
          <div className="my-6 flex flex-wrap justify-end gap-3">
            <NavLink
              prefetch="intent"
              to="/login"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 pr-4 pl-5 text-lg font-bold text-white"
            >
              Entrar <TbLogin size="2rem" />
            </NavLink>
            <NavLink
              prefetch="intent"
              to="/register"
              className="flex items-center gap-2 rounded-full bg-gradient-to-l from-neutral-200 to-neutral-100 py-2 pr-4 pl-5 text-lg font-bold"
            >
              Cadastrar <TbUserPlus size="2rem" />
            </NavLink>
          </div>
        )}
      </div>
      <nav className="bg-neutral-100 py-3">
        <ul className="flex flex-wrap items-center justify-evenly gap-2 text-lg font-bold sm:mx-8 sm:justify-normal">
          <li>
            <NavLink
              prefetch="intent"
              to="/"
              className={({ isActive }) =>
                `${
                  isActive ? "underline" : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Início
            </NavLink>
          </li>
          <li>
            <NavLink
              prefetch="intent"
              to="/banco-de-dados"
              className={({ isActive }) =>
                `${
                  isActive ? "underline" : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Banco de Dados
            </NavLink>
          </li>
          <li>
            <NavLink
              prefetch="intent"
              to="/pesquisa"
              className={({ isActive }) =>
                `${
                  isActive ? "underline" : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Pesquisar
            </NavLink>
          </li>
          <li>
            <NavLink
              prefetch="intent"
              to="/glossario"
              className={({ isActive }) =>
                `${
                  isActive ? "underline" : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Glossário
            </NavLink>
          </li>
          <li>
            <NavLink
              prefetch="intent"
              to="/fotos"
              className={({ isActive }) =>
                `${
                  isActive ? "underline" : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Fotos
            </NavLink>
          </li>
          <li>
            <NavLink
              prefetch="intent"
              to="/descobertas-lppfb"
              className={({ isActive }) =>
                `${
                  isActive ? "underline" : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Descobertas do LPPFB
            </NavLink>
          </li>
          <li>
            <NavLink
              prefetch="intent"
              to="/casos-de-sucesso"
              className={({ isActive }) =>
                `${
                  isActive ? "underline" : ""
                } p-3 underline-offset-4 hover:underline`
              }
            >
              Casos de Sucesso
            </NavLink>
          </li>
          <li>
            <NavLink
              prefetch="intent"
              to="/sobre"
              className={({ isActive }) =>
                `${
                  isActive ? "underline" : ""
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
