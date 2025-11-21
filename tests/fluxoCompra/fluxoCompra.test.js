const request = require("supertest");
const Joi = require('joi');
const apiUrl = "http://localhost:3000";

let createdUserId;
let createdProductId;
let createdCartId;
let bearerToken;

// Schemas e helpers
const usuarioSchema = Joi.object({
  nome: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  administrador: Joi.string().valid('true','false').required(),
  _id: Joi.string().required()
}).unknown(true);

const produtoSchema = Joi.object({
  nome: Joi.string().required(),
  preco: Joi.number().required(),
  descricao: Joi.string().required(),
  quantidade: Joi.number().required(),
  _id: Joi.string().required()
}).unknown(true);

const itemProdutoSchema = Joi.object({
  idProduto: Joi.string().required(),
  quantidade: Joi.number().required(),
  precoUnitario: Joi.number().optional()
}).unknown(true);

const carrinhoSchema = Joi.object({
  produtos: Joi.array().items(itemProdutoSchema).required(),
  _id: Joi.string().required(),
  precoTotal: Joi.number().optional()
}).unknown(true);

function validarUsuario(u) {
  const { error } = usuarioSchema.validate(u);
  expect(error).toBeUndefined();
}
function validarProduto(p) {
  const { error } = produtoSchema.validate(p);
  expect(error).toBeUndefined();
}
function validarCarrinho(c) {
  const { error } = carrinhoSchema.validate(c);
  expect(error).toBeUndefined();
}

describe("Fluxo de compra: concluir compra", () => {

  it("Cadastrar Usuário", async () => {
    const nome = `Usuário Teste ${Date.now()}`;
    const email = `teste${Date.now()}@exemplo.com`;

    const res = await request(apiUrl)
      .post("/usuarios")
      .send({
        nome,
        email,
        password: "senha123",
        administrador: "false",
      });

    expect(201).toBe(res.status);
    expect(res.body).toHaveProperty("message", "Cadastro realizado com sucesso");
    createdUserId = res.body._id;
    expect(createdUserId).toBeDefined();

    const resGet = await request(apiUrl).get(`/usuarios/${createdUserId}`);
    expect(200).toBe(resGet.status);
    validarUsuario(resGet.body);
    expect(resGet.body.nome).toBe(nome);
    expect(resGet.body.email).toBe(email);
  });

  it("Realizar Login com sucesso", async () => {
    const response = await request(apiUrl)
      .post("/login")
      .send({ email: "fulano@qa.com", password: "teste" });

    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Login realizado com sucesso");
    expect(response.body).toHaveProperty("authorization");
    bearerToken = typeof response.body.authorization === 'string'
      ? response.body.authorization.replace(/^Bearer\s+/i, '')
      : response.body.authorization;
  });

  it("Cadastrar Produto", async () => {
    const nome = `Produto Teste ${Date.now()}`;
    const descricao = `Descrição do Produto Teste ${Date.now()}`;

    const res = await request(apiUrl)
      .post("/produtos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ nome, preco: 100, descricao, quantidade: 200 });

    expect(201).toBe(res.status);
    createdProductId = res.body._id;
    expect(createdProductId).toBeDefined();

    const resGet = await request(apiUrl).get(`/produtos/${createdProductId}`);
    expect(200).toBe(resGet.status);
    validarProduto(resGet.body);
    expect(resGet.body.nome).toBe(nome);
  });

  it("Consultar produto cadastrado", async () => {
    const response = await request(apiUrl).get(`/produtos/${createdProductId}`);
    expect(200).toBe(response.status);
    validarProduto(response.body);
  });

  it('Incluir produto no carrinho', async () => {
    const produtoId = createdProductId || "BeeJh5lz3k6kSIzA";

    const res = await request(apiUrl)
      .post("/carrinhos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ produtos: [{ idProduto: produtoId, quantidade: 100 }] });

    expect(201).toBe(res.status);
    createdCartId = res.body._id;
    expect(createdCartId).toBeDefined();

    const resGet = await request(apiUrl).get(`/carrinhos/${createdCartId}`).set('Authorization', `Bearer ${bearerToken}`);
    expect(200).toBe(resGet.status);
    validarCarrinho(resGet.body);
    expect(resGet.body.produtos[0].idProduto).toBe(produtoId);
  });

  it('Consultar o carrinho', async () => {
    const response = await request(apiUrl).get(`/carrinhos/${createdCartId}`).set('Authorization', `Bearer ${bearerToken}`);
    expect(200).toBe(response.status);
    validarCarrinho(response.body);
  });

  it('Concluir compra', async () => {
    const response = await request(apiUrl)
      .delete(`/carrinhos/concluir-compra`)
      .set('Authorization', `Bearer ${bearerToken}`);

    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Registro excluído com sucesso");

    const after = await request(apiUrl).get(`/carrinhos/${createdCartId}`);
    expect([400,404]).toContain(after.status);
  });

  it("Deletar produto cadastrado", async () => {
    const response = await request(apiUrl)
      .delete(`/produtos/${createdProductId}`)
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Registro excluído com sucesso");
  });

  it("Deletar usuário cadastrado", async () => {
    const response = await request(apiUrl).delete(`/usuarios/${createdUserId}`);
    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Registro excluído com sucesso");
  });
});

describe("Fluxo de compra: cancelar compra", () => {

  it("Cadastrar Usuário", async () => {
    const nome = `Usuário Teste+${Date.now()}`;
    const email = `teste+${Date.now()}@exemplo.com`;

    const res = await request(apiUrl)
      .post("/usuarios")
      .send({ nome, email, password: "senha123", administrador: "false" });

    expect(201).toBe(res.status);
    createdUserId = res.body._id;
    expect(createdUserId).toBeDefined();

    const resGet = await request(apiUrl).get(`/usuarios/${createdUserId}`);
    expect(200).toBe(resGet.status);
    validarUsuario(resGet.body);
  });

  it("Realizar Login com sucesso", async () => {
    const response = await request(apiUrl)
      .post("/login")
      .send({ email: "fulano@qa.com", password: "teste" });

    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("authorization");
    bearerToken = typeof response.body.authorization === 'string'
      ? response.body.authorization.replace(/^Bearer\s+/i, '')
      : response.body.authorization;
  });

  it("Cadastrar Produto", async () => {
    const nome = `Produto Teste ${Date.now()}`;
    const descricao = `Descrição do Produto Teste ${Date.now()}`;

    const res = await request(apiUrl)
      .post("/produtos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ nome, preco: 100, descricao, quantidade: 10 });

    expect(201).toBe(res.status);
    createdProductId = res.body._id;
    expect(createdProductId).toBeDefined();

    const resGet = await request(apiUrl).get(`/produtos/${createdProductId}`);
    expect(200).toBe(resGet.status);
    validarProduto(resGet.body);
  });

  it("Consultar produto cadastrado", async () => {
    const response = await request(apiUrl).get(`/produtos/${createdProductId}`);
    expect(200).toBe(response.status);
    validarProduto(response.body);
  });

  it('Incluir produto no carrinho', async () => {
    const produtoId = "BeeJh5lz3k6kSIzA";

    const res = await request(apiUrl)
      .post("/carrinhos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ produtos: [{ idProduto: produtoId, quantidade: 2 }] });

    expect(201).toBe(res.status);
    createdCartId = res.body._id;
    expect(createdCartId).toBeDefined();

    const resGet = await request(apiUrl).get(`/carrinhos/${createdCartId}`).set('Authorization', `Bearer ${bearerToken}`);
    expect(200).toBe(resGet.status);
    validarCarrinho(resGet.body);
  });

  it('Consultar o carrinho', async () => {
    const response = await request(apiUrl).get(`/carrinhos/${createdCartId}`).set('Authorization', `Bearer ${bearerToken}`);
    expect(200).toBe(response.status);
    validarCarrinho(response.body);
  });

  it('Cancelar compra', async () => {
    const response = await request(apiUrl)
      .delete(`/carrinhos/cancelar-compra`)
      .set('Authorization', `Bearer ${bearerToken}`);

    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Registro excluído com sucesso. Estoque dos produtos reabastecido");

    const after = await request(apiUrl).get(`/carrinhos/${createdCartId}`);
    expect([400,404]).toContain(after.status);
  });

  it("Deletar produto cadastrado", async () => {
    const response = await request(apiUrl)
      .delete(`/produtos/${createdProductId}`)
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Registro excluído com sucesso");
  });

  it("Deletar usuário cadastrado", async () => {
    const response = await request(apiUrl).delete(`/usuarios/${createdUserId}`);
    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Registro excluído com sucesso");
  });
});