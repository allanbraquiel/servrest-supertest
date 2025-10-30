const request = require("supertest");
const apiUrl = "http://localhost:3000";

let createdUserId;
let createdProductId;
let createdCartId;
let bearerToken;

describe("Teste completo do fluxo de compra", () => {

  it("Cadastrar Usuário", () => {
    return request(apiUrl)
      .post("/usuarios")
      .send({
        nome: `Usuário Teste+${Date.now()}`,
        email: `teste+${Date.now()}@exemplo.com`,
        password: "senha123",
        administrador: "false",
      })
      .then((response) => {
        expect(201).toBe(response.status);
        expect(response.body).toHaveProperty(
          "message",
          "Cadastro realizado com sucesso"
        );

        const id = response.body._id;
        expect(id).toBeDefined();
        createdUserId = id;
      });
  });

  it("Realizar Login com sucesso", () => {
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

  it("Cadastrar Produto", () => {
    return request(apiUrl)
      .post("/produtos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        nome: `Produto Teste+${Date.now()}`,
        preco: 100,
        descricao: `Descrição do Produto Teste+${Date.now()}`,
        quantidade: 10,
      })
      .then((response) => {
        expect(201).toBe(response.status);
        expect(response.body).toHaveProperty("_id");
        expect(response.body).toHaveProperty(
          "message",
          "Cadastro realizado com sucesso"
        );

        const id = response.body._id;
        expect(id).toBeDefined();
        createdProductId = id;
      });
  });

  it("Consultar produto cadastrado", () => {
    return request(apiUrl)
      .get(`/produtos/${createdProductId}`)
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty("nome");
        expect(response.body).toHaveProperty("preco");
        expect(response.body).toHaveProperty("descricao");
        expect(response.body).toHaveProperty("quantidade");
        expect(response.body).toHaveProperty("_id");
      });
  });

  it('Incluir produto no carrinho', () => {
    return request(apiUrl)
      .post("/carrinhos")
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        produtos: [
          {
            idProduto: "BeeJh5lz3k6kSIzA",
            quantidade: 2,
          },
        ],
      })
      .then((response) => {
        expect(201).toBe(response.status);
        expect(response.body).toHaveProperty("_id");
        expect(response.body).toHaveProperty(
          "message",
          "Cadastro realizado com sucesso"
        );

        const id = response.body._id;
        expect(id).toBeDefined();
        createdCartId = id;
      });
  });

  it('Consultar o carrinho', () => {
    return request(apiUrl)
      .get(`/carrinhos/${createdCartId}`)
      .set('Authorization', `Bearer ${bearerToken}`)
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty("_id");
        expect(response.body).toHaveProperty("produtos");
      });
  });

  it('Concluir compra', () => {
    return request(apiUrl)
      .delete(`/carrinhos/concluir-compra`)
      .set('Authorization', `Bearer ${bearerToken}`)
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty(
          "message",
          "Registro excluído com sucesso"
        );
      });
  });
});