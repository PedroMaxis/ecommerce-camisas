E-commerce Backend API
Este é o backend de uma plataforma de e-commerce simples, desenvolvido com Node.js, Express, SQLite e Sequelize. A API permite que usuários se cadastrem, façam login, naveguem por produtos, e que administradores adicionem e gerenciem produtos.

Funcionalidades Principais
Cadastro de Usuário - Permite o registro de novos usuários.
Autenticação JWT - Realiza login e gera um token JWT para autenticação.
Gerenciamento de Produtos - Permite listar e adicionar produtos, com acesso restrito para criação de produtos.
Controle de Acesso - Middleware de permissões para proteger rotas específicas, garantindo que apenas administradores possam gerenciar produtos.
Segurança - Criptografia de senhas com bcrypt e uso de variáveis de ambiente para proteger dados sensíveis.
Tecnologias Utilizadas
Node.js e Express para o servidor.
SQLite como banco de dados.
Sequelize como ORM para modelagem de dados.
JWT (JSON Web Tokens) para autenticação.
bcrypt para criptografar senhas.
dotenv para variáveis de ambiente.
CORS para segurança de requisições.
Configuração
Clone o repositório e instale as dependências:

bash
Copy code
git clone https://github.com/seu-usuario/ecommerce-backend.git
cd ecommerce-backend
npm install
Configure o arquivo .env com:

plaintext
Copy code
JWT_SECRET=your_jwt_secret_key
PORT=3000
Inicie o servidor:

bash
Copy code
npx nodemon server.js
Endpoints da API
Autenticação
POST /api/auth/register - Cadastro de um novo usuário.
POST /api/auth/login - Login de um usuário.
Produtos
GET /api/products - Lista todos os produtos disponíveis.
POST /api/products - Cria um novo produto (restrito a administradores).
Autenticação e Controle de Acesso
Esta API utiliza JWT para autenticação. Após o login, o usuário recebe um token JWT que deve ser incluído no cabeçalho das requisições para acessar rotas protegidas. Apenas usuários com a role admin podem adicionar produtos.

Segurança
CORS: Ativado para segurança das requisições.
Variáveis de ambiente: Configure JWT_SECRET no arquivo .env para proteção de dados sensíveis.
Criptografia de Senha: Utiliza bcrypt para armazenar senhas de maneira segura.
Melhorias Futuras
Gerenciamento de Pedidos: Implementar criação e visualização de pedidos para os usuários.
Carrinho de Compras: Desenvolver endpoints para um sistema de carrinho de compras.
Pagamentos: Integrar com APIs de pagamento para processar transações.