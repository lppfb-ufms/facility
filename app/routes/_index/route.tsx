import { useState } from "react";
import { TbSearch } from "react-icons/tb";
import { Form } from "react-router";

export default function Index() {
  return (
    <>
      <div className="min-h-[40rem] overflow-x-hidden bg-[url('/images/static/molecula.png')] bg-contain bg-fixed bg-right bg-no-repeat">
        <div className="mx-16 my-16 flex flex-col items-center justify-around lg:flex-row">
          <div className="flex w-full flex-col gap-8 lg:min-w-2/5">
            <h1 className="text-6xl text-pretty block font-medium text-white lg:w-96 lg:px-0">
              Facility FoodTech do Cerrado-Pantanal
            </h1>
            <SearchBar />
          </div>
          <div className="mx-4 mt-12 mb-20 flex items-center gap-16">
            <img
              src="/images/static/img-01.jpg"
              alt="UFMS - LABORATÓRIO DE PURIFICAÇÃO DE PROTEÍNAS E SUAS FUNÇÕES BIOLÓGICAS"
              className="h-56 max-w-md translate-x-6 translate-y-16 border-4 border-neutral-300 text-balance"
            />
            <img
              src="/images/static/img-02.jpg"
              alt="UFMS - LABORATÓRIO DE PURIFICAÇÃO DE PROTEÍNAS E SUAS FUNÇÕES BIOLÓGICAS"
              className="h-56 max-w-md -translate-x-2 -translate-y-4 border-4 border-neutral-300 text-balance"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-center bg-white text-justify">
        <div className="flex flex-col px-4 py-3 font-sans sm:p-10 md:max-w-[120ch] prose prose-facility">
          <h2>Introdução</h2>
          <p>
            Bem-vindo ao nosso site dedicado à pesquisa biológica com enfoque
            exclusivo nas riquezas naturais do cerrado e pantanal. Nossa
            plataforma é uma extensão do Laboratório de Purificação de Proteínas
            e Suas Funções Biológicas da UFMS, coordenado pela Profª Drª Maria
            Lígia Rodrigues Macedo.
          </p>
          <h2>Propósito</h2>
          <p>
            Nosso objetivo é proporcionar um ambiente virtual abrangente para
            que comunidade científica, estudantes e entusiastas da biologia
            possam explorar as maravilhas do cerrado e pantanal. Aqui, você
            encontrará recursos avançados para pesquisa em predição de
            peptídeos, análise transcriptômica, estudo do proteoma e decifração
            genômica, todos alinhados ao ecossistema único dessas regiões
            brasileiras.
          </p>
          <h2>Explorando o Site</h2>
          <ul>
            <li>
              <span className="font-medium">Busca Especializada</span>: Utilize nossa barra de busca para
              encontrar informações detalhadas sobre peptídeos, transcriptômica,
              proteoma e genômica associados ao cerrado e pantanal.
            </li>
            <li>
              <span className="font-medium">Categorias Específicas</span>: Navegue esses biomas, oferecendo
              uma visão aprofundada e segmentada de nossas pesquisas.
            </li>
            <li>
              <span className="font-medium">Recursos Complementares</span>: Acesse o glossário de termos,
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
