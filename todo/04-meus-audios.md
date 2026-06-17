# Etapa 4: Gerenciador de Arquivos no Meio da Tela

Esta etapa é o coração da reestruturação. Vamos construir a nova interface de gerenciamento de pastas e áudios no meio da tela, oferecendo uma experiência ampla e rica em recursos para navegação e organização.

## 📋 Lista de Tarefas (To-Do)

- [x] **1. Criar a Barra de Ferramentas Superior (Toolbar):**
  - **Breadcrumbs Amplos:** Caminho navegável no topo (ex: `Início > Trabalho > Reuniões`) com suporte a drag-over para mover itens de nível.
  - **Busca Integrada:** Caixa de pesquisa com ícone e botão de limpar.
  - **Ordenação:** Seletor de ordenação (Cronológica / Alfabética).
  - **Nova Pasta:** Botão para criar uma nova pasta no nível atual.
- [x] **2. Desenhar a Seção de Pastas (Grid de Cards):**
  - Exibir as subpastas em um grid responsivo de cartões translúcidos (Glassmorphism).
  - Cada pasta terá um ícone de pasta (Ciano), o nome da pasta (com edição inline opcional) e menu de 3 pontos para renomear/excluir.
  - Habilitar Drag & Drop para arrastar áudios ou pastas para dentro dessas pastas.
- [x] **3. Desenhar a Seção de Áudios (Lista Estendida):**
  - Exibir os áudios pertencentes à pasta ativa em formato de tabela ou lista de alto padrão.
  - Colunas sugeridas:
    - **Nome do Arquivo:** Com ícone de áudio e suporte a pino (fixar no topo).
    - **Duração:** Formatada (ex: `14:25`).
    - **Tamanho:** Formatado (ex: `12.4 MB`).
    - **Data de Criação:** Formatada de forma amigável (ex: `Ontem às 15:30` ou `12/06/2026`).
  - Menu de ações individuais de 3 pontos à direita.
- [x] **4. Adaptar Drag & Drop e Seleção Múltipla:**
  - Garantir o funcionamento da seleção múltipla com `Shift` ou `Ctrl/Cmd` + clique nos arquivos de áudio.
  - Barra Flutuante de Ações em Lote (ex: Mover em Lote para Pasta X, Excluir em Lote) que aparece no rodapé ou cabeçalho do gerenciador central quando há itens selecionados.
  - Garantir que arrastar múltiplos áudios ou pastas atualize corretamente a pasta pai no banco de dados Supabase e no estado local.

---

## 🔍 Critérios de Aceitação
* A navegação em subpastas deve ser fluida e atualizar os breadcrumbs imediatamente.
* Drag & drop de arquivos para pastas ou breadcrumbs deve atualizar o banco Supabase em tempo real.
* A ordenação por data e alfabética deve funcionar instantaneamente.
