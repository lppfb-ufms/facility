import {
  type FieldName,
  type FormId,
  FormProvider,
  getFieldsetProps,
  getFormProps,
  getInputProps,
  useField,
  useForm,
  useFormMetadata,
} from "@conform-to/react";
import { getValibotConstraint, parseWithValibot } from "conform-to-valibot";
import { eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-valibot";
import { TbPlus, TbTrash } from "react-icons/tb";
import type { Route } from "./+types/route";

import { Form, redirect, useNavigate } from "react-router";
import {
  type InferOutput,
  array,
  integer,
  number,
  object,
  optional,
  setSpecificMessage,
  string,
} from "valibot";
import { auth, lucia } from "~/.server/auth";
import { FormErrorMessage, SubmitButton, TextInput } from "~/components/form";
import { db } from "~/db/connection.server";
import {
  nomePopularTable,
  organismoTable,
  organismoToNomePopularTable,
} from "~/db/schema";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { session } = await auth(request);

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

  const param = params["*"];

  if (typeof Number(param) !== "number" || Number.isNaN(Number(param))) {
    return null;
  }

  const [organismo] = await db
    .select({
      ...getTableColumns(organismoTable),
      nomePopular: sql<
        Array<{ id: number; nome: string }>
      >`json_agg(distinct ${nomePopularTable})`,
    })
    .from(organismoTable)
    .innerJoin(
      organismoToNomePopularTable,
      eq(organismoTable.id, organismoToNomePopularTable.organismoId),
    )
    .leftJoin(
      nomePopularTable,
      eq(organismoToNomePopularTable.nomePopularId, nomePopularTable.id),
    )
    .where(eq(organismoTable.id, Number(param)))
    .groupBy(organismoTable.id);

  if (!organismo) {
    return null;
  }

  return organismo;
}

export async function action({ request }: Route.ActionArgs) {
  const { session } = await auth(request);

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

  const formData = await request.formData();
  const submission = parseWithValibot(formData, {
    schema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const organismo = submission.value;

  const { nomePopular, ...restOfOrganismo } = organismo;
  const [{ organismoId }] = await db
    .insert(organismoTable)
    .values(restOfOrganismo)
    .returning({ organismoId: organismoTable.id });

  if (nomePopular !== undefined) {
    const ids = await db
      .select({ id: nomePopularTable.id })
      .from(nomePopularTable)
      .where(
        inArray(
          nomePopularTable.nome,
          nomePopular.map(({ nome }) => nome),
        ),
      );
    const newIds = await db
      .insert(nomePopularTable)
      .values(nomePopular)
      .onConflictDoNothing()
      .returning({ id: nomePopularTable.id });

    await db
      .insert(organismoToNomePopularTable)
      .values(
        [...ids, ...newIds].map(({ id }) => ({
          organismoId,
          nomePopularId: id,
        })),
      )
      .onConflictDoNothing();
  }

  return submission.reply();
}

setSpecificMessage(string, "Campo obrigatório");
setSpecificMessage(number, "Número inválido");
setSpecificMessage(integer, "Informe um número inteiro");
const schema = object({
  nomePopular: optional(array(createInsertSchema(nomePopularTable))),
  ...createInsertSchema(organismoTable).entries,
});

export default function InsertOrganismo({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const [form, fields] = useForm({
    defaultValue: loaderData,
    lastResult: actionData,
    constraint: getValibotConstraint(schema),
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema });
    },
  });

  const navigate = useNavigate();

  return (
    <FormProvider context={form.context}>
      <Form
        method="post"
        {...getFormProps(form)}
        className="flex w-full flex-col gap-6"
      >
        <input {...getInputProps(fields.id, { type: "hidden" })} />
        <TextInput
          label="Espécie"
          {...getInputProps(fields.nomeCientifico, { type: "text" })}
        />
        <FormErrorMessage errors={fields.nomeCientifico.errors} />
        <TextInput
          label="Origem"
          {...getInputProps(fields.origem, { type: "text" })}
        />
        <FormErrorMessage errors={fields.origem.errors} />
        <TextInput
          label="Família"
          {...getInputProps(fields.familia, { type: "text" })}
        />
        <FormErrorMessage errors={fields.familia.errors} />

        <NomesPopularesForm
          formId={form.id}
          nomePopular={fields.nomePopular.name}
        />
        <FormErrorMessage
          errors={Object.entries(form.allErrors).map(
            ([key, value]) => `${key}: ${value.join(", ")}`,
          )}
        />

        <div className="flex items-center justify-center gap-5">
          <SubmitButton>Enviar</SubmitButton>
          <button
            type="button"
            className="rounded-full bg-neutral-200 px-6 py-2 text-lg font-bold"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </div>
      </Form>
      {actionData?.status === "success" ? (
        <p
          className={
            "my-4 rounded-xl bg-cyan-100 px-4 py-2 text-base text-cyan-700"
          }
        >
          Organismo salvo com sucesso.
        </p>
      ) : null}
    </FormProvider>
  );
}

function NomesPopularesForm({
  formId,
  nomePopular,
}: {
  formId: FormId<InferOutput<typeof schema>>;
  nomePopular: FieldName<Array<{ id?: number | undefined; nome: string }>>;
}) {
  const form = useFormMetadata(formId);
  const [nomePopularMeta] = useField(nomePopular);

  const nomesPopulares = nomePopularMeta.getFieldList();

  return (
    <fieldset
      className="my-2 flex gap-2"
      {...getFieldsetProps(nomePopularMeta)}
    >
      <legend className="mb-2 flex w-full items-center gap-3 text-cyan-600 aria-disabled:text-neutral-700">
        Nomes Populares
        <button
          className="flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-2 py-1 text-sm font-bold text-white disabled:from-neutral-600 disabled:to-neutral-500"
          {...form.insert.getButtonProps({
            name: nomePopular,
          })}
        >
          <TbPlus /> adicionar
        </button>
      </legend>
      <ul className="flex w-full flex-col gap-3">
        {nomesPopulares.map((item, index) => {
          const nome = item.getFieldset();
          return (
            <li key={item.key} className="flex flex-col">
              <input
                {...getInputProps(nome.id, { type: "hidden" })}
                key={item.key}
              />
              <div className="flex-grow">
                <TextInput
                  {...getInputProps(nome.nome, { type: "text" })}
                  key={item.key}
                />
              </div>
              <FormErrorMessage errors={nome.nome.errors} />
              <button
                className="mt-2 flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-red-800 to-red-700 px-2 py-1 text-sm font-bold text-white"
                {...form.remove.getButtonProps({
                  name: nomePopular,
                  index,
                })}
              >
                <TbTrash /> apagar
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
