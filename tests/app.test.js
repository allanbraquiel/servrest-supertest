const request = require("supertest");
const apiUrl = "http://localhost:3003";

let createdUserId;
let createdProductId;
let createdCartId;
let bearerToken;

describe("API ServRest - Login", () => {
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
            bearerToken = response.body.authorization.replace(/^Bearer\s+/i, "")
        });
    });

    it("Realizar Login com falha - Usuário inválido", () => {
        return request(apiUrl)
        .post("/login")
        .send({
            email: "invalido@qa.com",
            password: "senhaerrada",
        })
        .then((response) => {
            expect(401).toBe(response.status);
            expect(response.body).toHaveProperty("message", "Email e/ou senha inválidos");
        });
    });
});

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