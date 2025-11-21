const request = require("supertest");
const Joi = require('joi')
const apiUrl = "http://localhost:3000";

let createdUserId;
let bearerToken;


// Schema Joi para validar estrutura do usuário
const usuarioSchema = Joi.object({
  nome: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  administrador: Joi.string().valid('true', 'false').required(),
  _id: Joi.string().required()
});


// Schema para a resposta da listagem de usuários
const listaUsuariosSchema = Joi.object({
  quantidade: Joi.number().required(),
  usuarios: Joi.array().items(usuarioSchema).required()
});

// Helpers reutilizáveis
function validarUsuario(usuario) {
  const { error } = usuarioSchema.validate(usuario);
  expect(error).toBeUndefined();
}

function validarListaUsuarios(body) {
  const { error } = listaUsuariosSchema.validate(body);
  expect(error).toBeUndefined();
  // garantir que quantidade corresponde ao tamanho do array
  expect(body.quantidade).toBe(body.usuarios.length);
}



describe("API ServRest - Usuários", () => {

  it("Cadastrar Usuário", async () => {
    const nome = `Usuário Teste ${Date.now()}`;
    const email = `teste+${Date.now()}@exemplo.com`;

    const resCreate = await request(apiUrl)
      .post("/usuarios")
      .send({
        nome,
        email,
        password: "senha123",
        administrador: "false",
      });

    expect(201).toBe(resCreate.status);
    expect(resCreate.body).toHaveProperty(
      "message",
      "Cadastro realizado com sucesso"
    );

    const id = resCreate.body._id;
    expect(id).toBeDefined();
    createdUserId = id;

    // Buscar e validar o usuário criado
    const resGet = await request(apiUrl).get(`/usuarios/${createdUserId}`);
    expect(200).toBe(resGet.status);
    validarUsuario(resGet.body);
    expect(resGet.body.nome).toBe(nome);
    expect(resGet.body.email).toBe(email);
  });

  it("Consultar usuário cadastrado", async () => {
    const response = await request(apiUrl).get(`/usuarios/${createdUserId}`);
    expect(200).toBe(response.status);
    validarUsuario(response.body);
  });

  it("Consultar usuário inválido", async () => {
    const response = await request(apiUrl).get(`/usuarios/0uxuPY0cbmQhpEz2`);
    expect(400).toBe(response.status);
    expect(response.body).toHaveProperty("message", "Usuário não encontrado");
    expect(typeof response.body.message).toBe("string");
  });

  it("Atualizar usuário cadastrado", async () => {
    const newNome = "Usuário Teste Atualizado";
    const newEmail = `teste.atualizado+${Date.now()}@exemplo.com`;

    const resPut = await request(apiUrl)
      .put(`/usuarios/${createdUserId}`)
      .send({
        nome: newNome,
        email: newEmail,
        password: "senha1234",
        administrador: "true",
      });

    expect(200).toBe(resPut.status);
    expect(resPut.body).toHaveProperty("message", "Registro alterado com sucesso");

    const resGet = await request(apiUrl).get(`/usuarios/${createdUserId}`);
    expect(200).toBe(resGet.status);
    validarUsuario(resGet.body);
    expect(resGet.body.nome).toBe(newNome);
    expect(resGet.body.email).toBe(newEmail);
    expect(resGet.body.administrador).toBe("true");
  });

  it("Deletar usuário cadastrado", async () => {
    const resDelete = await request(apiUrl).delete(`/usuarios/${createdUserId}`);
    expect(200).toBe(resDelete.status);
    expect(resDelete.body).toHaveProperty("message", "Registro excluído com sucesso");

    const resGetAfterDelete = await request(apiUrl).get(`/usuarios/${createdUserId}`);
    // depende da API: pode retornar 400 ou 404 para não encontrado
    expect([400, 404]).toContain(resGetAfterDelete.status);
  });

  it("Listar Usuarios", async () => {
    const response = await request(apiUrl).get("/usuarios");
    expect(200).toBe(response.status);
    validarListaUsuarios(response.body);
    response.body.usuarios.forEach(validarUsuario);
  });

  it("Usuarios (estrutura e conteúdo)", async () => {
    const response = await request(apiUrl).get("/usuarios");
    expect(response.status).toBe(200);
    validarListaUsuarios(response.body);

    if (response.body.usuarios.length > 0) {
      validarUsuario(response.body.usuarios[0]);
    }
  });
});