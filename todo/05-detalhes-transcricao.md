# Etapa 5: Detalhe de Transcrição e Botão Voltar

Esta etapa finaliza o fluxo de uso conectando o gerenciador de arquivos com a tela detalhada de leitura e escuta do áudio transcrito.

## 📋 Lista de Tarefas (To-Do)

- [x] **1. Fluxo de Seleção:**
  - Quando um áudio é clicado na lista de "Meus Áudios", definir o `selectedId` e esconder a lista de arquivos para dar foco total à transcrição.
- [x] **2. Adaptar o Painel de Detalhes no Centro:**
  - Exibir o painel de transcrição com o player de áudio original (nota: conforme as Convenções e o PRD do projeto, os arquivos de áudio físicos são descartados após a transcrição para otimização de custos e espaço, logo, o player de mídia original não se aplica nesta fase), metadados do arquivo e o texto da transcrição.
  - Ocupar o espaço central amplo da tela, melhorando consideravelmente a leitura e visualização de textos longos.
- [x] **3. Adicionar Botão "Voltar para Meus Áudios":**
  - Adicionar um botão no cabeçalho do painel de detalhes: `← Voltar para Meus Áudios` ou similar.
  - Ao clicar, definir `selectedId` como `null`, fazendo a tela central voltar ao gerenciador de arquivos.
  - **Preservação de Contexto:** Garantir que o estado `selectedFolderId` seja mantido ao voltar, para que o usuário retorne exatamente à pasta de onde abriu o áudio, ao invés de voltar para a raiz.
- [x] **4. Testar Fluxos de Edição e Ações:**
  - Garantir que a renomeação direta do título e a cópia da transcrição na tela de detalhes continuem funcionando 100%.

---

## 🔍 Critérios de Aceitação
* Clicar em um arquivo na lista de áudios deve exibir seus detalhes em tela cheia na parte central.
* Clicar em "Voltar" deve retornar o usuário exatamente para a mesma pasta onde ele estava navegando.
* Copiar o texto ou ouvir o áudio deve funcionar sem interferência visual ou funcional do menu lateral.
