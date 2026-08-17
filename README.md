🏷️ ValidaData

> **ValidaData** é uma aplicação desenvolvida para simplificar e otimizar o controle de validade de lotes de produtos (como doces e confeitos) em supermercados e comércios, unindo alta usabilidade e eficiência operacional.

---

## 🎯 O Problema

Em muitos estabelecimentos, a falta de um rastreamento eficiente das datas de vencimento gera dois grandes prejuízos:
1. **Desperdício Financeiro:** Produtos que vencem nas prateleiras ou no estoque e precisam ser descartados.
2. **Margens Reduzidas:** Produtos identificados em cima da hora precisam entrar em promoções agressivas de última hora, que frequentemente não atraem os clientes a tempo.

## 💡 A Solução

O **ValidaData** resolve esse gargalo oferecendo uma interface **rápida, prática e intuitiva**, pensada para que o repositor ou gerente consiga cadastrar e consultar a validade dos lotes em poucos segundos, sem burocracia ou telas complexas.

---

## ✨ Principais Funcionalidades

* 📦 **Gestão Inteligente de Lotes:** Cadastro simplificado de novos lotes com informações essenciais (data de vencimento, quantidade em estoque, localização na loja/estoque).
* 🍬 **Categorização por Segmento:** Organização focada em setores específicos (com destaque para o setor de doces e bomboniere).
* ⏳ **Painel de Alertas de Vencimento:** Visualização clara e prioritária dos produtos mais próximos de vencer, permitindo ações preventivas antes do prazo limite.
* 🔍 **Busca e Filtro Rápido:** Consulta instantânea por nome, lote ou localização para agilizar a rotina de reposição.

---

## 🎨 Foco em Experiência do Usuário (UX/UI)

O **ValidaData** foi desenhado com foco total na usabilidade do dia a dia do operador de mercado:

* ⚡ **Interface Direta e Intuitiva:** Telas limpas, sem excesso de cliques, permitindo o registro de informações em poucos segundos.
* ♿ **Acessibilidade e Leitura Rápida:** Uso de contraste adequado, tipografia legível e hierarquia visual clara para facilitar a checagem no chão de loja.
* 📱 **Navegação Prática:** Fluxo pensado no Figma para minimizar erros manuais durante a digitação e a consulta de lotes.

---

## 🛠️ Tecnologias e Ferramentas

| Categoria | Tecnologia / Ferramenta |
| :--- | :--- |
| **Linguagens & Web** | TypeScript (`.ts`, `.tsx`), JavaScript (`.js`), HTML5, CSS3, JSON |
| **Banco de Dados** | PostgreSQL, DBeaver (Gestão do Banco) |
| **Testes & Protótipo** | Figma (Design & UX/UI), Postman (Testes de API) |
| **IDE & Ambiente** | VS Code (Visual Studio Code) |
| **Inteligência Artificial** | Google AI Studio (Prototipagem e Aceleração de Código) |

---

## 🤖 Uso de IA no Desenvolvimento (Google AI Studio)

> **Transparência Técnica:** A estrutura e a lógica base deste projeto foram desenvolvidas com o auxílio do **Google AI Studio**, utilizado como uma ferramenta de alta produtividade para aceleração do código.

### Meu Papel na Construção do Projeto:
1. **Modelagem de Dados & Arquitetura:** Modelagem do banco de dados no PostgreSQL, gerenciado via DBeaver, e estruturação das rotas/APIs testadas no Postman.
2. **Design de Experiência (UX/UI):** Prototipagem das telas no Figma com foco total na usabilidade, navegabilidade e clareza para o operador no chão de loja.
3. **Engenharia de Prompts:** Mapeamento detalhado dos requisitos e regras de negócio para guiar a geração de código no Google AI Studio.
4. **Validação e Ajustes no VS Code:** Refatoração manual no VS Code em TypeScript (`.tsx`/`.ts`), ajustes de estilização em CSS, correção de bugs e garantia de estabilidade do código gerado.

---

## 🔧 Como Executar o Projeto

### Pré-requisitos
Antes de começar, você precisará ter instalado em sua máquina:
* [Node.js](https://nodejs.org/)
* [PostgreSQL](https://www.postgresql.org/)
* [VS Code](https://code.visualstudio.com/) ou outro editor de sua preferência

### 🚀 Passo a Passo

```bash
# 1. Clone este repositório
$ git clone [https://github.com/seu-usuario/ValidaData.git](https://github.com/seu-usuario/ValidaData.git)

# 2. Acesse a pasta do projeto
$ cd ValidaData

# 3. Instale as dependências
$ npm install

# 4. Configure o banco de dados
# Crie um banco PostgreSQL no DBeaver e rode as migrations/scripts da pasta /database

# 5. Execute a aplicação em modo de desenvolvimento
$ npm run dev

💡 Aprendizados e Desafios
Este projeto permitiu consolidar diversos conhecimentos práticos de desenvolvimento de software e produto:

Foco em UX/UI em Cenários Reais: Compreender a dor do usuário (perda de estoque e margens de lucro reduzidas) e traduzir isso em telas funcionais, simples e limpas no Figma.

Integração de Backend e Banco de Dados: Modelagem e manipulação de tabelas relacionais no PostgreSQL com DBeaver e validação das rotas e requisições via Postman.

Engenharia de Prompts & IA: Aprendizado em como atuar como arquiteto(a) do sistema, utilizando o Google AI Studio para agilizar a escrita de código TypeScript (.tsx) mantendo total controle técnico sobre o resultado final.

✍️ Autor(a)
Desenvolvido por Evelyn Barreto Bastos 👋

Estudante de Análise e Desenvolvimento de Sistemas (ADS).

Em constante busca por aprendizado, aprimoramento técnico e evolução na área de UX/UI e Desenvolvimento de Software.

📄 Licença
Este projeto está sob a licença MIT — consulte o arquivo LICENSE para mais detalhes.
