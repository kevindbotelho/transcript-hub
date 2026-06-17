# Transcript Hub

O **Transcript Hub** é um webapp de uso pessoal e restrito, projetado para simplificar a transcrição de áudios de longa duração gravados no computador ou em dispositivos móveis (como Notas de Voz do iPhone). O sistema converte arquivos de áudio em texto de forma rápida e segura utilizando os modelos de inteligência artificial de transcrição da OpenAI, mantendo um histórico persistente e pesquisável no banco de dados.

---

## 🎨 Design System: Aura & Pulse
A interface do Transcript Hub segue um Living Design System híbrido personalizado, focado em alta fidelidade estética e usabilidade:
- **Nebulosas Fluídas**: Fundos dinâmicos com drift de blobs coloridos em baixa opacidade e drift de grade de pontos.
- **Glassmorphism**: Painéis construídos com efeito fosco translúcido (`backdrop-blur-2xl bg-[#090f1a]/70`) e bordas com gradiente sutil.
- **Tipografia Premium**: Títulos amplos com `Plus Jakarta Sans`, leitura confortável do texto transcrito com `Inter` (`leading-8` para melhor legibilidade) e informações numéricas em `JetBrains Mono`.
- **Layout Lado a Lado (Split Layout)**: Redesenho do espaço no Desktop para organizar elementos horizontalmente, reduzindo a rolagem vertical.

---

## 🚀 Tecnologias Utilizadas
- **Framework**: [Next.js](https://nextjs.org) (App Router com TypeScript)
- **Estilização**: Tailwind CSS
- **Banco de Dados & Auth**: [Supabase](https://supabase.com) (PostgreSQL & Supabase Auth)
- **Processamento de Áudio**: OpenAI API (`whisper-1`)
- **Biblioteca de Ícones**: Lucide React

---

## ⚙️ Funcionalidades Concluídas (MVP & Reestruturação)
- **Autenticação Segura**: Tela de login exclusiva via e-mail e senha integrada ao Supabase Auth.
- **Estrutura de Sidebar Dinâmica**: Menu lateral em abas para organização das fluxos de trabalho do sistema:
  - **Transcrever**: Área dedicada a novos uploads.
  - **Meus Áudios**: Painel de gerenciamento de pastas e arquivos.
  - **Perfil**: Configurações de preferências da conta e chaves da API.
- **Upload Inteligente (Transcrever)**: Área drag-and-drop inteligente no Desktop e adaptada para dispositivos móveis com limite de 25 MB. Fila de uploads no rodapé processa múltiplos áudios em lote no background sem interromper o usuário.
- **Gerenciador de Pastas e Áudios (Meus Áudios)**:
  - Criação de pastas e subpastas de forma hierárquica.
  - Barra de ferramentas para busca de conteúdos, ordenação cronológica ou alfabética e nova pasta.
  - Navegação visual usando Breadcrumbs responsivos com suporte a arrastar e soltar (Drag & Drop).
  - Ações em lote para mover múltiplos arquivos ou realizar exclusão em massa com barra flutuante.
- **Visualização com Foco Total**: Ao selecionar uma transcrição, ela ocupa a área central de forma ampla, exibindo metadados na esquerda e o texto de IA otimizado para leitura na direita, com botão de retorno unificado que preserva a pasta de navegação ativa.
- **Ações Rápidas**: Copiar texto transcrito com um clique, fixar áudios no topo e renomeação direta de arquivos e pastas.

---

## 🛠️ Como Iniciar Localmente

1. Clone o repositório e configure as variáveis de ambiente em um arquivo `.env` (baseando-se no `.env.example`).
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra [http://localhost:3000](http://localhost:3000) no seu navegador.
