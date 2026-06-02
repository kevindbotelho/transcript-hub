# Diretrizes e Convenções de Código - Transcript Hub

Este arquivo serve como guia de desenvolvimento para manter a base de código do **Transcript Hub** limpa, segura e consistente. Todas as implementações de IA e humanas devem seguir rigorosamente estas regras.

---

## 1. Stack Tecnológica
- **Framework**: Next.js 14+ (App Router)
- **Linguagem**: TypeScript (Strict Mode)
- **Estilos**: Tailwind CSS + shadcn/ui para componentes
- **Banco de Dados & Autenticação**: Supabase
- **Gerenciamento de Estado de Servidor**: TanStack Query (React Query)
- **Formulários & Validação**: React Hook Form + Zod

---

## 2. Arquitetura e Organização de Pastas
A estrutura de arquivos do projeto deve seguir esta organização:
```
/app              → Páginas, layouts e rotas da aplicação (App Router)
/components       → Componentes React reutilizáveis do projeto
/components/ui    → Componentes de interface genéricos e atômicos (shadcn/ui)
/hooks            → Hooks customizados (ex: useTranscribe, useAudioUpload)
/lib              → Clientes de SDKs (Supabase, OpenAI) e utilitários globais
/types            → Definições de tipos e interfaces do TypeScript
/services         → Chamadas de API e integrações externas
```

---

## 3. Diretrizes de TypeScript
- **Sem `any` implícito ou explícito**: Sempre defina tipos ou interfaces claras para todos os dados. Use `unknown` e type guards se o tipo for dinâmico e desconhecido.
- **Tipos de Retorno**: Funções e métodos devem declarar explicitamente o tipo de retorno.
- **Null Safety**: Use encadeamento opcional (`?.`) e coalescência nula (`??`) em vez de checagens manuais verbosas.

---

## 4. Regras de Estilo e Componentes (Tailwind / CSS)
- **Apenas classes utilitárias**: Evite estilos inline ou arquivos de CSS clássicos. Use exclusivamente classes Tailwind CSS.
- **Componentes Otimizados**: Para componentes complexos, modularize elementos repetidos em pequenos subcomponentes locais na mesma pasta ou arquivo.
- **Acessibilidade**: Use elementos semânticos HTML5 (`<main>`, `<header>`, `<nav>`, `<section>`) e atributos `aria` quando apropriado.

---

## 5. Fetch de Dados e Gerenciamento de Estado
- **TanStack Query**: Para dados assíncronos do cliente (como buscar o histórico de transcrições do Supabase ou disparar uma transcrição), use `useQuery` e `useMutation` do `@tanstack/react-query`.
- **Server Actions ou Route Handlers**: Operações com banco de dados Supabase e consumo de API da OpenAI que envolvam chaves secretas ou segurança de dados devem ser executadas em Server Actions (`"use server"`) ou em rotas de API `/app/api/...`.

---

## 6. Tratamento de Áudio e Segurança (OpenAI)
- **Segurança de Credenciais**: A variável `OPENAI_API_KEY` deve residir apenas no servidor (configurada no `.env` local e nas variáveis da Vercel). Nunca a envie ou exponha ao frontend.
- **Limitação de 25 MB**: 
  - Antes de iniciar o envio, o frontend deve verificar o tamanho do arquivo (`file.size`).
  - Arquivos com mais de **25 MB** (equivalente a 26.214.400 bytes) devem ser recusados imediatamente no cliente com um modal informativo e amigável.
- **Descarte de Arquivo**: Os arquivos de áudio não devem ser persistidos no Supabase Storage. O áudio é recebido no servidor via stream/buffer temporário, encaminhado diretamente em memória para a OpenAI e descartado assim que a API retornar a resposta de texto.

---

## 7. Convenções de Banco de Dados (Supabase / PostgreSQL)
- **Nomes de Tabelas e Colunas**: Use padrão snake_case (ex: `transcriptions`, `user_id`, `file_name`, `audio_duration`).
- **Segurança (RLS)**: Habilite sempre o *Row Level Security* (RLS) nas tabelas do Supabase. Cada usuário só pode ter acesso de leitura e escrita às suas próprias transcrições (`user_id = auth.uid()`).
