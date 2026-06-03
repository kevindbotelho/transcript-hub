# PROGRESS - Transcript Hub

## Setup Inicial
- [x] PRD definido e aprovado
- [x] Stack e convenções definidos (`CONVENTIONS.md`)
- [x] Estrutura de pastas criada
- [x] Setup inicial do projeto Next.js (bootstrap com TypeScript, Tailwind e dependências)

---

## MVP (Mínimo Produto Viável)

### 1. Autenticação e Segurança
- [x] Criação do projeto no Supabase e configuração de tabelas/RLS
- [x] Integração do Supabase Auth no Next.js
- [x] Tela de Login (`/login`) protegida por e-mail e senha
- [x] Bloqueio de registros públicos (configurado no console do Supabase Auth desabilitando novos cadastros autônomos)

### 2. Dashboard e Área de Upload
- [x] Layout principal com sidebar de histórico e área central
- [x] Área de upload arrasta-e-solta (Desktop) e seletor nativo fácil (iPhone/Mobile)
- [x] Validação de tamanho no frontend (bloqueio de arquivos maiores que 25 MB)
- [x] Feedback visual de progresso (Loader animado) durante a transcrição

### 3. Integração OpenAI (Processamento)
- [x] Rota de API / Server Action segura para envio de arquivos
- [x] Chamada ao endpoint `/audio/transcriptions` da OpenAI usando o modelo `gpt-4o-mini-transcribe-2025-12-15`
- [x] Captura do texto resultante e retorno ao frontend

### 4. Armazenamento e Histórico
- [x] Tabela no Supabase para salvar metadados e textos das transcrições
- [x] Gravação do resultado no banco de dados assim que a transcrição finalizar com sucesso
- [x] Sidebar lateral listando transcrições passadas em ordem cronológica reversa
- [x] Busca de transcrições antigas por título e conteúdo
- [x] Visualização detalhada de uma transcrição ao selecioná-la no histórico
- [x] Botão de copiar rápida para a área de transferência

### 5. Design System & Refinamentos Estéticos (Aura & Pulse)
- [x] Configuração global de tipografia harmônica (Jakarta, Inter, JetBrains Mono)
- [x] Criação de fundo dinâmico de nebulosas em movimento e efeitos Glassmorphism
- [x] Reestilização completa da tela de Login (`/login`)
- [x] Distribuição responsiva em duas colunas centrais no Desktop (Split Layout)
- [x] Estabilidade estrita de altura e largura dos painéis ao alternar áudios (`items-stretch` e `h-[520px]`)
- [x] Alinhamento vertical stretch na coluna de upload e remoção do badge Premium
- [x] Quebra automática de linha (`break-words`) para nomes de arquivo longos no card de metadados
- [x] Botão de retorno "Voltar" unificado no cabeçalho do dashboard

---

## Backlog (Ideias Futuras)
- [ ] Compactação do arquivo no frontend para arquivos que passem do limite de 25 MB
- [ ] Diarização (divisão por locutor na transcrição)
- [ ] Edição direta do texto transcrito dentro da interface
- [ ] Exportação do texto em formatos `.txt`, `.docx` e `.pdf`
