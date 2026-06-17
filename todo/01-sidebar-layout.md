# Etapa 1: Estrutura Geral e Sidebar Menu

Esta etapa foca na alteração estrutural do layout global do dashboard. Vamos introduzir o novo menu lateral (Sidebar) e configurar a lógica de exibição condicional (Abas) para a área central.

## 📋 Lista de Tarefas (To-Do)

- [x] **1. Adicionar Estado da Aba Ativa:**
  - Definir um estado no [DashboardClient.tsx](file:///c:/Users/kevin/OneDrive/Área%20de%20Trabalho/projetos/ia-projects/transcript-hub/components/DashboardClient.tsx): `const [activeTab, setActiveTab] = useState<'transcribe' | 'files' | 'profile'>('transcribe')`.
- [x] **2. Construir o Componente Sidebar Menu:**
  - Substituir o painel lateral antigo de histórico por um menu vertical limpo e sofisticado.
  - Logotipo e Nome do Sistema no topo, apontando para redefinir seleções.
  - Opções com ícones (Lucide) e textos com transições suaves e glows ao passar o mouse (hover):
    - **Transcrever** (`Mic` / `UploadCloud`)
    - **Meus Áudios** (`Folder` / `HardDrive`)
    - **Perfil & Configurações** (`User` / `Settings`)
  - Rodapé da Sidebar com o botão de logout e informações básicas do usuário logado de forma elegante.
  - Efeito Glassmorphism de alto padrão (`bg-[#090f1a]/45 backdrop-blur-2xl border-r border-white/[0.08]`).
- [x] **3. Garantir Responsividade (Mobile):**
  - No celular/telas pequenas, a Sidebar deve colapsar em um menu hambúrguer ou barra inferior (TabBar), dependendo do que for mais estético e confortável. Sugerimos uma barra inferior elegante no mobile.
- [x] **4. Estruturar o Switch de Telas na Área Central:**
  - Condicionar o conteúdo do contêiner principal à aba ativa (`activeTab`).
  - Por enquanto:
    - Se `activeTab === 'transcribe'`, exibe a tela de upload e processamento original (já desenvolvida).
    - Se `activeTab === 'files'`, exibe temporariamente um placeholder bonito do Gerenciador de Áudios (será implementado na Etapa 4).
    - Se `activeTab === 'profile'`, exibe temporariamente um placeholder bonito do Perfil (será implementado na Etapa 2).
- [x] **5. Preservar o Fundo de Nebulosas:**
  - Manter o efeito dinâmico das nebulosas flutuantes atrás de toda a interface.

---

## 🔍 Critérios de Aceitação
* A barra lateral deve se ajustar perfeitamente ao desktop e mobile.
* Alternar entre as abas não deve quebrar a página nem causar recarregamentos indesejados.
* A navegação lateral deve ter hover-states premium (micro-interações e glows sutis).
