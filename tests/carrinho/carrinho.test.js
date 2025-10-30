const request = require("supertest");
const apiUrl = "http://localhost:3000";

let createdCartId;
let bearerToken;



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

  it("Cadastrar Carrinho", () => {
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

   it("Consultar Carrinhos", () => {
     return request(apiUrl)
       .get(`/carrinhos/${createdCartId}`)
       .then((response) => {
         expect(200).toBe(response.status);
       });
   });

  it("Concluir compra", () => {
    return request(apiUrl)
      .delete(`/carrinhos/concluir-compra`)
      .set("Authorization", `Bearer ${bearerToken}`)
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty(
          "message",
          "Registro excluído com sucesso"
        );
      });
  });
});