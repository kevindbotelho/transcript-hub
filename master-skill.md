---
description: Orquestrador de skills para Claude Code que copia habilidades de um cofre central para o projeto ativo sob demanda, sem alterar a fonte original.
---

# master-skill

Orquestrador de skills para Claude Code. Copia skills do cofre central para o
projeto ativo. **Nunca modifica o cofre. Nunca ativa sem `/master-skill` explícito.**

---

## 1. Inicialização (primeira execução)

Ao ser ativado, verifique a existência de `.masterskill.json` na raiz do projeto:

```bash
cat .masterskill.json 2>/dev/null
```

**Se não existir:** pergunte ao usuário:
> "Qual é o caminho absoluto do seu cofre de skills? (ex: `/Users/kevin/cofre-skills`)"

Depois de receber a resposta, salve:
```json
{ "vault": "/caminho/absoluto/do/cofre" }
```

```bash
echo '{ "vault": "/caminho/informado" }' > .masterskill.json
```

**Se existir:** leia silenciosamente e siga para a ação solicitada.

---

## 2. Grupos de Skills

Cada grupo lista caminhos **relativos ao cofre**. Ao carregar um grupo, copie
todos os arquivos para `skills/` do projeto, preservando os nomes dos arquivos.
Use `mkdir -p` para criar subpastas se necessário.

### `frontend`
```
antigravity-kit/frontend-design/SKILL.md
antigravity-kit/nextjs-react-expert/SKILL.md
antigravity-kit/tailwind-patterns/SKILL.md
antigravity-kit/web-design-guidelines/SKILL.md
stitch/stitch-design/SKILL.md
stitch/shadcn-ui/SKILL.md
stitch/react-components/SKILL.md
stitch/stitch-loop/SKILL.md
stitch/design-md/SKILL.md
stitch/enhance-prompt/SKILL.md
anthropics/frontend-design/SKILL.md
anthropics/canvas-design/SKILL.md
anthropics/theme-factory/SKILL.md
anthropics/web-artifacts-builder/SKILL.md
vercel/react-best-practices/SKILL.md
vercel/composition-patterns/SKILL.md
vercel/web-design-guidelines/SKILL.md
```

### `backend`
```
antigravity-kit/api-patterns/SKILL.md
antigravity-kit/python-patterns/SKILL.md
antigravity-kit/nodejs-best-practices/SKILL.md
antigravity-kit/architecture/SKILL.md
antigravity-kit/server-management/SKILL.md
antigravity-kit/performance-profiling/SKILL.md
n8n/n8n-code-python/SKILL.md
n8n/n8n-workflow-patterns/SKILL.md
n8n/n8n-node-configuration/SKILL.md
n8n/n8n-expression-syntax/SKILL.md
n8n/n8n-validation-expert/SKILL.md
n8n/n8n-mcp-tools-expert/SKILL.md
```

### `banco-de-dados`
```
supabase/SKILL.md
antigravity-kit/database-design/SKILL.md
```

### `arquitetura`
```
antigravity-kit/app-builder/SKILL.md
antigravity-kit/plan-writing/SKILL.md
antigravity-kit/intelligent-routing/SKILL.md
antigravity-kit/parallel-agents/SKILL.md
antigravity-kit/start-web-app/SKILL.md
superpowers/brainstorming/SKILL.md
superpowers/writing-plans/SKILL.md
superpowers/dispatching-parallel-agents/SKILL.md
superpowers/subagent-driven-development/SKILL.md
```

### `qualidade`
```
antigravity-kit/code-review-checklist/SKILL.md
antigravity-kit/clean-code/SKILL.md
antigravity-kit/lint-and-validate/SKILL.md
antigravity-kit/tdd-workflow/SKILL.md
antigravity-kit/testing-patterns/SKILL.md
antigravity-kit/webapp-testing/SKILL.md
antigravity-kit/systematic-debugging/SKILL.md
superpowers/systematic-debugging/SKILL.md
superpowers/requesting-code-review/SKILL.md
superpowers/receiving-code-review/SKILL.md
superpowers/verification-before-completion/SKILL.md
anthropics/webapp-testing/SKILL.md
```

### `ia`
```
anthropics/claude-api/SKILL.md
antigravity-kit/intelligent-routing/SKILL.md
antigravity-kit/parallel-agents/SKILL.md
antigravity-kit/mcp-builder/SKILL.md
anthropics/mcp-builder/SKILL.md
```

### `dados`
```
anthropics/xlsx/SKILL.md
anthropics/pptx/SKILL.md
anthropics/docx/SKILL.md
anthropics/pdf/SKILL.md
```

### `deploy`
```
vercel/deploy-to-vercel/SKILL.md
vercel/vercel-cli-with-tokens/SKILL.md
antigravity-kit/deployment-procedures/SKILL.md
```

### `geral`
```
antigravity-kit/bash-linux/SKILL.md
antigravity-kit/documentation-templates/SKILL.md
superpowers/executing-plans/SKILL.md
superpowers/finishing-a-development-branch/SKILL.md
superpowers/using-git-worktrees/SKILL.md
superpowers/using-superpowers/SKILL.md
superpowers/writing-skills/SKILL.md
anthropics/skill-creator/SKILL.md
anthropics/doc-coauthoring/SKILL.md
```

---

## 3. Comportamentos por Comando

### Carregar grupo
Gatilho: `/master-skill <nome-do-grupo>` — ex: `/master-skill frontend`

1. Leia `.masterskill.json` para obter `vault`.
2. Para cada caminho do grupo, execute:
   ```bash
   VAULT="/caminho/do/cofre"
   DEST="skills/"
   mkdir -p "$DEST"
   cp "$VAULT/<caminho-relativo>" "$DEST/<nome-do-arquivo>"
   ```
3. Ao final, confirme: "✅ Grupo `frontend` carregado — 17 skills copiadas para `skills/`."
4. Se algum arquivo não existir no cofre, avise sem interromper os demais:
   "⚠️ Não encontrado no cofre: `<caminho>` — pulado."

### Carregar skill individual
Gatilho: `/master-skill quero a skill de [nome]` ou variações naturais.

1. Identifique a skill pelo nome mencionado (busca por substring nos caminhos de todos os grupos).
2. Se encontrada, copie para `skills/` e confirme.
3. Se ambígua (mais de um match), liste as opções e peça escolha.
4. Se não encontrada, informe e liste grupos disponíveis.

### Listar grupos
Gatilho: `/master-skill liste as skills` ou variações.

Exiba a lista de grupos com o número de skills de cada um:
```
📦 Grupos disponíveis no master-skill:
  frontend       → 17 skills
  backend        → 12 skills
  banco-de-dados →  2 skills
  arquitetura    →  9 skills
  qualidade      → 12 skills
  ia             →  5 skills
  dados          →  4 skills
  deploy         →  3 skills
  geral          →  9 skills

Use: /master-skill <grupo> para carregar um grupo.
Use: /master-skill quero a skill de <nome> para carregar uma skill avulsa.
Use: /master-skill classificar novas para processar skills em novas-skills/.
```

### Classificar novas skills
Gatilho: `/master-skill classificar novas`

Processa todas as pastas dentro de `<vault>/novas-skills/`, avalia cada skill nova
e decide se deve ser incorporada ao cofre e a qual grupo pertence.

**Passo a passo:**

1. Liste o conteúdo de `<vault>/novas-skills/`:
   ```bash
   ls "$VAULT/novas-skills/"
   ```
   Se vazia, informe: "📭 Nenhuma skill nova encontrada em `novas-skills/`." e encerre.

2. Para cada pasta encontrada em `novas-skills/`, leia seu `SKILL.md`:
   ```bash
   cat "$VAULT/novas-skills/<pasta>/SKILL.md"
   ```

3. Com base no conteúdo lido, determine:
   - **O que a skill faz** (1 linha)
   - **Grupo candidato** (frontend, backend, qualidade, etc.)

4. Leia as skills já existentes nesse grupo (listadas na seção 2 deste arquivo) e compare:
   - **Cobertura nova?** → A skill traz algo que nenhuma das existentes já cobre?
   - **Duplicata?** → Faz essencialmente a mesma coisa que uma skill já no grupo?
   - **Ambíguo?** → Poderia entrar em mais de um grupo?

5. Apresente o diagnóstico ao usuário:
   ```
   🔍 Skill encontrada: <nome-da-pasta>
      O que faz: <descrição em 1 linha>
      Grupo candidato: <grupo>
      Avaliação: <Cobertura nova | Duplicata de X | Ambíguo entre X e Y>
      Recomendação: <Adicionar ao grupo X | Descartar | Decidir>
   ```

6. Com base na avaliação:
   - **Cobertura nova → adiciona automaticamente:**
     - Move a pasta de `novas-skills/` para o lugar correto no cofre
     - Adiciona o caminho `<pasta>/SKILL.md` na lista do grupo correspondente neste arquivo
     - Confirma: "✅ `<skill>` adicionada ao grupo `<grupo>`."
   - **Duplicata → pede confirmação antes de qualquer ação:**
     - "⚠️ `<skill>` parece duplicar `<skill-existente>`. Deseja adicionar mesmo assim? (s/n)"
     - Se não confirmado, descarta e informa.
   - **Ambíguo → apresenta raciocínio e pede decisão:**
     - "❓ `<skill>` poderia entrar em `<grupo-a>` ou `<grupo-b>`. Em qual você prefere?"
     - Aguarda resposta antes de mover.

7. Ao final, confirme o resultado completo:
   ```
   📋 Classificação concluída:
      ✅ Adicionadas: X skills
      ⚠️  Descartadas: Y skills
      📁 novas-skills/ está vazia.
   ```

**Regras do classificar novas:**
- Nunca mova uma skill sem confirmar ao usuário o que está fazendo.
- Sempre leia o `SKILL.md` completo antes de classificar — não classifique só pelo nome da pasta.
- Se a pasta não tiver `SKILL.md`, avise e pule: "⚠️ `<pasta>` não tem SKILL.md — ignorada."
- Após mover todas as skills aprovadas, `novas-skills/` deve ficar vazia.

### Reset
Gatilho: `/master-skill reset`

1. Confirme com o usuário antes de agir:
   "Isso vai apagar `.masterskill.json`. Continuar? (s/n)"
2. Se confirmado:
   ```bash
   rm -f .masterskill.json
   ```
3. Informe: "🔄 Configuração removida. Na próxima execução, o caminho do cofre será solicitado novamente."

---

## 4. Regras Absolutas

- **Nunca ative sem `/master-skill` explícito no prompt do usuário.**
- **Nunca escreva no cofre** — exceto ao executar `classificar novas`, onde mover pastas de `novas-skills/` para o cofre é o comportamento esperado.
- **Nunca modifique skills já existentes em `skills/`** sem confirmação — pergunte se deve sobrescrever.
- A pasta `skills/` é sempre relativa à raiz do projeto ativo (onde o Claude Code está rodando).
- O `.masterskill.json` também fica na raiz do projeto ativo.
