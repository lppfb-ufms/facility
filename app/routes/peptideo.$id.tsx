import { type LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Link,
  redirect,
  useLoaderData,
  useNavigate,
  useOutletContext,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { TbFlaskFilled, TbPencil } from "react-icons/tb";
import { db } from "~/.server/db/connection";
import { type User, peptideoTable } from "~/.server/db/schema";
import { Container } from "~/components/container";

export async function loader({ params }: LoaderFunctionArgs) {
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
      casoSucesso: true,
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

  return json(peptideo);
}

export default function Peptideo() {
  const {
    casoSucesso,
    ensaioCelular,
    microbiologia,
    atividadeAntifungica,
    propriedadesFisicoQuimicas,
    caracteristicasAdicionais,
    organismo,
    peptideoToPublicacao,
    funcaoBiologica,
    ...peptideo
  } = useLoaderData<typeof loader>();
  const publicacao = peptideoToPublicacao.map(({ publicacao }) => publicacao);
  const nomePopular = organismo?.organismoToNomePopular.map(
    ({ nomePopular }) => nomePopular,
  );

  const navigate = useNavigate();

  const { user } = useOutletContext<{ user: User | null }>();

  return (
    <Container>
      <div className="my-5 flex flex-col gap-4">
        {peptideo.descobertaLPPFB ? (
          <div className="flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-500 py-2 pl-5 pr-4 font-bold text-white">
            <TbFlaskFilled /> Descoberta do LPPFB
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <h2 className="border-b-2 border-neutral-100 pb-2 text-2xl font-bold text-cyan-600">
            Peptídeo
          </h2>
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
                ? `${peptideo.massaMolecular} Da`
                : "(sem dados)"}
            </p>
            <p>
              <span className="font-bold text-cyan-600">Massa molar: </span>
              {peptideo.massaMolar
                ? `${peptideo.massaMolar} g/mol`
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
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
            Sequência
          </h3>
          <p className="mt-2 break-words rounded-lg bg-neutral-50 px-4 py-2">
            {peptideo.sequencia ?? "(sem dados)"}
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
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
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
            Casos de sucesso
          </h3>

          {casoSucesso.length > 0 ? (
            casoSucesso.map(({ id, value }) => (
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
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
            Ensaio celular
          </h3>
          <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
            {ensaioCelular ?? "(sem dados)"}
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
            Microbiologia
          </h3>
          <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
            {microbiologia ?? "(sem dados)"}
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
            Atividade antifúngica
          </h3>
          <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
            {atividadeAntifungica ?? "(sem dados)"}
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
            Propriedades Físico-Químicas
          </h3>
          <p className="mt-2 rounded-lg bg-neutral-50 px-4 py-2">
            {propriedadesFisicoQuimicas ?? "(sem dados)"}
          </p>
        </div>

        <div>
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
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
          <h3 className="border-b-2 border-neutral-100 pb-2 text-xl font-bold text-cyan-600">
            Características adicionais
          </h3>
          {caracteristicasAdicionais.length > 0 ? (
            caracteristicasAdicionais.map(({ id, value }) => (
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

        <div className="flex items-center justify-center gap-2">
          {user && ["admin", "update"].includes(user.role) && (
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
