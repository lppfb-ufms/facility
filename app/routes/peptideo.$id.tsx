import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, redirect, useLoaderData, useNavigate } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { useMemo } from "react";
import { TbFlaskFilled, TbPencil } from "react-icons/tb";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { auth } from "~/.server/auth";
import { db } from "~/.server/db/connection";
import { peptideoTable } from "~/.server/db/schema";
import { Container } from "~/components/container";
import "katex/dist/katex.min.css";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const { id } = params;
  const peptideo = await db.query.peptideoTable.findFirst({
    where: eq(peptideoTable.id, Number(id)),
    with: {
      organismo: {
        with: {
          organismoToNomePopular: {
            columns: {},
            with: {
              nomePopular: true,
            },
          },
        },
      },
      funcaoBiologica: true,
      peptideoToCasoSucesso: {
        columns: {},
        with: {
          casoSucesso: true,
        },
      },
      caracteristicasAdicionais: true,
      peptideoToPublicacao: {
        columns: {},
        with: {
          publicacao: true,
        },
      },
    },
  });

  if (!peptideo) {
    return redirect("/");
  }

  const { user } = await auth(request);

  return { peptideoData: peptideo, user };
}

export default function Peptideo() {
  const { peptideoData, user } = useLoaderData<typeof loader>();
  const {
    peptideoToCasoSucesso,
    ensaioCelular,
    microbiologia,
    atividadeAntifungica,
    propriedadesFisicoQuimicas,
    caracteristicasAdicionais,
    organismo,
    peptideoToPublicacao,
    funcaoBiologica,
    ...peptideo
  } = peptideoData;
  const publicacao = peptideoToPublicacao.map(({ publicacao }) => publicacao);
  const casoSucesso = peptideoToCasoSucesso.map(
    ({ casoSucesso }) => casoSucesso,
  );
  const nomePopular = organismo?.organismoToNomePopular.map(
    ({ nomePopular }) => nomePopular,
  );

  const navigate = useNavigate();

  return (
    <Container>
      <div className="my-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 border-b-2 border-neutral-100">
            <h2 className="pb-2 text-4xl font-bold text-cyan-600">Peptídeo</h2>
            {peptideo.descobertaLPPFB ? (
              <div className="flex h-min w-fit items-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-500 px-3 py-1 font-bold text-white">
                <TbFlaskFilled /> Descoberta do LPPFB
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 rounded-lg bg-neutral-50 p-4">
            {peptideo.sintetico ? (
              <p className="font-bold text-cyan-600">Sintético</p>
            ) : (
              <>
                <p>
                  <span className="font-bold text-cyan-600">
                    Nome científico:{" "}
                  </span>
                  {organismo?.nomeCientifico ?? "(sem dados)"}
                </p>
                <p>
                  <span className="font-bold text-cyan-600">Família: </span>
                  {organismo?.familia ?? "(sem dados)"}
                </p>

                <p>
                  <span className="font-bold text-cyan-600">Origem: </span>
                  {organismo?.origem ?? "(sem dados)"}
                </p>

                <p>
                  <span className="font-bold text-cyan-600">
                    Nomes populares:{" "}
                  </span>
                  {nomePopular
                    ? nomePopular?.map(({ nome }) => nome).join(", ")
                    : "(sem dados)"}
                </p>
              </>
            )}
            <p>
              <span className="font-bold text-cyan-600">Identificador: </span>
              {peptideo.identificador ?? "(sem dados)"}
            </p>
            <p>
              <span className="font-bold text-cyan-600">Massa molecular: </span>
              {peptideo.massaMolecular
                ? `${Intl.NumberFormat("pt-BR").format(Number(peptideo.massaMolecular))} Da`
                : "(sem dados)"}
            </p>
            <p>
              <span className="font-bold text-cyan-600">Massa molar: </span>
              {peptideo.massaMolar
                ? `${Intl.NumberFormat("pt-BR").format(Number(peptideo.massaMolar))} g/mol`
                : "(sem dados)"}
            </p>
            <p>
              <span className="font-bold text-cyan-600">
                Qtd. aminoácidos:{" "}
              </span>
              {peptideo.quantidadeAminoacidos ?? "(sem dados)"}
            </p>
          </div>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Sequência
          </h3>
          <p className="mt-2 break-words rounded-lg bg-neutral-50 px-4 py-2">
            {peptideo.sequencia ?? "(sem dados)"}
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Funções biológicas
          </h3>

          {funcaoBiologica.length > 0 ? (
            funcaoBiologica.map(({ id, value }) => (
              <p key={id} className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
                {value}
              </p>
            ))
          ) : (
            <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
              (sem dados)
            </p>
          )}
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Casos de sucesso
          </h3>

          {casoSucesso.length > 0 ? (
            casoSucesso.map(
              ({ id, application, manufacturer, peptideProduct }) => (
                <p key={id} className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
                  {application} - {manufacturer} - {peptideProduct}
                </p>
              ),
            )
          ) : (
            <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
              (sem dados)
            </p>
          )}
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Ensaio celular
          </h3>
          <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
            <DisplayMarkdown>{ensaioCelular ?? "(sem dados)"}</DisplayMarkdown>
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Microbiologia
          </h3>
          <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
            <DisplayMarkdown>{microbiologia ?? "(sem dados)"}</DisplayMarkdown>
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Atividade antifúngica
          </h3>
          <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
            <DisplayMarkdown>
              {atividadeAntifungica ?? "(sem dados)"}
            </DisplayMarkdown>
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Propriedades Físico-Químicas
          </h3>
          <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
            <DisplayMarkdown>
              {propriedadesFisicoQuimicas ?? "(sem dados)"}
            </DisplayMarkdown>
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Publicações
          </h3>
          {publicacao.length > 0 ? (
            publicacao.map(({ id, doi, titulo }) => (
              <div
                key={id}
                className="mt-2 flex flex-col gap-2 rounded-lg bg-neutral-50 px-4 py-2"
              >
                <p>
                  <span className="font-bold text-cyan-600">DOI: </span>
                  {doi}
                </p>
                <p>
                  <span className="font-bold text-cyan-600">Título: </span>
                  {titulo}
                </p>
              </div>
            ))
          ) : (
            <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
              (sem dados)
            </p>
          )}
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-3xl font-bold text-cyan-600">
            Características adicionais
          </h3>
          {caracteristicasAdicionais.length > 0 ? (
            caracteristicasAdicionais.map(({ id, value }) => (
              <p key={id} className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
                <DisplayMarkdown>{value}</DisplayMarkdown>
              </p>
            ))
          ) : (
            <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
              (sem dados)
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          {user?.isAdmin && user?.emailVerified && (
            <Link
              prefetch="intent"
              to={`/peptideo/edit/${peptideo.id}`}
              className="flex w-min items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 py-2 pl-3 pr-4 font-bold text-white"
            >
              <TbPencil size="1.5rem" /> Editar
            </Link>
          )}
          <button
            type="button"
            className="w-min rounded-full bg-neutral-100 px-6 py-2 font-bold"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>
        </div>
      </div>
    </Container>
  );
}

function DisplayMarkdown({ children }: { children?: string | null }) {
  const markdownContent = useMemo(
    () => (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {children}
      </ReactMarkdown>
    ),
    [children],
  );

  return <div className="prose prose-facility">{markdownContent}</div>;
}
