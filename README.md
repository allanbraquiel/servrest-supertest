# ServRest - Testes automatizados (SuperTest + Jest)

Este repositório contém testes automatizados para a API ServRest, usando `supertest` e `jest`.

## Visão geral

- Testes em: `tests/`
- Frameworks: `jest` (test runner) e `supertest` (requisições HTTP)
- Validações com: `joi`
- A URL base usada nos testes é `http://localhost:3000` (definida nos arquivos de teste).

> Atenção: o repositório contém apenas os testes; a API ServRest precisa estar em execução localmente para os testes funcionarem.

## Pré-requisitos

- Node.js (recomendado v14+)
- Git
- A API ServRest rodando em `http://localhost:3000` (ou alterar `apiUrl` nos testes)

## Como clonar

```bash
git clone <repo-url>
cd servrest-supertest
```

## Instalar dependências

```bash
npm install
```

Observação: o `package.json` do projeto define `"test": "test"`. Se `npm test` não executar os testes, use diretamente o `jest` via `npx` ou o binário local:

```bash
npx jest
# ou
./node_modules/.bin/jest
```

## Executar todos os testes

Recomendo usar:

```bash
npx jest
```

Executar testes de uma pasta específica:

```bash
npx jest tests/carrinho
npx jest tests/produtos
npx jest tests/usuarios
```

Executar um teste por nome (ex.: rodar apenas o `API ServRest - Carrinhos`):

```bash
npx jest -t "API ServRest - Carrinhos"
```

## Configurações importantes nos testes

- A URL base está na variável `apiUrl` no topo de cada arquivo de teste (ex.: `tests/carrinho/carrinho.test.js`).
- Os testes fazem um `POST /login` para obter `authorization` (Bearer token). O corpo esperado do login é:
  ```json
  { "email": "fulano@qa.com", "password": "teste" }
  ```
  e a resposta esperada contém `authorization` e `message: "Login realizado com sucesso"`.

- Endpoints usados nos testes (resumo):
  - `POST /login` — autenticação (retorna `authorization`)
  - `POST /carrinhos` — cadastrar carrinho (body: `produtos: [{ idProduto, quantidade }]`)
  - `GET /carrinhos/:id` — consultar carrinho
  - `DELETE /carrinhos/concluir-compra` — concluir compra (usa Authorization)

- Mensagens e respostas esperadas (exemplos):
  - Login: `"Login realizado com sucesso"`
  - Cadastro de carrinho: `"Cadastro realizado com sucesso"` e retorno de `_id`
  - Conclusão: `"Registro excluído com sucesso"` (os testes aceitam múltiplas variações de mensagens)

## Dicas de troubleshooting

Se os testes falharem com status 400/401/404, verifique:

- Se a API ServRest está rodando e acessível em `http://localhost:3000`.
- Se as credenciais de login usadas nos testes existem na base de dados da API.
- Se o `idProduto` usado nos testes existe e está disponível (ex.: `BeeJh5lz3k6kSIzA`).
- Se o token retornado pelo `/login` está no formato esperado (`Bearer ...`).
- Mensagens de erro retornadas pela API aparecem no corpo da resposta; verifique-as para entender validações da API.

## Como contribuir

- Leia os testes existentes em `tests/` para entender o estilo e convenções.
- Adicione novos testes em `tests/<area>/nome.test.js` seguindo o padrão.
- Antes de submeter PR, rode `npx jest` localmente e corrija falhas.
- Se desejar, atualize `package.json` para facilitar execução (ex.: alterar `scripts.test` para `jest`).

Exemplo sugerido para `package.json` (opcional):
```json
"scripts": {
  "test": "jest"
}
```

## Observações finais

- O objetivo deste repositório é testar uma API externa (`ServRest`). Os testes assumem comportamento e mensagens específicas da API — se a API mudar, os testes devem ser atualizados.
