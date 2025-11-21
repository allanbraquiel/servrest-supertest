const request = require("supertest");
const Joi = require('joi');
const apiUrl = "http://localhost:3000";

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

describe("API ServRest - Carrinhos", () => {
  // Faz login e popula bearerToken antes dos it() deste describe
  beforeAll(() => {
    return request(apiUrl)
      .post("/login")
      .send({
        email: "fulano@qa.com",
        password: "teste",
      })
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty(
          "message",
          "Login realizado com sucesso"
        );
        expect(response.body).toHaveProperty("authorization");
        bearerToken = response.body.authorization.replace(/^Bearer\s+/i, "");
      });
  });

  it("Cadastrar Carrinho", async () => {
    const produtoId = "BeeJh5lz3k6kSIzA";

    const resCreate = await request(apiUrl)
      .post("/carrinhos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        produtos: [
          {
            idProduto: produtoId,
            quantidade: 100,
          },
        ],
      });

    expect(201).toBe(resCreate.status);
    expect(resCreate.body).toHaveProperty("_id");
    expect(resCreate.body).toHaveProperty("message", "Cadastro realizado com sucesso");

    const id = resCreate.body._id;
    expect(id).toBeDefined();
    createdCartId = id;

    // Validar via GET
    const resGet = await request(apiUrl).get(`/carrinhos/${createdCartId}`);
    expect(200).toBe(resGet.status);
    validarCarrinho(resGet.body);
    expect(Array.isArray(resGet.body.produtos)).toBe(true);
    expect(resGet.body.produtos[0].idProduto).toBe(produtoId);
    expect(resGet.body.produtos[0].quantidade).toBe(100);
  });

   it("Consultar Carrinhos", async () => {
     const response = await request(apiUrl).get(`/carrinhos/${createdCartId}`);
     expect(200).toBe(response.status);
     validarCarrinho(response.body);
   });

  it("Concluir compra", async () => {
    const response = await request(apiUrl)
      .delete(`/carrinhos/concluir-compra`)
      .set("Authorization", `Bearer ${bearerToken}`);

    expect(200).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Registro excluído com sucesso");

    // Após concluir a compra, o carrinho criado deve não existir mais
    const resGetAfter = await request(apiUrl).get(`/carrinhos/${createdCartId}`);
    expect([400, 404]).toContain(resGetAfter.status);
  });
});