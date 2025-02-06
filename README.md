![GitHub Actions CI Badge](https://github.com/lppfb-ufms/facility/actions/workflows/ci.yaml/badge.svg)

# Facility Food Tech do Cerrado e Pantanal

## 📋 Pré-requisitos
- Docker Engine (>=27.0)
- Git

## 🔧 Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/lppfb-ufms/facility
cd facility
```

2. **Defina as variáveis de ambiente**

```bash
cp .env.example .env
```

Edite o arquivo `.env` com a sua configuração:

```plaintext
EMAIL_USER=email@example.com
EMAIL_PASS=password
SESSION_COOKIE_SECRET=secret
DATABASE_URL=postgres://postgres:postgres@localhost:5432/facility
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=facility
```

**EMAIL_USER** e **EMAIL_PASS** são as credenciais de envio de e-mail através do Gmail, é necessário ativar a autenticação de duas etapas e gerar uma senha de app para o seu e-mail. Detalhes para fazer isso estão neste [artigo de suporte do Google](https://support.google.com/accounts/answer/185833?hl=pt-BR)

**SESSION_COOKIE_SECRET** é a chave secreta para assinar os cookies de sessão. Caso não informada, será gerada automaticamente, porém todos os cookies se tornarão inválidos ao reiniciar o servidor. Para gerar uma chave persistente utilize o seguinte comando no terminal:

```bash
head -c20 /dev/urandom | base64
```

**DATABASE_URL**, **PGUSER**, **PGPASSWORD** e **PGDATABASE** são as credenciais de acesso ao banco de dados PostgreSQL. A URL de conexão é composta por `postgres://<user>:<password>@<host>:<port>/<database>`.

3. **Inicie a aplicação**

No terminal, execute o comando:
```bash
docker compose up -d
```

A aplicação estará disponível na porta HTTP padrão (80) do servidor.

## 🔄 Backup e restauração

Backup do banco de dados

```bash
docker compose exec db pg_dump -U ${PGUSER} ${PGDATABASE} > facility_db_backup_$(date +%Y%m%d_%H%M%S).sql
```

Restaurar backup

```bash
cat backup_file.sql | docker compose exec -T db psql -U ${PGUSER} ${PGDATABASE}
```

Backup de fotos enviadas

```bash
zip -e facility_fotos_backup_$(date +%Y%m%d_%H%M%S).zip ./public/images/upload/
```

## 🔧 Manutenção

**Atualize a aplicação**

Quando houver atualizações no repositório, faça o pull e reinicie a aplicação:

```bash
git pull
docker compose up -d --build
```

## 🛠️ Tecnologias utilizadas
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [PostgreSQL](https://www.postgresql.org/)
- [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/)

## 🗂️ Organização do projeto

```
|-- .github
|   |-- workflows
|   |   `-- ci.yaml
|   `-- renovate.json
|-- app
|   |-- .server
|   |   |-- auth.ts
|   |   |-- cookie.ts
|   |   |-- email.ts
|   |   `-- index.ts
|   |-- components
|   |   |-- container.tsx
|   |   `-- form.tsx
|   |-- db
|   |   |-- connection.server.ts
|   |   `-- schema.ts
|   |-- routes
|   |   `-- (...).tsx
|   |-- entry.server.tsx
|   |-- root.tsx
|   |-- routes.ts
|   `-- tailwind.css
|-- docs
|   `-- (...).md
|-- migrations
|   |-- (...).sql
|   |-- caso_sucesso.sql
|   |-- facility.sql
|   |-- fotos.sql
|   |-- glossario.sql
|   `-- sintetizados_lppfb.sql
|-- public
|   |-- images
|   |   `-- static
|   |       |-- img-01.jpg
|   |       |-- img-02.jpg
|   |       |-- logo.svg
|   |       `-- molecula.png
|   |-- favicon.png
|   `-- favicon.svg
|-- biome.json
|-- bun.lock
|-- docker-compose.yml
|-- Dockerfile
|-- drizzle.config.ts
|-- package.json
|-- react-router.config.ts
|-- README.md
|-- tsconfig.json
`-- vite.config.ts
```

Este projeto está organizado de forma modular e organizada, visando facilitar tanto o desenvolvimento quanto a manutenção.  

A pasta `.github` contém os arquivos de configuração do **GitHub Actions** para testes automatizados, e do **Renovate** para atualização automática de dependências.  

A pasta `app` concentra os componentes da interface, as rotas da aplicação e a integração com o servidor. Os nomes de arquivo seguem a convenção de rotas do [@react-router/fs-routes](https://reactrouter.com/how-to/file-route-conventions).  

A documentação do site é centralizada na pasta `docs`.  

As migrações de banco de dados, essenciais para o controle de versões, ficam reunidas na pasta `migrations`, enquanto os arquivos e recursos estáticos, como imagens e ícones, estão disponíveis na pasta `public`.  

Além disso, os arquivos de configuração, como os relativos ao *Docker*, *Vite* e *TypeScript*, refletem uma abordagem atual e escalável de desenvolvimento e implantação.

## 💻 Desenvolvimento

Crie um banco de dados local

```bash
docker run --name pg -e POSTGRES_USER=$usuario -e POSTGRES_PASSWORD=$senha -p 5432:5432 -d postgres
docker exec -it pg psql -U $usuario -c "CREATE DATABASE $nome_bd"
```

Servidor de desenvolvimento

```bash
# instalar dependências
bun install

# iniciar o servidor
bun dev
```

Operações de banco de dados

```bash
# aplicar alterações de schema no banco de dados
bun run db push
```

Fazer build da aplicação

```bash
# build da aplicação
bun run build

# iniciar a aplicação
bun start
```

## 👥 Equipe

- Desenvolvedor - [@caixzn](https://github.com/caixzn)
