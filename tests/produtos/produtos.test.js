const request = require("supertest");
const apiUrl = "http://localhost:3000";

let createdProductId;
let bearerToken;

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

  it("Listar Produtos", () => {
    return request(apiUrl)
      .get("/produtos")
      .then((response) => {
        expect(200).toBe(response.status);
      });
  });

  it("Atualizar produto cadastrado", () => {
    return request(apiUrl)
      .put(`/produtos/${createdProductId}`)
      .set("Authorization", `Bearer ${bearerToken}`)
      .send({
        nome: `Produto Teste Atualizado`,
        preco: 150,
        descricao: `Descrição do Produto Teste Atualizado`,
        quantidade: 20,
      })
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty(
           "message", "Registro alterado com sucesso"
        );
      });
  });

  it("Deletar produto cadastrado", () => {
    return request(apiUrl)
      .delete(`/produtos/${createdProductId}`)
      .set("Authorization", `Bearer ${bearerToken}`)
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty(
          "message", "Registro excluído com sucesso"
        );
      });
  });

  it("Produtos (estrutura e conteúdo)", async () => {
    const response = await request(apiUrl).get("/produtos");
    expect(response.status).toBe(200);

    const body = response.body;

    // Estrutura principal
    expect(body).toHaveProperty("quantidade");
    expect(body).toHaveProperty("produtos");
    // validações para o primeiro produto, caso exista
    if (body.produtos.length > 0) {
      const product = body.produtos[0];

      // Validação das propriedades
      expect(product).toHaveProperty("nome");
      expect(product).toHaveProperty("preco");
      expect(product).toHaveProperty("descricao");
      expect(product).toHaveProperty("quantidade");
      expect(product).toHaveProperty("_id");

      // Validação dos tipos de dados
      expect(typeof product.nome).toBe("string");
      expect(typeof product.preco).toBe("number");
      expect(typeof product.descricao).toBe("string");
      expect(typeof product.quantidade).toBe("number");
      expect(typeof product._id).toBe("string");
    }
  });
});