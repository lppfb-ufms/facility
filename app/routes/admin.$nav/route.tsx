import { redirect } from "react-router";
import type { Route } from "./+types/route";

export function loader({ params }: Route.LoaderArgs) {
  const { nav } = params;

  if (
    nav !== "inserir" &&
    nav !== "listar" &&
    nav !== "usuarios" &&
    nav !== "fotos" &&
    nav !== "glossario"
  ) {
    return redirect("/admin");
  }
}
