# PROGRESS - Transcript Hub

## Setup Inicial
- [x] PRD definido e aprovado
- [x] Stack e convenções definidos (`CONVENTIONS.md`)
- [x] Estrutura de pastas criada
- [x] Setup inicial do projeto Next.js (bootstrap com TypeScript, Tailwind e dependências)

---

## MVP (Mínimo Produto Viável)

### 1. Autenticação e Segurança
- [ ] Criação do projeto no Supabase e configuração de tabelas/RLS
- [ ] Integração do Supabase Auth no Next.js
- [ ] Tela de Login (`/login`) protegida por e-mail e senha
- [ ] Bloqueio de registros públicos (somente contas criadas manualmente pelo admin ou lista de convidados)

### 2. Dashboard e Área de Upload
- [ ] Layout principal com sidebar de histórico e área central
- [ ] Área de upload arrasta-e-solta (Desktop) e seletor nativo fácil (iPhone/Mobile)
- [ ] Validação de tamanho no frontend (bloqueio de arquivos maiores que 25 MB)
- [ ] Feedback visual de progresso (Loader animado) durante a transcrição

### 3. Integração OpenAI (Processamento)
- [ ] Rota de API / Server Action segura para envio de arquivos
- [ ] Chamada ao endpoint `/audio/transcriptions` da OpenAI usando o modelo `gpt-4o-mini-transcribe-2025-12-15`
- [ ] Captura do texto resultante e retorno ao frontend

### 4. Armazenamento e Histórico
- [ ] Tabela no Supabase para salvar metadados e textos das transcrições
- [ ] Gravação do resultado no banco de dados assim que a transcrição finalizar com sucesso
- [ ] Sidebar lateral listando transcrições passadas em ordem cronológica reversa
- [ ] Busca de transcrições antigas por título e conteúdo
- [ ] Visualização detalhada de uma transcrição ao selecioná-la no histórico
- [ ] Botão de copiar rápida para a área de transferência

---

## Backlog (Ideias Futuras)
- [ ] Compactação do arquivo no frontend para arquivos que passem do limite de 25 MB
- [ ] Diarização (divisão por locutor na transcrição)
- [ ] Edição direta do texto transcrito dentro da interface
- [ ] Exportação do texto em formatos `.txt`, `.docx` e `.pdf`
