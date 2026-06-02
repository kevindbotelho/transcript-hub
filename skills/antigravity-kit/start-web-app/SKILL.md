---
name: start-web-app
description: Skill para fundar um novo projeto de webapp do zero com IA. Use quando o usuário quiser começar um novo projeto web, precisar montar a fundação antes de codar, ou quiser definir PRD, stack, estrutura e convenções antes da primeira linha de código. Acione também quando o usuário mencionar "começar projeto", "novo webapp", "setup inicial", "estrutura do projeto" ou qualquer variação — mesmo que não mencione explicitamente "bootstrap".
---

# Start Web App

Um skill para fundar projetos de webapp do zero de forma estruturada, antes de qualquer linha de código de feature.

Este skill é usado **uma única vez por projeto** — numa conversa dedicada de fundação. Ao final, todos os artefatos estarão prontos e o usuário fecha este chat e começa o projeto com base no que foi produzido aqui.

O processo geral funciona assim:

- Entender a ideia do usuário sem assumir nada
- Construir o PRD colaborativamente
- Definir stack e convenções no `.ai-rules` (ou equivalente do ambiente)
- Montar estrutura de pastas e `PROGRESS.md`
- Validar que tudo está no lugar antes da primeira feature

Seu trabalho ao usar este skill é identificar onde o usuário está nesse processo e ajudá-lo a avançar etapa por etapa. Talvez ele chegue com "quero fazer um app de X" — aí você começa do zero. Talvez ele já tenha uma ideia clara mas nenhum documento ainda. Talvez ele tenha um PRD mas nenhuma convenção definida. Seja flexível e entre no fluxo onde fizer sentido.

Seu usuário disser "pode pular as perguntas, já sei o que quero", vá em frente sem cerimônia.

---

## Comunicando com o usuário

Este skill pode ser usado por pessoas com níveis bem diferentes de experiência técnica. Preste atenção nos sinais do contexto:

- Se o usuário usa termos como "monorepo", "App Router", "RLS" ou "edge functions" naturalmente, pode usar jargão técnico livremente.
- Se o usuário descreve tudo em linguagem de produto ("quero que o usuário consiga fazer X"), explique os termos técnicos brevemente antes de usá-los.

Em caso de dúvida, uma definição rápida entre parênteses não ofende ninguém.

---

## FASE 1 — Captura da Ideia

Comece entendendo o que o usuário quer construir. Não escreva nada ainda — primeiro faça as perguntas certas. Não despeje todas as perguntas de uma vez: faça uma rodada inicial, espere as respostas, e só então pergunte o que ainda estiver em aberto.

**Perguntas essenciais:**

1. O que este produto faz e qual problema ele resolve?
2. Para quem é? (uso pessoal, equipe interna, produto público?)
3. Quais são as 3–5 funcionalidades mais importantes para o MVP?
4. Existe alguma integração externa essencial? (pagamentos, autenticação social, APIs de terceiros?)
5. O usuário tem preferência de stack ou quer uma sugestão?

Extraia o que der da mensagem inicial e pergunte só o que realmente está em aberto. Quando o usuário responder, confirme seu entendimento em 2–3 frases antes de avançar.

---

## FASE 2 — Construção do PRD

Com as respostas em mãos, gere o `PRD.md` completo em markdown. O PRD deve cobrir:

- **Visão geral**: o que é o produto e qual problema resolve
- **Usuários-alvo**: quem vai usar e em que contexto
- **Funcionalidades do MVP**: lista priorizada do que entra na primeira versão
- **Fluxos do usuário**: os caminhos principais que um usuário percorre no produto
- **Fora do escopo**: o que explicitamente não entra no MVP — subestimado, mas essencial para evitar que a IA invente coisas
- **Regras de negócio**: restrições, lógicas e comportamentos que não são óbvios
- **Stack técnica**: seção a ser preenchida na próxima fase

Apresente o PRD ao usuário e peça confirmação antes de seguir. Diga algo como: *"Aqui está o PRD. Leia com atenção — este documento vai guiar todas as decisões técnicas. Corrija qualquer coisa que não refletir sua visão."*

Só avance quando o usuário aprovar.

---

## FASE 3 — Stack e Arquivo de Convenções

Com o PRD aprovado, defina a stack técnica.

Se o usuário não tiver preferências fortes, use esta stack como padrão — ela é bem documentada, amplamente conhecida por IAs de código e cobre 90% dos casos de webapps:

| Camada | Escolha padrão |
|---|---|
| Framework | Next.js (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind + shadcn/ui |
| Backend / DB | Supabase |
| Estado servidor | TanStack Query |
| Forms | React Hook Form + Zod |
| Deploy | Vercel |

Documente a stack escolhida na seção técnica do `PRD.md`.

Em seguida, gere o arquivo de convenções do projeto — normalmente chamado `.cursorrules`, `CONVENTIONS.md`, ou equivalente dependendo do ambiente de desenvolvimento do usuário. Este arquivo é lido pela IA a cada conversa e define o comportamento padrão para o projeto. Um bom arquivo de convenções cobre:

- Linguagem e tipagem (ex: TypeScript strict, sem `any`)
- Onde cada tipo de arquivo vive (componentes, hooks, services, types)
- Biblioteca de estilo e como usar (ex: Tailwind apenas, sem CSS inline)
- Padrão de fetch de dados
- Padrão de formulários e validação
- Convenções de nomenclatura
- O que nunca fazer

Apresente ao usuário para revisão antes de seguir.

---

## FASE 4 — Estrutura de Pastas e `PROGRESS.md`

Com PRD e convenções aprovados, defina a estrutura de pastas. Gere a estrutura com uma linha explicando o propósito de cada pasta. Adapte conforme o projeto — não force pastas que não fazem sentido para o escopo. Para um webapp típico com Next.js:

```
/app              → rotas e páginas
/components       → componentes reutilizáveis
/components/ui    → componentes de UI genéricos
/lib              → utilitários, helpers, configurações globais
/hooks            → custom hooks
/types            → interfaces e tipos globais
/services         → integrações externas e chamadas de API
/styles           → estilos globais
```

Em seguida, gere o `PROGRESS.md` inicial com as features do MVP extraídas do PRD como tarefas abertas:

```markdown
# PROGRESS.md

## Setup
- [x] PRD definido
- [x] Stack e convenções definidos
- [x] Estrutura de pastas definida
- [ ] Setup técnico do projeto

## MVP

- [ ] Autenticação (login / cadastro)
- [ ] [Feature 2 extraída do PRD]
- [ ] [Feature 3 extraída do PRD]

## Backlog

- [ ] [Features fora do MVP mas no radar]
```

Este arquivo é o mapa vivo do projeto — deve ser atualizado a cada feature concluída.

---

## FASE 5 — Validação Final e Encerramento

Antes de encerrar este chat, confirme que todos os artefatos estão prontos:

- [ ] `PRD.md` gerado e aprovado pelo usuário
- [ ] Stack definida e documentada no PRD
- [ ] Arquivo de convenções gerado e revisado
- [ ] Estrutura de pastas definida e documentada
- [ ] `PROGRESS.md` criado com as features do MVP listadas
- [ ] Nenhuma feature de produto foi implementada ainda — só documentação

Quando todos os itens estiverem confirmados, entregue ao usuário um **pacote de instruções de início**, com:

1. Todos os arquivos gerados na conversa (PRD.md, arquivo de convenções, PROGRESS.md, estrutura de pastas) prontos para copiar
2. O comando de inicialização do projeto (ex: `npx create-next-app@latest`)
3. A lista de dependências para instalar
4. O `.env.example` com as variáveis necessárias documentadas

Encerre dizendo algo como: *"O bootstrap está completo. Feche este chat, crie o projeto, coloque esses arquivos na raiz e comece pela primeira feature do PROGRESS.md. A partir de agora, toda conversa nova com a IA começa com: 'Leia o PRD.md e o PROGRESS.md antes de qualquer coisa.'"*

---

## Padrão de prompt para features (após o bootstrap)

Oriente o usuário a seguir este padrão ao pedir cada feature nova depois que o projeto estiver rodando:

```
Leia o PRD.md e o PROGRESS.md.

Contexto: [o que já está funcionando]
Feature: [o que quero construir agora]
Restrições: [onde o arquivo deve ficar, dependências específicas]

Antes de escrever código, me explique como você vai estruturar isso.
```

O "explique antes de escrever" é a instrução mais importante — ela força a IA a surfacar más decisões antes de materializá-los em código.

---

## Referência rápida — ordem das fases

| Fase | O que acontece | Entregável |
|---|---|---|
| 1 | Captura da ideia via perguntas | Entendimento confirmado |
| 2 | Construção e aprovação do PRD | `PRD.md` |
| 3 | Stack + convenções | Arquivo de convenções |
| 4 | Estrutura de pastas + roadmap | `PROGRESS.md` |
| 5 | Validação e encerramento | Pacote de arquivos pronto |
