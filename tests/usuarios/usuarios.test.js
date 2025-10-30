const request = require("supertest");
const apiUrl = "http://localhost:3000";

let createdUserId;
let bearerToken;


describe("API ServRest - Usuários", () => {

  it("Cadastrar Usuário", () => {
    return request(apiUrl)
      .post("/usuarios")
      .send({
        nome: `Usuário Teste + ${Date.now()}`,
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

  it("Consultar usuário cadastrado", () => {
    return request(apiUrl)
      .get(`/usuarios/${createdUserId}`)
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty("nome");
        expect(response.body).toHaveProperty("email");
        expect(response.body).toHaveProperty("administrador");
      });
  });

  it("Consultar usuário inválido", () => {
    return request(apiUrl)
      .get(`/usuarios/0uxuPY0cbmQhpEz2`)
      .then((response) => {
        expect(400).toBe(response.status);
        expect(response.body).toHaveProperty(
          "message", "Usuário não encontrado"
        );
      });
  });

  it("Atualizar usuário cadastrado", () => {
    return request(apiUrl)
      .put(`/usuarios/${createdUserId}`)
      .send({
        nome: "Usuário Teste Atualizado",
        email: `teste.atualizado+${Date.now()}@exemplo.com`,
        password: "senha1234",
        administrador: "true",
      })
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty(
          "message", "Registro alterado com sucesso"
        );
      });
  });

  it("Deletar usuário cadastrado", () => {
    return request(apiUrl)
      .delete(`/usuarios/${createdUserId}`)
      .then((response) => {
        expect(200).toBe(response.status);
        expect(response.body).toHaveProperty(
          "message", "Registro excluído com sucesso"
        );
      });
  });

  it("Listar Usuarios", () => {
    return request(apiUrl)
      .get("/usuarios")
      .then((response) => {
        expect(200).toBe(response.status);
      });
  });

  it("Usuarios (estrutura e conteúdo)", async () => {
    const response = await request(apiUrl).get("/usuarios");
    expect(response.status).toBe(200);

    const body = response.body;

    // Estrutura principal
    expect(body).toHaveProperty("quantidade");
    expect(body).toHaveProperty("usuarios");
    // validações para o primeiro usuário, caso exista
    if (body.usuarios.length > 0) {
      const user = body.usuarios[0];

      // Validação das propriedades
      expect(user).toHaveProperty("nome");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("password");
      expect(user).toHaveProperty("administrador");
      expect(user).toHaveProperty("_id");

      // Validação dos tipos de dados
      expect(typeof user.nome).toBe("string");
      expect(typeof user.email).toBe("string");
      expect(typeof user.password).toBe("string");
      expect(typeof user.administrador).toBe("string");
      expect(typeof user._id).toBe("string");
    }
  });
});