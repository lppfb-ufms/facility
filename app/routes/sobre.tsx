import { Container } from "~/components/container";
import {
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandX,
  TbMail,
  TbMapPin,
} from "react-icons/tb";

export default function Sobre() {
  return (
    <Container title="Informações sobre o projeto">
      <div className="flex flex-col gap-4 bg-white px-4 py-3 font-sans sm:p-10">
        <p>A ser preenchido.</p>
        <h2 className="text-xl font-bold">Financiadores</h2>
        <p>A ser preenchido.</p>
        <h2 className="text-xl font-bold">Contato</h2>
        <ul className="flex flex-col gap-5">
          <li className="flex gap-3">
            <TbBrandInstagram size="2.5rem" />
            <div className="flex flex-col justify-center">
              <b>Instagram:</b>
              <a
                className="text-cyan-600 hover:underline"
                href="https://www.instagram.com/lppfb.ufms/"
                target="_blank"
                rel="noreferrer"
              >
                @lppfb.ufms
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <TbBrandX size="2.5rem" />
            <div className="flex flex-col justify-center">
              <b>X (anteriormente conhecido como Twitter):</b>
              <a
                className="text-cyan-600 hover:underline"
                href="https://x.com/lppfb"
                target="_blank"
                rel="noreferrer"
              >
                @lppfb
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <TbBrandLinkedin size="2.5rem" />
            <div className="flex flex-col justify-center">
              <b>LinkedIn:</b>
              <a
                className="text-cyan-600 hover:underline"
                href="https://www.linkedin.com/in/lppfb/"
                target="_blank"
                rel="noreferrer"
              >
                /in/lppfb
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <TbMapPin size="2.5rem" />
            <div className="flex flex-col">
              <b>Endereço:</b>
              <p>
                (UFMS) Universidade Federal de Mato Grosso do Sul, Faculdade de
                Ciências Farmacêuticas, Alimentos e Nutrição, Bloco 9,
                Laboratório de Purificação de Proteínas e Suas Funções
                Biológicas.
              </p>
              <p>Av. Costa e Silva, s/n</p>
              <p>Campo Grande - MS</p>
            </div>
          </li>
          <li className="flex gap-3">
            <TbMail size="2.5rem" />
            <div className="flex flex-col justify-center">
              <b>Email:</b>
              <a
                className="text-cyan-600 hover:underline"
                href="mailto:lppfb.facfan@ufms.br"
                target="_blank"
                rel="noreferrer"
              >
                lppfb.facfan@ufms.br
              </a>
            </div>
          </li>
        </ul>
      </div>
    </Container>
  );
}
