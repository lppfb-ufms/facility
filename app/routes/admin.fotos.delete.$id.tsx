import { rm } from "node:fs";
import { type ActionFunctionArgs, redirect } from "@remix-run/node";
import { eq } from "drizzle-orm";
import { auth, lucia } from "~/.server/auth";
import { db } from "~/.server/db/connection";
import { imageMetadataTable } from "~/.server/db/schema";

export async function action({ params, request }: ActionFunctionArgs) {
  const { session, user } = await auth(request);

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    return redirect("/login", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  if (session.fresh) {
    const sessionCookie = lucia.createSessionCookie(session.id);
    return redirect(request.url, {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  if (!user.isAdmin || !user.emailVerified) {
    return redirect("/");
  }

  const id = params.id;
  if (!id) {
    return { message: "Id inválido", ok: false };
  }

  const metadata = await db.query.imageMetadataTable.findFirst({
    where: eq(imageMetadataTable.id, Number(id)),
  });

  if (!metadata) {
    return { message: "Imagem não encontrada", ok: false };
  }

  rm(
    `${process.env.UPLOAD_DIRECTORY}/images/upload/${metadata.fileName}`,
    (err) => {
      if (err) {
        console.error(err);
        return { message: "Falha ao excluir a imagem", ok: false };
      }
    },
  );

  await db
    .delete(imageMetadataTable)
    .where(eq(imageMetadataTable.id, metadata.id));

  return redirect("/admin/fotos");
}

export async function loader() {
  return redirect("/");
}
