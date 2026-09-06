# Duplex Crossword

## Sobre o projeto

O Duplex Crossword é um frontend responsivo de palavras cruzadas voltado para aprendizagem de inglês. A interface foi pensada para simular uma experiência de jogo didático, com pistas em uma coluna lateral, grade principal e navegação por níveis, mantendo o foco em prática de vocabulário e leitura em inglês americano.

A aplicação permite ao usuário:

- preencher palavras cruzadas em uma grade 12x12;
- selecionar pistas para destacar a palavra ativa;
- navegar entre níveis apenas após a conclusão do nível atual;
- validar respostas com a API de níveis;
- continuar usando um puzzle de demonstração caso o backend não esteja disponível.

## Objetivo

O projeto tem como finalidade praticar inglês de forma interativa e visual, combinando o formato clássico de cruzadinha com lógica de progressão por fases.

## Stack utilizada

- React 19
- Vite
- JavaScript
- Tailwind CSS
- Lucide React
- API externa em Node/Serverless (BFF) para carregamento e validação dos níveis

## Estrutura do projeto

```text
.
├── public/
├── src/
│   ├── App.jsx
│   ├── App.css
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── dist/
```

## Como executar localmente

1. Instale as dependências:

```bash
npm install
```

2. Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

3. Abra no navegador:

```text
http://localhost:5173/
```

## API utilizada

O frontend consome o backend publicado em:

```text
https://bff-inglish-learning-crossword.vercel.app
```

Endpoints principais:

- `POST /crosswords/levels/:level` — carrega o puzzle do nível solicitado.
- `POST /crosswords/levels/:level/validate` — valida as respostas enviadas pelo usuário.

Se a API estiver indisponível, a aplicação carrega um puzzle de demonstração do nível 1 para manter a interface navegável.

## Build e preview

Para validar o projeto em produção:

```bash
npm run build
npm run preview
```

O comando `npm run build` gera a pasta `dist`, pronta para deploy.

## Deploy

### Vercel

1. Acesse o painel da Vercel.
2. Clique em "Add Project".
3. Importe este repositório.
4. Selecione a pasta raiz do projeto.
5. Mantenha as configurações padrão do Vite.
6. Clique em "Deploy".

A Vercel detecta automaticamente o projeto Vite e usa o comando:

```bash
npm run build
```

como etapa de build, publicando a pasta `dist` em produção.

### Deploy manual local

Você também pode gerar o pacote de produção localmente:

```bash
npm run build
```

Em seguida, publique a pasta `dist` em qualquer serviço estático compatível com Vite, como Vercel, Netlify ou Cloudflare Pages.

## Observações

- O layout é responsivo para desktop e telas menores.
- As pistas e respostas estão em inglês americano.
- A progressão entre níveis depende da validação do nível atual.
