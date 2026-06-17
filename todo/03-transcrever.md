# Etapa 3: Tela Dedicada de Transcrição (Upload)

Esta etapa foca em mover a área de upload de áudios atual para a aba dedicada **"Transcrever"**, garantindo que todo o sistema de processamento com IA e fila de uploads permaneça funcionando perfeitamente sem qualquer regressão.

## 📋 Lista de Tarefas (To-Do)

- [x] **1. Migrar a Área de Upload Principal:**
  - Garantir que o painel de upload arrasta-e-solta, os loaders e o feedback visual original sejam exibidos apenas quando `activeTab === 'transcribe'` e nenhum áudio esteja selecionado para leitura.
- [x] **2. Fila de Uploads (Queue):**
  - Manter o comportamento e visibilidade da fila de transcrições ativas no rodapé ou na lateral direita da aba de Transcrição.
- [x] **3. Preservar Recursos Visuais Estéticos:**
  - O visual do painel central de upload deve continuar exatamente igual ao atual (com a mesma largura/altura responsivas, bordas tracejadas com glows neon, efeitos de gradiente e animação de upload).
- [x] **4. Fluxo Pós-Transcrição:**
  - Assim que a transcrição de um áudio for concluída com sucesso:
    - O áudio deve ser inserido no banco de dados.
    - O usuário deve receber um feedback de sucesso.
    - Opcional: Decidir se redirecionamos o usuário automaticamente para a aba "Meus Áudios" focando no novo áudio criado ou se mantemos ele na aba "Transcrever" mostrando a fila concluída. *Sugerimos manter na aba Transcrever com um botão para "Ir para Meus Áudios".*

---

## 🔍 Critérios de Aceitação
* Fazer upload de arquivos de áudio válidos (<25MB) deve disparar a transcrição e salvá-la no banco normalmente.
* Toda a interface estética atual de upload (nebulosas, loaders, etc.) deve funcionar sem bugs visuais.
