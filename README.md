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
- **Processamento de Áudio**: OpenAI API (`gpt-4o-mini-transcribe`)
- **Biblioteca de Ícones**: Lucide React

---

## ⚙️ Funcionalidades Concluídas (MVP)
- **Autenticação Segura**: Tela de login exclusiva via e-mail e senha integrada ao Supabase Auth.
- **Upload Inteligente**: Área drag-and-drop inteligente no Desktop e adaptada para dispositivos móveis com limite de 25 MB.
- **Transcrição em Tempo Real**: Feedback visual e barra de progresso ativa durante o processamento da IA.
- **Histórico & Busca**: Sidebar persistente com histórico dos arquivos, permitindo a pesquisa instantânea de termos e nomes de arquivos.
- **Ações Rápidas**: Copiar texto transcrito com um clique e navegação "Voltar" simplificada.

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
