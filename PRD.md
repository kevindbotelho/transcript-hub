# PRD - Transcript Hub

## 1. Visão Geral
O **Transcript Hub** é um webapp de uso pessoal e restrito a poucos usuários, projetado para simplificar a transcrição de áudios de longa duração gravados no computador ou em dispositivos móveis (como Notas de Voz do iPhone). O sistema converte arquivos de áudio em texto de forma rápida e segura utilizando modelos de inteligência artificial de transcrição da OpenAI, mantendo um histórico persistente das transcrições geradas no banco de dados para resgate posterior.

### Problema Resolvido
- Dificuldade em revisar e buscar informações contidas em gravações longas de áudio (ex: aulas, reuniões, notas mentais gravadas).
- Necessidade de uma interface web otimizada e responsiva (funcional tanto em PC quanto em smartphones) para realizar uploads rápidos de arquivos locais e copiar facilmente as transcrições textuais obtidas.
- Evitar o armazenamento pesado de arquivos de áudio originais em nuvem, mantendo apenas a informação textual correspondente indexada e acessível a qualquer momento.

---

## 2. Usuários-Alvo
- **Primário**: O próprio desenvolvedor (uso pessoal), acessando via desktop (Windows) ou mobile (iPhone 15).
- **Secundário**: Amigos próximos cadastrados manualmente para transcrições ocasionais.

---

## 3. Funcionalidades do MVP (Escopo)

### 3.1. Autenticação e Segurança
- Tela de login simples baseada em E-mail e Senha gerenciada via Supabase Auth.
- Bloqueio de novos registros públicos (cadastros desabilitados por padrão ou restritos a uma lista pré-aprovada), garantindo que apenas usuários autorizados acessem a ferramenta e consumam a API da OpenAI.

### 3.2. Upload e Processamento de Áudio
- Upload de arquivos de áudio arrastando e soltando no desktop, ou clicando para selecionar arquivos no celular.
- Suporte a múltiplos formatos suportados pela API da OpenAI e gravados pelo iPhone: `.mp3`, `.m4a` (Notas de voz iOS), `.wav`, `.webm`.
- Integração direta com o endpoint `/audio/transcriptions` da OpenAI usando o modelo `gpt-4o-mini-transcribe-2025-12-15` (ou similar compatível).
- Indicador visual de progresso (Loading/Processando) durante a transcrição do áudio.

### 3.3. Exibição e Cópia do Texto
- Renderização limpa e formatada do texto transcrito resultante.
- Botão "Copiar para Área de Transferência" rápido e acessível com feedback visual de sucesso.
- Interface responsiva e premium com suporte a temas modernos (design responsivo otimizado para iOS Safari / Google Chrome).

### 3.4. Histórico de Transcrições
- Banco de dados Supabase armazenando metadados (nome do arquivo original, tamanho do arquivo, data do upload, duração do áudio) e o texto completo da transcrição.
- Painel/Sidebar lateral contendo o histórico de áudios passados enviados pelo usuário.
- Campo de busca textual simples para localizar transcrições antigas por título do arquivo ou conteúdo.
- Carregamento sob demanda do conteúdo de transcrições passadas ao clicar no item do histórico.

---

## 4. Fluxo do Usuário
1. **Acesso**: O usuário acessa a URL do app e se depara com a tela de login.
2. **Login**: Insere e-mail/senha cadastrados para acessar o dashboard principal.
3. **Dashboard / Upload**: Vê a área de upload centralizada e o painel de histórico à esquerda.
4. **Envio**: Clica na área de upload ou arrasta um arquivo (`.mp3` ou `.m4a`). No iPhone, clica no seletor de arquivos e escolhe o áudio gravado.
5. **Processamento**: O arquivo é transmitido para a API do Next.js, que encaminha à OpenAI para transcrição. Uma animação de carregamento é exibida.
6. **Resultado**: O texto transcrito aparece na tela com um botão rápido para copiar. Simultaneamente, o registro é salvo no banco de dados Supabase e o histórico lateral é atualizado.
7. **Navegação Histórica**: O usuário pode clicar em qualquer transcrição no menu lateral para visualizar o texto gerado há dias/semanas.

---

## 5. Fora do Escopo (Não entra no MVP)
- Armazenamento físico dos arquivos de áudio originais (ex: Supabase Storage) para evitar consumo excessivo de cota e custos. O áudio é processado temporariamente em memória/buffer e descartado após a transcrição.
- Transcrição em tempo real via streaming de microfone (captura ao vivo). O foco é upload de arquivos pré-gravados.
- Divisão de locutores (Diarização) no MVP (pode ser considerado para o backlog).
- Edição de texto transcrito diretamente na plataforma.
- Planos de assinatura ou controle de limites de cota por usuário.

---

## 6. Regras de Negócio e Limitações Técnicas
- **Limite de 25 MB**: A API da OpenAI limita requisições de transcrição a no máximo 25 MB.
  - *Regra*: Arquivos que ultrapassarem 25 MB serão recusados no frontend com uma mensagem instrutiva sugerindo compactação ou fatiamento prévio.
- **Segurança de API Keys**: A chave de API da OpenAI (`OPENAI_API_KEY`) nunca deve ser exposta no frontend. Todo processamento de chamada de API deve ocorrer via rotas seguras do servidor Next.js (API Routes ou Server Actions).
- **Isolamento de Dados**: Cada usuário autenticado só pode visualizar seu próprio histórico de transcrições.

---

## 7. Stack Técnica Proposta

| Camada | Escolha Técnica |
|---|---|
| **Framework Frontend/Backend** | Next.js 14+ (App Router) |
| **Linguagem** | TypeScript |
| **Estilos & UI** | Tailwind CSS + shadcn/ui |
| **Autenticação & Banco de Dados** | Supabase (Auth + PostgreSQL) |
| **Consumo de APIs** | TanStack Query (React Query) |
| **Formulários e Validação** | React Hook Form + Zod |
| **Integração de IA** | OpenAI API (`gpt-4o-mini-transcribe-2025-12-15`) |
| **Deploy** | Vercel |
