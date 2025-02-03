import { Form } from "react-router";
import { useState } from "react";
import { TbSearch } from "react-icons/tb";

export default function Index() {
  return (
    <>
      <div className="min-h-[34rem] overflow-x-hidden bg-[url('/images/static/molecula.png')] bg-contain bg-fixed bg-right bg-no-repeat pt-6 lg:pt-0">
        <div className="mx-8 my-16 flex flex-col items-center justify-around lg:flex-row">
          <div className="lg:min-w-2/5 flex w-full flex-col items-center gap-8">
            <h1 className="text-balance px-6 text-center text-4xl font-bold text-white lg:w-96 lg:px-0">
              Facility FoodTech do Cerrado-Pantanal
            </h1>
            <SearchBar />
          </div>
          <div className="mx-4 mb-20 mt-12 flex items-center gap-16">
            <img
              src="/images/static/img-01.jpg"
              alt="UFMS - LABORATÓRIO DE PURIFICAÇÃO DE PROTEÍNAS E SUAS FUNÇÕES BIOLÓGICAS"
              className="h-56 max-w-md translate-x-6 translate-y-16 text-balance border-4 border-neutral-300"
            />
            <img
              src="/images/static/img-02.jpg"
              alt="UFMS - LABORATÓRIO DE PURIFICAÇÃO DE PROTEÍNAS E SUAS FUNÇÕES BIOLÓGICAS"
              className="h-56 max-w-md -translate-x-2 -translate-y-4 text-balance border-4 border-neutral-300"
            />
          </div>
        </div>
      </div>
      <div className="flex min-h-lvh justify-center bg-white text-justify">
        <div className="flex flex-col gap-4 px-4 py-3 font-sans sm:p-10 md:max-w-[140ch]">
          <h2 className="text-2xl font-bold">Introdução</h2>
          <p>
            Bem-vindo ao nosso site dedicado à pesquisa biológica com enfoque
            exclusivo nas riquezas naturais do cerrado e pantanal. Nossa
            plataforma é uma extensão do Laboratório de Purificação de Proteínas
            e Suas Funções Biológicas da UFMS, coordenado pela Profª Drª Maria
            Lígia Rodrigues Macedo.
          </p>
          <h2 className="text-2xl font-bold">Propósito</h2>
          <p>
            Nosso objetivo é proporcionar um ambiente virtual abrangente para
            que comunidade científica, estudantes e entusiastas da biologia
            possam explorar as maravilhas do cerrado e pantanal. Aqui, você
            encontrará recursos avançados para pesquisa em predição de
            peptídeos, análise transcriptômica, estudo do proteoma e decifração
            genômica, todos alinhados ao ecossistema único dessas regiões
            brasileiras.
          </p>
          <h2 className="text-2xl font-bold">Explorando o Site</h2>
          <ul>
            <li>
              <b>Busca Especializada</b>: Utilize nossa barra de busca para
              encontrar informações detalhadas sobre peptídeos, transcriptômica,
              proteoma e genômica associados ao cerrado e pantanal.
            </li>
            <li>
              <b>Categorias Específicas</b>: Navegue esses biomas, oferecendo
              uma visão aprofundada e segmentada de nossas pesquisas.
            </li>
            <li>
              <b>Recursos Complementares</b>: Acesse o glossário de termos,
              links para artigos científicos, referências e a seção de download
              para aprofundar seus estudos.
            </li>
          </ul>
          <p>
            Embarque conosco nessa jornada de descobertas científicas, onde o
            cerrado e pantanal se tornam fontes inesgotáveis de conhecimento, e
            o Laboratório de Purificação de Proteínas da UFMS, sob a liderança
            da Professora Doutora Maria Lígia Rodrigues Macedo, desvenda os
            segredos desses ecossistemas únicos.
          </p>
        </div>
      </div>
    </>
  );
}

function SearchBar() {
  const [query, setQuery] = useState("");

  return (
    <Form
      method="get"
      action="/pesquisa/resultado"
      className="flex h-16 w-11/12"
    >
      <input type="hidden" name="nomePopular" value={query} />
      <input type="hidden" name="nomeCientifico" value={query} />
      <input type="hidden" name="origem" value={query} />
      <input type="hidden" name="familia" value={query} />
      <input type="hidden" name="casoSucesso" value={query} />
      <input
        type="text"
        className="w-full rounded-l-3xl border-2 border-white bg-white px-4 py-2 text-black"
        placeholder="Pesquisar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        required
      />
      <button
        aria-label="Pesquisar"
        type="submit"
        className="rounded-r-3xl bg-cyan-500 px-4 py-2 text-white"
      >
        <TbSearch size="2rem" />
      </button>
    </Form>
  );
}
