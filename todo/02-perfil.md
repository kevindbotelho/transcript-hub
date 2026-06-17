# Etapa 2: Tela de Perfil e Chave API

Esta etapa foca na criação da aba **Configurações/Perfil**, dando ao usuário uma área para gerenciar sua conta e configurar chaves de API futuras.

## 📋 Lista de Tarefas (To-Do)

- [x] **1. Criar o Painel Central de Perfil:**
  - Layout minimalista de Glassmorphism centralizado no meio da tela na aba de Perfil.
  - Título principal com tipografia premium (`h1` ou `h2` estilizados).
  - Ícone de usuário grande ou avatar estilizado com animação suave de pulso/neon ao redor.
- [x] **2. Mostrar Dados do Usuário:**
  - Exibir o E-mail obtido da prop `userEmail`.
  - Exibir dados como "Data de Cadastro" (opcional/mock) ou um nome de exibição derivado do e-mail.
- [x] **3. Desenhar a Seção "Chave de API OpenAI":**
  - Input premium com borda sutil em ciano/azul e fundo escuro.
  - Placeholder: `sk-proj-....................`
  - Deixar o campo **opaco e desabilitado** (`disabled` ou `readOnly`), impedindo a escrita ativa.
  - Adicionar um texto de suporte explicativo: *"Sua chave de API pessoal da OpenAI. Por enquanto, o Transcript Hub utiliza a chave de processamento central. Chaves pessoais estarão disponíveis em breve para permitir o uso em escala individual."*
  - Adicionar um pequeno badge de status "Configuração Global Ativa" para dar um feedback visual reconfortante ao usuário.
- [x] **4. Botão de Salvar Alterações (Mock):**
  - Um botão moderno com micro-interações de hover para salvar outras configurações futuras.

---

## 🔍 Critérios de Aceitação
* A tela de perfil deve seguir a estética Glassmorphism, mantendo o fundo de nebulosa ativo.
* O campo de chave de API OpenAI deve ser claramente visível, mas bloqueado contra inserções.
* Layout responsivo de perfil bem centralizado e confortável no mobile.
