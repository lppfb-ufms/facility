import { transporter } from "~/.server/email";

export async function loader() {
  transporter.isIdle();

  //   transporter.sendMail({
  //     to: "cpadilha.aguiar@gmail.com",
  //     subject: "Teste 2",
  //     text: "teste teste teste",
  //   }, (error, info) => {
  //     if (error) {
  //       console.log(error);
  //     } else {
  //       console.log(info);
  //     }
  //   });

  return null;
}

export default function Test() {
  return null;
}
