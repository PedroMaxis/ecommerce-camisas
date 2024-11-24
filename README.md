# Documentação do Eccomerce de camiseta
Este documento descreve as funcionalidades dos controladores da API do backend, que inclui autenticação, gerenciamento de carrinhos, pedidos e produtos e Instalção do sistema. 

### Certifique-se de que você possui os seguintes softwares instalados:
- **Node.js** (v16 ou superior)
- **npm** (ou **yarn**) para gerenciamento de pacotes
- **Banco de Dados SQLite** (configurado automaticamente)

### Passos de Instalação

1. **Clone o Repositório**
   Baixe o código-fonte do repositório:
   ```bash
   git clone https://github.com/PedroMaxis/ecommerce-camisas.git
   cd ecommerce-camisas   
2. **Instale as dependencias**
   ```bash
   npm install
3. **Configure as Variáveis de Ambiente**
     Crie um arquivo .env na raiz do projeto e adicione as seguintes variáveis:
   ```bash
   PORT=3000
   JWT_SECRET=sua_chave_secreta
3. **Inicie o servidor**
      Inicie o servidor local:
   ```bash
   node server.js
---

## Controladores e Suas Funcionalidades

### 1. AuthController
Responsável pela autenticação de usuários, incluindo registro e login.

#### Endpoints

- Registro de Usuário (`register`)
  Cria um novo usuário no sistema.
  - Método: POST
  - Rota: /auth/register
  - Corpo da Requisição:
    {
      "name": "string",
      "email": "string",
      "password": "string"
    }
  - Resposta:
    Retorna o usuário recém-criado (exceto a senha).

- Login de Usuário (`login`)
  Autentica o usuário e retorna um token JWT.
  - Método: POST
  - Rota: /auth/login
  - Corpo da Requisição:
    {
      "email": "string",
      "password": "string"
    }
  - Resposta:
    {
      "token": "string"
    }

---

### 2. CartController
Gerencia o carrinho de compras do usuário.

#### Endpoints

- Adicionar ao Carrinho (`addToCart`)
  Adiciona ou atualiza itens no carrinho do usuário.
  - Método: POST
  - Rota: /cart/add
  - Corpo da Requisição:
    {
      "productId": "integer",
      "quantity": "integer"
    }
  - Resposta:
    Mensagem confirmando o item adicionado.

- Visualizar Carrinho (`getCart`)
  Recupera o carrinho atual do usuário, incluindo produtos e quantidades.
  - Método: GET
  - Rota: /cart
  - Resposta:
    {
      "id": "integer",
      "UserId": "integer",
      "items": [
        {
          "id": "integer",
          "ProductId": "integer",
          "quantity": "integer",
          "Product": {
            "name": "string",
            "price": "number"
          }
        }
      ]
    }

- Remover do Carrinho (`removeFromCart`)
  Remove um item específico do carrinho do usuário.
  - Método: DELETE
  - Rota: /cart/remove
  - Corpo da Requisição:
    {
      "productId": "integer"
    }
  - Resposta:
    Mensagem confirmando a remoção.

---

### 3. OrderController
Gerencia os pedidos dos usuários.

#### Endpoints

- Criar Pedido (`createOrder`)
  Converte os itens do carrinho em um pedido.
  - Método: POST
  - Rota: /order/create
  - Resposta:
    Retorna os detalhes do pedido criado.

- Listar Pedidos (`getOrders`)
  Lista os pedidos feitos pelo usuário autenticado.
  - Método: GET
  - Rota: /orders
  - Resposta:
    [
      {
        "id": "integer",
        "UserId": "integer",
        "status": "string",
        "totalPrice": "number"
      }
    ]

---

### 4. ProductController
Gerencia os produtos disponíveis para compra.

#### Endpoints

- Criar Produto (`createProduct`)
  Adiciona um novo produto ao sistema.
  - Método: POST
  - Rota: /product/create
  - Corpo da Requisição:
    {
      "name": "string",
      "price": "number"
    }
  - Resposta:
    Retorna os detalhes do produto criado.

- Listar Produtos (`getProducts`)
  Lista todos os produtos disponíveis no sistema.
  - Método: GET
  - Rota: /products
  - Resposta:
    [
      {
        "id": "integer",
        "name": "string",
        "price": "number"
      }
    ]

---

## Observações Gerais

- Autenticação:
  Todas as rotas, exceto as de autenticação, requerem que o usuário esteja autenticado. O token JWT deve ser enviado no cabeçalho da requisição como:
    {
      "Authorization": "Bearer <token>"
    }

- Erros:
  Em caso de erro, as respostas seguem o padrão HTTP, como:
  - 401 Unauthorized: Credenciais inválidas.
  - 404 Not Found: Recurso não encontrado.
  - 400 Bad Request: Requisição malformada.

---

Com essa documentação, você pode utilizar os endpoints da API para gerenciar usuários, carrinhos, pedidos e produtos no sistema.
