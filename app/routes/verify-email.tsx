import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { parseWithValibot } from "conform-to-valibot";
import { eq } from "drizzle-orm";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, redirect, useActionData, useFetcher } from "react-router";
import { object, string } from "valibot";
import { auth, lucia, verifyVerificationCode } from "~/.server/auth";
import { Container } from "~/components/container";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import { userTable } from "~/db/schema";

export async function action({ request }: ActionFunctionArgs) {
  const { user } = await auth(request);

  if (!user) {
    const sessionCookie = lucia.createBlankSessionCookie();
    return redirect("/login", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema: object({ code: string("Código inválido") }),
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const { code } = submission.value;

  const codeValid = await verifyVerificationCode(user, code);

  if (!codeValid) {
    return submission.reply({
      fieldErrors: { code: ["Código inválido"] },
    });
  }

  await lucia.invalidateUserSessions(user.id);
  await db
    .update(userTable)
    .set({ emailVerified: true })
    .where(eq(userTable.id, user.id));

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);

  return redirect("/", {
    headers: {
      "Set-Cookie": sessionCookie.serialize(),
    },
  });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { user, session } = await auth(request);

  if (!session) {
    const sessionCookie = lucia.createBlankSessionCookie();
    return redirect("/login", {
      headers: {
        "Set-Cookie": sessionCookie.serialize(),
      },
    });
  }

  if (user?.emailVerified) {
    return redirect("/");
  }

  return null;
}

export default function VerifyEmail() {
  const lastResult = useActionData<typeof action>();

  const [form, fields] = useForm({
    defaultValue: {
      code: "",
    },
    lastResult,
  });

  const resendEmail = useFetcher();

  return (
    <Container title="Verificação de email">
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex flex-col gap-4"
      >
        <TextInput
          label="Código de verificação"
          {...getInputProps(fields.code, { type: "text" })}
        />
        <FormErrorMessage errors={fields.code.errors} />
        {/* link to resend email */}
        <p className="flex gap-1 text-center text-sm text-neutral-700">
          Não recebeu o código de verificação?
          <button
            type="reset"
            className="text-cyan-600 hover:underline"
            onClick={() =>
              resendEmail.submit(null, {
                action: "/verify-email/generate-new-code",
                method: "post",
              })
            }
          >
            Reenviar
          </button>
        </p>
        <div className="m-4 flex justify-center">
          <SubmitButton>Enviar</SubmitButton>
        </div>
      </Form>
    </Container>
  );
}
