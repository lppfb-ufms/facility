import {
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import "./tailwind.css";

function Header() {
  const isAdmin = false;

  const routes = [
    { name: "Início", path: "/" },
    { name: "Pesquisar", path: "/pesquisa" },
    { name: "Transcriptômica", path: "/transcriptomica" },
    { name: "Proteômica", path: "/proteomica" },
    { name: "Genômica", path: "/genomica" },
    { name: "Predição de Peptídeos", path: "/predicao-de-peptideos" },
    { name: "Missão", path: "/missao" },
    { name: "Quem Somos", path: "/quem-somos" },
    { name: "FAQ", path: "/faq" },
    { name: "Fotos", path: "/fotos" },
  ];

  return (
    <header>
      <div className="flex h-20 items-center justify-between px-6">
        <img
          className="h-16 max-w-md text-balance"
          src="images/lppfb-logo.jpg"
          alt="UFMS - LABORATÓRIO DE PURIFICAÇÃO DE PROTEÍNAS E SUAS FUNÇÕES BIOLÓGICAS"
        />
        {isAdmin ? (
          <div className="font-bold">Acesso Administrador</div>
        ) : (
          <div className="flex gap-4">
            <button className="rounded-full bg-cyan-400 px-5 py-1 text-lg font-bold text-white">
              Entrar
            </button>
            <button className="rounded-full bg-neutral-400 px-5 py-1 font-bold text-white">
              Cadastrar
            </button>
          </div>
        )}
      </div>
      <nav className="bg-neutral-200 py-1">
        <ul className="flex flex-wrap items-center justify-center gap-6">
          {routes.map((route) => (
            <li key={route.path}>
              <NavLink
                to={route.path}
                className={({ isActive }) =>
                  `${
                    isActive ? "underline" : ""
                  } underline-offset-4 hover:underline`
                }
              >
                {route.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Header />
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function HydrateFallback() {
  return <p>Loading...</p>;
}
