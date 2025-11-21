const request = require("supertest");
const Joi = require('joi');
const apiUrl = "http://localhost:3000";

let createdProductId;
let bearerToken;

// Schemas e helpers para validação
const produtoSchema = Joi.object({
  nome: Joi.string().required(),
  preco: Joi.number().required(),
  descricao: Joi.string().required(),
  quantidade: Joi.number().required(),
  _id: Joi.string().required()
});

const listaProdutosSchema = Joi.object({
  quantidade: Joi.number().required(),
  produtos: Joi.array().items(produtoSchema).required()
});

function validarProduto(produto) {
  const { error } = produtoSchema.validate(produto);
  expect(error).toBeUndefined();
}

function validarListaProdutos(body) {
  const { error } = listaProdutosSchema.validate(body);
  expect(error).toBeUndefined();
  expect(body.quantidade).toBe(body.produtos.length);
}

describe("API ServRest - Produtos", () => {
  // Faz login e popula bearerToken antes dos it() deste describe
   beforeAll(() => {
     return request(apiUrl)
       .post("/login")
       .send({ email: "fulano@qa.com", password: "teste" })
       .then((res) => {
         expect(res.status).toBe(200);
         // tenta vários campos comuns onde o token pode estar
        const auth = res.body.authorization;
        expect(auth).toBeDefined();
        bearerToken = typeof auth === "string" ? auth.replace(/^Bearer\s+/i, "") : auth;

       });
   });

  it("Cadastrar Produto", async () => {
    const nome = `Produto Teste ${Date.now()}`;
    const descricao = `Descrição do Produto Teste ${Date.now()}`;

    const resCreate = await request(apiUrl)
      .post("/produtos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        nome,
        preco: 100,
        descricao,
        quantidade: 10,
      });

    expect(201).toBe(resCreate.status);
    expect(resCreate.body).toHaveProperty("_id");
    expect(resCreate.body).toHaveProperty("message", "Cadastro realizado com sucesso");

    const id = resCreate.body._id;
    expect(id).toBeDefined();
    createdProductId = id;

    // Validar via GET
    const resGet = await request(apiUrl).get(`/produtos/${createdProductId}`);
    expect(200).toBe(resGet.status);
    validarProduto(resGet.body);
    expect(resGet.body.nome).toBe(nome);
    expect(resGet.body.descricao).toBe(descricao);
    expect(resGet.body.preco).toBe(100);
    expect(resGet.body.quantidade).toBe(10);
  });

  it("Consultar produto cadastrado", async () => {
    const response = await request(apiUrl).get(`/produtos/${createdProductId}`);
    expect(200).toBe(response.status);
    validarProduto(response.body);
  });

  it("Listar Produtos", async () => {
    const response = await request(apiUrl).get("/produtos");
    expect(200).toBe(response.status);
    validarListaProdutos(response.body);
    response.body.produtos.slice(0, 5).forEach(validarProduto);
  });

  it("Atualizar produto cadastrado", async () => {
    const newNome = `Produto Teste Atualizado`;

    const resPut = await request(apiUrl)
      .put(`/produtos/${createdProductId}`)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        nome: newNome,
        preco: 150,
        descricao: `Descrição do Produto Teste Atualizado`,
        quantidade: 20,
      });

    expect(200).toBe(resPut.status);
    expect(resPut.body).toHaveProperty("message", "Registro alterado com sucesso");

    const resGet = await request(apiUrl).get(`/produtos/${createdProductId}`);
    expect(200).toBe(resGet.status);
    validarProduto(resGet.body);
    expect(resGet.body.nome).toBe(newNome);
    expect(resGet.body.preco).toBe(150);
    expect(resGet.body.quantidade).toBe(20);
  });

  it("Deletar produto cadastrado", async () => {
    const resDelete = await request(apiUrl)
      .delete(`/produtos/${createdProductId}`)
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(200).toBe(resDelete.status);
    expect(resDelete.body).toHaveProperty("message", "Registro excluído com sucesso");

    const resGetAfterDelete = await request(apiUrl).get(`/produtos/${createdProductId}`);
    expect([400, 404]).toContain(resGetAfterDelete.status);
  });

  it("Produtos (estrutura e conteúdo)", async () => {
    const response = await request(apiUrl).get("/produtos");
    expect(response.status).toBe(200);
    validarListaProdutos(response.body);

    if (response.body.produtos.length > 0) {
      validarProduto(response.body.produtos[0]);
    }
  });
});