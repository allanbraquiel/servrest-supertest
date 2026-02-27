const request = require("supertest");
const Joi = require('joi');
const apiUrl = "http://localhost:3000";

let createdProductId;
let createdCartId;
let bearerToken;

// Schemas e helpers
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

function validarCarrinho(carrinho) {
  const { error } = carrinhoSchema.validate(carrinho);
  expect(error).toBeUndefined();
}

function validarProduto(p) {
  const { error } = produtoSchema.validate(p);
  expect(error).toBeUndefined();
}

const produtoSchema = Joi.object({
  nome: Joi.string().required(),
  preco: Joi.number().required(),
  descricao: Joi.string().required(),
  quantidade: Joi.number().required(),
  _id: Joi.string().required()
}).unknown(true);

describe("API ServRest - Carrinhos", () => {
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

  it("Cadastrar Carrinho", async () => {
    const produtoId = createdProductId || "BeeJh5lz3k6kSIzA";
    
    const res = await request(apiUrl)
      .post("/carrinhos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({ produtos: [{ idProduto: produtoId, quantidade: 100 }] });

    expect(201).toBe(res.status);
    createdCartId = res.body._id;
    expect(createdCartId).toBeDefined();

    const resGet = await request(apiUrl).get(`/carrinhos/${createdCartId}`);
    expect(resGet.status).toBe(200);
    validarCarrinho(resGet.body);
    expect(Array.isArray(resGet.body.produtos)).toBe(true);
    expect(resGet.body.produtos[0].idProduto).toBe(produtoId);
    expect(resGet.body.produtos[0].quantidade).toBe(100);
  });

  it("Consultar Carrinhos", async () => {
    const response = await request(apiUrl).get(`/carrinhos/${createdCartId}`);
    expect(response.status).toBe(200);
    validarCarrinho(response.body);
  });

  it("Concluir compra", async () => {
    const response = await request(apiUrl)
      .delete(`/carrinhos/concluir-compra`)
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(response.status).toBe(200);
    
    const allowed = [
      "Registro excluído com sucesso",
      "Carrinho finalizado com sucesso",
      "Não foi encontrado carrinho para esse usuário",      
    ];

    expect(response.body).toHaveProperty("message");
    expect(allowed).toContain(response.body.message);

    // Após concluir a compra, o carrinho criado deve não existir mais
    const resGetAfter = await request(apiUrl).get(`/carrinhos/${createdCartId}`);
    expect([400, 404]).toContain(resGetAfter.status);
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
});