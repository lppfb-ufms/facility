import { rm } from "node:fs";
import { eq } from "drizzle-orm";
import { redirect } from "react-router";
import { auth } from "~/.server/auth";
import { sessionCookie } from "~/.server/cookie";
import { db } from "~/db/connection.server";
import { imageMetadataTable } from "~/db/schema";
import type { Route } from "./+types/route";

export async function action({ params, request }: Route.ActionArgs) {
  const { session, user } = await auth(request);

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
