import { type LoaderFunctionArgs, redirect } from "react-router";

export function loader({ params }: LoaderFunctionArgs) {
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
