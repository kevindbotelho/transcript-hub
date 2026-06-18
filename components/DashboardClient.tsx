'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { 
  AudioLines, 
  Search, 
  FileText, 
  UploadCloud, 
  Clock, 
  HardDrive, 
  Copy, 
  Check, 
  LogOut, 
  User, 
  AlertCircle, 
  X, 
  PlayCircle,
  Sparkles,
  Loader2,
  ArrowLeft,
  Minimize2,
  Maximize2,
  Folder,
  FolderOpen,
  FolderPlus,
  Pin,
  PinOff,
  Trash2,
  Edit2,
  MoreVertical,
  Plus,
  ArrowUpDown,
  ChevronRight
} from 'lucide-react';

interface Transcription {
  id: string;
  file_name: string;
  file_size: number;
  audio_duration: number | null; // em segundos
  transcription_text: string;
  created_at: string;
  title?: string | null;
  is_pinned?: boolean;
  folder_id?: string | null;
}

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  transcriptionId?: string;
}

interface DashboardClientProps {
  userEmail: string;
}

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  // Separar o nome do arquivo da extensão para renomeação padrão macOS
  const getBaseAndExt = (filename: string) => {
    const idx = filename.lastIndexOf('.');
    if (idx === -1) return { base: filename, ext: '' };
    return { base: filename.substring(0, idx), ext: filename.substring(idx) };
  };

  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [activeTab, setActiveTab] = useState<'transcribe' | 'files' | 'profile'>('transcribe');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de Pastas & Filtros
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'alphabetical'>('date');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Estados para Drag & Drop e Seleção Múltipla de Áudios
  const [selectedAudioIds, setSelectedAudioIds] = useState<string[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(null);
  const [activeDraggedFolderId, setActiveDraggedFolderId] = useState<string | null>(null);
  const [activeDraggedFolderIds, setActiveDraggedFolderIds] = useState<string[]>([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [selectionAnchorFolderId, setSelectionAnchorFolderId] = useState<string | null>(null);
  const [activeDraggedAudioIds, setActiveDraggedAudioIds] = useState<string[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverBreadcrumbId, setDragOverBreadcrumbId] = useState<string | null>(null);
  
  // Estados de Menus e Edições
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  // Estado do Modal de Confirmação de Exclusão
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'folder' | 'transcription';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'folder',
    id: '',
    title: '',
    message: ''
  });
  
  // Estados de Upload
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Estados da Fila de Processamento
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  
  // Estados para Modal de Mover Hierárquico
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);
  
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obter caminhos completos de pastas (ex: Pasta A > Subpasta B)
  const getFolderPath = (folderId: string, allFolders: Folder[]): string => {
    const path: string[] = [];
    let current = allFolders.find(f => f.id === folderId);
    while (current) {
      path.unshift(current.name);
      if (current.parent_id) {
        current = allFolders.find(f => f.id === current!.parent_id);
      } else {
        current = undefined;
      }
    }
    return path.join(' > ');
  };

  // Memoizar pastas ordenadas pelo caminho completo para exibição nos seletores
  const foldersWithPaths = useMemo(() => {
    return folders.map(f => ({
      ...f,
      path: getFolderPath(f.id, folders)
    })).sort((a, b) => a.path.localeCompare(b.path));
  }, [folders]);

  // Recursão para buscar IDs de subpastas descendentes
  const getDescendantFolderIds = (folderId: string, allFolders: Folder[]): string[] => {
    const ids: string[] = [];
    const getChildren = (id: string) => {
      const children = allFolders.filter(f => f.parent_id === id);
      children.forEach(c => {
        ids.push(c.id);
        getChildren(c.id);
      });
    };
    getChildren(folderId);
    return ids;
  };

  // Breadcrumbs para navegação hierárquica
  const getBreadcrumbs = useMemo(() => {
    const crumbs: { id: string | null; name: string }[] = [];
    let current = folders.find(f => f.id === selectedFolderId);
    while (current) {
      crumbs.unshift({ id: current.id, name: current.name });
      if (current.parent_id) {
        current = folders.find(f => f.id === current!.parent_id);
      } else {
        current = undefined;
      }
    }
    crumbs.unshift({ id: null, name: 'Início' });
    return crumbs;
  }, [folders, selectedFolderId]);

  // Gera recursivamente a árvore hierárquica de pastas com profundidade (depth) e ordenação alfabética
  const buildFolderTree = (
    allFolders: Folder[],
    parentId: string | null = null,
    depth = 0
  ): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = [];
    const levelFolders = allFolders
      .filter(f => f.parent_id === parentId)
      .sort((a, b) => a.name.localeCompare(b.name));
      
    levelFolders.forEach(folder => {
      result.push({ id: folder.id, name: folder.name, depth });
      const children = buildFolderTree(allFolders, folder.id, depth + 1);
      result.push(...children);
    });
    return result;
  };

  // Memoizar a árvore para evitar recálculos desnecessários
  const folderTree = useMemo(() => {
    return buildFolderTree(folders, null, 0);
  }, [folders]);

  // Validação de destino válida para movimentação de pastas e áudios via Modal
  const isMoveTargetValid = (targetFolderId: string | null) => {
    // Se estiver movendo pastas
    if (selectedFolderIds.length > 0) {
      // Não pode mover para si mesma
      if (targetFolderId && selectedFolderIds.includes(targetFolderId)) return false;
      
      // Não pode mover para subpastas descendentes de si mesma
      for (const id of selectedFolderIds) {
        const descendants = getDescendantFolderIds(id, folders);
        if (targetFolderId && descendants.includes(targetFolderId)) return false;
      }
      
      // Não pode mover para a mesma pasta pai onde todas as pastas já estão
      const allAlreadyInTarget = selectedFolderIds.every(id => {
        const folder = folders.find(f => f.id === id);
        return folder && folder.parent_id === targetFolderId;
      });
      if (allAlreadyInTarget) return false;
    }
    
    // Se estiver movendo áudios
    if (selectedAudioIds.length > 0) {
      // Não pode mover para a mesma pasta onde todos os áudios selecionados já estão
      const allInTarget = selectedAudioIds.every(id => {
        const audio = transcriptions.find(t => t.id === id);
        return audio && audio.folder_id === targetFolderId;
      });
      if (allInTarget) return false;
    }
    
    return true;
  };



  const fetchTranscriptions = async () => {
    try {
      const res = await fetch('/api/transcriptions');
      if (res.ok) {
        const data = await res.json();
        setTranscriptions(data);
      }
    } catch (err) {
      console.error('Erro ao buscar transcrições:', err);
    }
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (err) {
      console.error('Erro ao buscar pastas:', err);
    }
  };

  // Carregar histórico de transcrições e pastas do Supabase
  useEffect(() => {
    async function loadData() {
      setIsLoadingHistory(true);
      await Promise.all([fetchTranscriptions(), fetchFolders()]);
      setIsLoadingHistory(false);
    }
    loadData();
  }, []);

  // Criar elemento visual temporário de arrasto (estilo macOS Finder - ampliado)
  const createDragGhost = (count: number, type: 'audio' | 'folder', label: string) => {
    const ghost = document.createElement('div');
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.left = '-1000px';
    ghost.style.zIndex = '9999';
    ghost.style.pointerEvents = 'none';
    ghost.className = "flex items-center gap-3.5 rounded-2xl bg-slate-950/95 border-2 border-cyan-400/60 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-md font-geist select-none scale-105";

    const iconSvg = type === 'folder'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder shrink-0"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text shrink-0"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;

    ghost.innerHTML = `
      <div class="relative flex items-center justify-center shrink-0 mr-1.5">
        ${iconSvg}
        ${count > 1 ? `
          <span class="absolute -top-3.5 -right-3.5 bg-cyan-400 text-slate-950 font-mono-jb text-[10px] font-extrabold w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-950 animate-bounce">
            ${count}
          </span>
        ` : ''}
      </div>
      <span class="truncate max-w-[240px] font-semibold leading-none text-slate-100 tracking-wide">${label}</span>
    `;

    document.body.appendChild(ghost);
    return ghost;
  };

  // Clique em áudio para gerenciar seleção múltipla
  const handleAudioClick = (e: React.MouseEvent, clickedAudio: Transcription) => {
    setActiveMenuId(null);
    // Limpa a seleção de pastas ao selecionar áudio
    setSelectedFolderIds([]);
    setSelectionAnchorFolderId(null);

    if (e.shiftKey && selectionAnchorId) {
      const indexAnchor = sortedTranscriptions.findIndex(t => t.id === selectionAnchorId);
      const indexClicked = sortedTranscriptions.findIndex(t => t.id === clickedAudio.id);

      if (indexAnchor !== -1 && indexClicked !== -1) {
        const start = Math.min(indexAnchor, indexClicked);
        const MathEnd = Math.max(indexAnchor, indexClicked);
        const sliced = sortedTranscriptions.slice(start, MathEnd + 1);
        setSelectedAudioIds(sliced.map(t => t.id));
      }
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedAudioIds(prev => {
        if (prev.includes(clickedAudio.id)) {
          return prev.filter(id => id !== clickedAudio.id);
        } else {
          return [...prev, clickedAudio.id];
        }
      });
      setSelectionAnchorId(clickedAudio.id);
    } else {
      setSelectedAudioIds([clickedAudio.id]);
      setSelectionAnchorId(clickedAudio.id);
    }
  };

  // Clique em pasta para gerenciar seleção múltipla
  const handleFolderClick = (e: React.MouseEvent, clickedFolder: Folder) => {
    setActiveMenuId(null);
    // Limpa a seleção de áudios ao selecionar pasta
    setSelectedAudioIds([]);
    setSelectionAnchorId(null);

    if (e.shiftKey && selectionAnchorFolderId) {
      const indexAnchor = currentFolders.findIndex(f => f.id === selectionAnchorFolderId);
      const indexClicked = currentFolders.findIndex(f => f.id === clickedFolder.id);

      if (indexAnchor !== -1 && indexClicked !== -1) {
        const start = Math.min(indexAnchor, indexClicked);
        const MathEnd = Math.max(indexAnchor, indexClicked);
        const sliced = currentFolders.slice(start, MathEnd + 1);
        setSelectedFolderIds(sliced.map(f => f.id));
      }
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedFolderIds(prev => {
        if (prev.includes(clickedFolder.id)) {
          return prev.filter(id => id !== clickedFolder.id);
        } else {
          return [...prev, clickedFolder.id];
        }
      });
      setSelectionAnchorFolderId(clickedFolder.id);
    } else {
      setSelectedFolderIds([clickedFolder.id]);
      setSelectionAnchorFolderId(clickedFolder.id);
    }
  };

  // Handlers para arrastar Áudios
  const handleAudioDragStart = (e: React.DragEvent, audio: Transcription) => {
    let targetIds = selectedAudioIds;
    if (!selectedAudioIds.includes(audio.id)) {
      targetIds = [audio.id];
      setSelectedAudioIds(targetIds);
      setSelectionAnchorId(audio.id);
    }

    setActiveDraggedAudioIds(targetIds);
    setActiveDraggedFolderId(null); // Garante que não mistura
    setActiveDraggedFolderIds([]);

    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'audio-batch',
      audioIds: targetIds
    }));

    const ghost = createDragGhost(
      targetIds.length,
      'audio',
      targetIds.length === 1 ? (audio.title || audio.file_name) : `${targetIds.length} arquivos`
    );
    e.dataTransfer.setDragImage(ghost, 45, 45);
    setTimeout(() => {
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost);
      }
    }, 0);
  };

  const handleAudioDragEnd = () => {
    setActiveDraggedAudioIds([]);
  };

  // Handlers para arrastar Pastas
  const handleFolderDragStart = (e: React.DragEvent, folder: Folder) => {
    let targetIds = selectedFolderIds;
    if (!selectedFolderIds.includes(folder.id)) {
      targetIds = [folder.id];
      setSelectedFolderIds(targetIds);
      setSelectionAnchorFolderId(folder.id);
    }

    setActiveDraggedFolderIds(targetIds);
    setActiveDraggedFolderId(folder.id);
    setActiveDraggedAudioIds([]); // Garante que não mistura

    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'folder-batch',
      folderIds: targetIds
    }));

    const ghost = createDragGhost(
      targetIds.length,
      'folder',
      targetIds.length === 1 ? folder.name : `${targetIds.length} pastas`
    );
    e.dataTransfer.setDragImage(ghost, 45, 45);
    setTimeout(() => {
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost);
      }
    }, 0);
  };

  const handleFolderDragEnd = () => {
    setActiveDraggedFolderId(null);
    setActiveDraggedFolderIds([]);
  };

  // Validação de Destino do Drop
  const isDropTargetValid = (targetFolderId: string | null) => {
    if (activeDraggedFolderIds.length > 0) {
      if (targetFolderId && activeDraggedFolderIds.includes(targetFolderId)) return false;
      
      for (const id of activeDraggedFolderIds) {
        const descendants = getDescendantFolderIds(id, folders);
        if (targetFolderId && descendants.includes(targetFolderId)) return false;
      }
      
      const allAlreadyInTarget = activeDraggedFolderIds.every(id => {
        const folder = folders.find(f => f.id === id);
        return folder && folder.parent_id === targetFolderId;
      });
      if (allAlreadyInTarget) return false;
    } else if (activeDraggedFolderId) {
      if (activeDraggedFolderId === targetFolderId) return false;
      const descendants = getDescendantFolderIds(activeDraggedFolderId, folders);
      if (targetFolderId && descendants.includes(targetFolderId)) return false;
      
      const draggedFolder = folders.find(f => f.id === activeDraggedFolderId);
      if (draggedFolder && draggedFolder.parent_id === targetFolderId) return false;
    }

    if (activeDraggedAudioIds.length > 0) {
      const allInTarget = activeDraggedAudioIds.every(id => {
        const audio = transcriptions.find(t => t.id === id);
        return audio && audio.folder_id === targetFolderId;
      });
      if (allInTarget) return false;
    }

    return true;
  };

  // Handlers de hover / drop nas pastas da lista
  const handleFolderDragOver = (e: React.DragEvent, targetFolderId: string | null) => {
    if (isDropTargetValid(targetFolderId)) {
      e.preventDefault();
      setDragOverFolderId(targetFolderId);
    }
  };

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null);
  };

  // Handlers de hover / drop nos Breadcrumbs
  const handleCrumbDragOver = (e: React.DragEvent, targetFolderId: string | null) => {
    if (isDropTargetValid(targetFolderId)) {
      e.preventDefault();
      setDragOverBreadcrumbId(targetFolderId === null ? 'root' : targetFolderId);
    }
  };

  const handleCrumbDragLeave = () => {
    setDragOverBreadcrumbId(null);
  };

  // Execução do Drop e atualização no Supabase/Estado local
  const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverFolderId(null);
    setDragOverBreadcrumbId(null);

    // Mover pastas
    if (activeDraggedFolderIds.length > 0) {
      const folderIds = [...activeDraggedFolderIds];
      
      setFolders(prev => prev.map(f => folderIds.includes(f.id) ? { ...f, parent_id: targetFolderId } : f));
      setActiveDraggedFolderIds([]);
      setActiveDraggedFolderId(null);
      setSelectedFolderIds([]);
      setSelectionAnchorFolderId(null);

      try {
        await Promise.all(folderIds.map(async (fid) => {
          const response = await fetch(`/api/folders/${fid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent_id: targetFolderId })
          });
          if (!response.ok) throw new Error(`Falha ao mover pasta ${fid}`);
        }));
      } catch (err) {
        console.error(err);
        fetchFolders(); // Restabelece em caso de falha
      }
    } else if (activeDraggedFolderId) {
      const folderId = activeDraggedFolderId;
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parent_id: targetFolderId } : f));
      setActiveDraggedFolderId(null);

      try {
        const response = await fetch(`/api/folders/${folderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: targetFolderId })
        });
        if (!response.ok) throw new Error('Erro ao mover pasta');
      } catch (err) {
        console.error(err);
        fetchFolders(); // Restabelece em caso de falha
      }
    }

    // Mover áudios
    if (activeDraggedAudioIds.length > 0) {
      const audioIds = [...activeDraggedAudioIds];
      setTranscriptions(prev => prev.map(t => audioIds.includes(t.id) ? { ...t, folder_id: targetFolderId } : t));
      
      setSelectedAudioIds([]);
      setSelectionAnchorId(null);
      setActiveDraggedAudioIds([]);

      try {
        await Promise.all(audioIds.map(async (id) => {
          const response = await fetch(`/api/transcriptions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder_id: targetFolderId })
          });
          if (!response.ok) throw new Error(`Falha ao mover áudio ${id}`);
        }));
      } catch (err) {
        console.error(err);
        fetchTranscriptions(); // Restabelece em caso de falha
      }
    }
  };

  // Movimentação em lote de áudios selecionados
  const handleBatchMove = async (targetFolderId: string | null) => {
    const actualFolderId = targetFolderId === "raiz" ? null : targetFolderId;
    const audioIds = [...selectedAudioIds];
    
    // Atualização otimista
    setTranscriptions(prev => prev.map(t => audioIds.includes(t.id) ? { ...t, folder_id: actualFolderId } : t));
    
    setSelectedAudioIds([]);
    setSelectionAnchorId(null);

    try {
      await Promise.all(audioIds.map(async (id) => {
        const response = await fetch(`/api/transcriptions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folder_id: actualFolderId })
        });
        if (!response.ok) throw new Error(`Falha ao mover áudio ${id}`);
      }));
    } catch (err) {
      console.error("Erro ao mover lote de áudios:", err);
      fetchTranscriptions(); // restaura em caso de falha
    }
  };

  // Confirma e executa a movimentação em lote (de áudios ou pastas) via Modal
  const handleConfirmMove = async () => {
    setIsMoveModalOpen(false);
    const targetFolderId = moveTargetFolderId;

    // Se estiver movendo áudios
    if (selectedAudioIds.length > 0) {
      await handleBatchMove(targetFolderId);
    }
    
    // Se estiver movendo pastas
    if (selectedFolderIds.length > 0) {
      const folderIds = [...selectedFolderIds];
      
      // Atualização otimista
      setFolders(prev => prev.map(f => folderIds.includes(f.id) ? { ...f, parent_id: targetFolderId } : f));
      setSelectedFolderIds([]);
      setSelectionAnchorFolderId(null);

      try {
        await Promise.all(folderIds.map(async (fid) => {
          const response = await fetch(`/api/folders/${fid}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent_id: targetFolderId })
          });
          if (!response.ok) throw new Error(`Falha ao mover pasta ${fid}`);
        }));
      } catch (err) {
        console.error("Erro ao mover pastas em lote:", err);
        fetchFolders(); // Restabelece em caso de falha
      }
    }
  };

  // Solicitação de exclusão em lote de áudios selecionados
  const handleBatchDeleteRequest = () => {
    setDeleteModal({
      isOpen: true,
      type: 'transcription',
      id: 'batch', // ID especial para lote
      title: 'Excluir Áudios em Lote',
      message: `Tem certeza que deseja excluir os ${selectedAudioIds.length} áudios selecionados? Essa ação é permanente e não poderá ser desfeita.`
    });
  };

  // Atalho de teclado para excluir com a tecla Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se o usuário estiver digitando em campos de entrada
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Delete') {
        if (selectedAudioIds.length > 0) {
          e.preventDefault();
          handleBatchDeleteRequest();
        } else if (selectedFolderIds.length > 0) {
          e.preventDefault();
          setDeleteModal({
            isOpen: true,
            type: 'folder',
            id: 'batch-folders',
            title: 'Excluir Pastas em Lote',
            message: `Tem certeza que deseja excluir as ${selectedFolderIds.length} pastas selecionadas? Todos os áudios dentro delas serão movidos para a raiz.`
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAudioIds, selectedFolderIds]);

  // Fechar dropdowns de ação ao clicar fora e cancelar edição de detalhes
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.dropdown-menu-trigger') && !target.closest('.dropdown-menu-content')) {
        setActiveMenuId(null);
      }
      if (isEditingDetails && !target.closest('.details-rename-container')) {
        setIsEditingDetails(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [isEditingDetails]);

  // Resetar estado de edição de detalhes ao mudar de áudio
  useEffect(() => {
    setIsEditingDetails(false);
  }, [selectedId]);

  // Handlers para Pasta
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newFolderName.trim(),
          parent_id: selectedFolderId 
        })
      });
      if (response.ok) {
        const folder = await response.json();
        setFolders(prev => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
        setNewFolderName('');
        setIsCreatingFolder(false);
      }
    } catch (err) {
      console.error('Erro ao criar pasta:', err);
    }
  };

  const handleRenameFolder = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });
      if (response.ok) {
        const folder = await response.json();
        setFolders(prev => prev.map(f => f.id === id ? folder : f).sort((a, b) => a.name.localeCompare(b.name)));
        setEditingFolderId(null);
      }
    } catch (err) {
      console.error('Erro ao renomear pasta:', err);
    }
  };

  const requestDeleteFolder = (id: string) => {
    const folder = folders.find(f => f.id === id);
    setDeleteModal({
      isOpen: true,
      type: 'folder',
      id,
      title: 'Excluir Pasta',
      message: `Ao excluir a pasta "${folder?.name || ''}", todas as transcrições contidas nela serão mantidas e movidas para a raiz. Deseja continuar?`
    });
  };

  // Handlers para Transcrição
  const handleRenameTranscription = async (id: string, newTitleBase: string) => {
    const original = transcriptions.find(t => t.id === id);
    if (!original) return;
    
    const currentName = original.title || original.file_name;
    const { ext } = getBaseAndExt(currentName);
    const finalTitle = newTitleBase.trim() ? newTitleBase.trim() + ext : null;

    try {
      const response = await fetch(`/api/transcriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: finalTitle })
      });
      if (response.ok) {
        const updated = await response.json();
        setTranscriptions(prev => prev.map(t => t.id === id ? updated : t));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Erro ao renomear transcrição:', err);
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const response = await fetch(`/api/transcriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !currentPin })
      });
      if (response.ok) {
        const updated = await response.json();
        setTranscriptions(prev => prev.map(t => t.id === id ? updated : t));
      }
    } catch (err) {
      console.error('Erro ao fixar/desafixar:', err);
    }
  };

  const handleMoveToFolder = async (id: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/transcriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
      });
      if (response.ok) {
        const updated = await response.json();
        setTranscriptions(prev => prev.map(t => t.id === id ? updated : t));
      }
    } catch (err) {
      console.error('Erro ao mover transcrição:', err);
    }
  };

  const requestDeleteTranscription = (id: string) => {
    const item = transcriptions.find(t => t.id === id);
    setDeleteModal({
      isOpen: true,
      type: 'transcription',
      id,
      title: 'Excluir Transcrição',
      message: `Tem certeza que deseja excluir a transcrição de "${item?.title || item?.file_name || ''}"? Essa ação é permanente e não poderá ser desfeita.`
    });
  };

  const executeDelete = async () => {
    const { type, id } = deleteModal;
    setDeleteModal(prev => ({ ...prev, isOpen: false }));

    if (type === 'folder') {
      if (id === 'batch-folders') {
        const folderIds = [...selectedFolderIds];
        setSelectedFolderIds([]);
        setSelectionAnchorFolderId(null);

        // Atualização otimista
        setFolders(prev => prev.filter(f => !folderIds.includes(f.id)));
        setTranscriptions(prev => prev.map(t => t.folder_id && folderIds.includes(t.folder_id) ? { ...t, folder_id: null } : t));

        try {
          await Promise.all(folderIds.map(async (fid) => {
            const response = await fetch(`/api/folders/${fid}`, {
              method: 'DELETE'
            });
            if (!response.ok) throw new Error(`Falha ao excluir pasta ${fid}`);
          }));
        } catch (err) {
          console.error('Erro ao deletar pastas em lote:', err);
          fetchFolders();
          fetchTranscriptions();
        }
      } else {
        try {
          const response = await fetch(`/api/folders/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            const deletedIds = [id, ...getDescendantFolderIds(id, folders)];
            setFolders(prev => prev.filter(f => !deletedIds.includes(f.id)));
            setTranscriptions(prev => prev.map(t => t.folder_id && deletedIds.includes(t.folder_id) ? { ...t, folder_id: null } : t));
            if (selectedFolderId && deletedIds.includes(selectedFolderId)) {
              const folderToDelete = folders.find(f => f.id === id);
              const parentId = folderToDelete?.parent_id;
              setSelectedFolderId(parentId && !deletedIds.includes(parentId) ? parentId : null);
            }
          }
        } catch (err) {
          console.error('Erro ao deletar pasta:', err);
        }
      }
    } else if (type === 'transcription') {
      if (id === 'batch') {
        const audioIds = [...selectedAudioIds];
        // Otimista
        setTranscriptions(prev => prev.filter(t => !audioIds.includes(t.id)));
        setSelectedAudioIds([]);
        setSelectionAnchorId(null);
        setSelectedId(null);

        try {
          await Promise.all(audioIds.map(async (aid) => {
            const response = await fetch(`/api/transcriptions/${aid}`, {
              method: 'DELETE'
            });
            if (!response.ok) throw new Error(`Falha ao excluir áudio ${aid}`);
          }));
        } catch (err) {
          console.error("Erro ao excluir lote de áudios:", err);
          fetchTranscriptions(); // restaura
        }
      } else {
        try {
          const response = await fetch(`/api/transcriptions/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            setTranscriptions(prev => prev.filter(t => t.id !== id));
            if (selectedId === id) setSelectedId(null);
          }
        } catch (err) {
          console.error('Erro ao deletar transcrição:', err);
        }
      }
    }
  };

  const renderTranscriptionItem = (t: Transcription) => {
    const isActive = t.id === selectedId;
    const isMultiSelected = selectedAudioIds.includes(t.id);
    const isHighlighted = isActive || isMultiSelected;

    return (
      <div
        key={t.id}
        draggable="true"
        onDragStart={(e) => handleAudioDragStart(e, t)}
        onDragEnd={handleAudioDragEnd}
        onClick={(e) => {
          e.stopPropagation();
          handleAudioClick(e, t);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setSelectedId(t.id);
        }}
        className={`group relative flex items-center rounded-xl border transition-all duration-200 font-geist select-none cursor-pointer ${
          activeMenuId === t.id ? 'z-30' : 'z-0'
        } ${
          isHighlighted
            ? 'bg-cyan-400/[0.06] border-cyan-400/30 text-white shadow-[inset_0_1px_1px_rgba(34,211,238,0.15)]'
            : 'bg-white/[0.01] border-white/[0.05] text-slate-300 hover:bg-white/[0.04] hover:border-white/10'
        }`}
        title="Clique simples para selecionar. Duplo clique para abrir."
      >
        <div className="flex-1 p-3 pr-14 flex items-start gap-2.5 overflow-hidden">
          <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${isHighlighted ? 'text-cyan-400' : 'text-slate-400'}`} />
          <div className="space-y-1 overflow-hidden flex-1">
            {editingId === t.id ? (
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => handleRenameTranscription(t.id, editingTitle)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameTranscription(t.id, editingTitle);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                className="bg-slate-950 border border-cyan-400/50 rounded px-1.5 py-0.5 text-xs text-white w-full focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <p className="text-xs font-semibold leading-tight flex items-start gap-1.5 font-geist whitespace-normal break-words">
                {t.is_pinned && <Pin className="h-3 w-3 text-cyan-400 shrink-0 fill-cyan-400/20 mt-0.5" />}
                <span className="line-clamp-2 flex-1">{t.title || t.file_name}</span>
              </p>
            )}
            <div className="flex items-center gap-2 text-[9px] font-mono-jb text-slate-500">
              <span className="flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatDuration(t.audio_duration)}
              </span>
              <span>•</span>
              <span>{formatFileSize(t.file_size)}</span>
            </div>
          </div>
        </div>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 dropdown-menu-trigger">
          {editingId !== t.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(t.id);
                setEditingTitle(getBaseAndExt(t.title || t.file_name).base);
                setActiveMenuId(null);
              }}
              className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Renomear áudio"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(prev => prev === t.id ? null : t.id);
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>

          {activeMenuId === t.id && (
            <div 
              className="absolute right-0 mt-1 w-48 rounded-xl bg-[#0f172a] border border-white/10 p-1.5 shadow-2xl z-50 text-left text-xs dropdown-menu-content font-geist"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  handleTogglePin(t.id, !!t.is_pinned);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                {t.is_pinned ? (
                  <>
                    <PinOff className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Desafixar</span>
                  </>
                ) : (
                  <>
                    <Pin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Fixar no topo</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setEditingId(t.id);
                  setEditingTitle(getBaseAndExt(t.title || t.file_name).base);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span>Renomear</span>
              </button>

              <div className="h-px bg-white/5 my-1" />
              <button
                onClick={() => {
                  requestDeleteTranscription(t.id);
                  setActiveMenuId(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 shrink-0" />
                <span>Excluir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Formata o tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Formata a duração do áudio (H:MM:SS ou MM:SS)
  const formatDuration = (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Formata a data de criação
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pastas filtradas de acordo com o nível atual
  const currentFolders = useMemo(() => {
    return folders.filter(f => f.parent_id === selectedFolderId);
  }, [folders, selectedFolderId]);

  // Transcrições filtradas pelo folder selecionado (ou global se houver busca)
  const currentFolderTranscriptions = useMemo(() => {
    if (searchQuery.trim()) {
      return transcriptions.filter(t => 
        (t.title || t.file_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.transcription_text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return transcriptions.filter(t => t.folder_id === selectedFolderId);
  }, [transcriptions, searchQuery, selectedFolderId]);

  // Ordenação das transcrições (Cronológica vs Alfabética)
  const sortedTranscriptions = useMemo(() => {
    const items = [...currentFolderTranscriptions];
    if (sortBy === 'alphabetical') {
      return items.sort((a, b) => {
        const nameA = (a.title || a.file_name).toLowerCase();
        const nameB = (b.title || b.file_name).toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else {
      return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [currentFolderTranscriptions, sortBy]);

  // Itens fixados no contexto atual (apenas se não houver busca global)
  const pinnedTranscriptions = useMemo(() => {
    if (searchQuery.trim()) return [];
    return sortedTranscriptions.filter(t => t.is_pinned);
  }, [sortedTranscriptions, searchQuery]);

  // Itens não fixados agrupados por data (Hoje, Ontem, Esta semana, Mais antigos) ou simples lista se alfabético
  const groupedUnpinnedTranscriptions = useMemo(() => {
    const unpinned = searchQuery.trim() 
      ? sortedTranscriptions 
      : sortedTranscriptions.filter(t => !t.is_pinned);

    if (sortBy !== 'date') {
      return { 'Todos os áudios': unpinned };
    }

    const groups: { [key: string]: Transcription[] } = {
      'Hoje': [],
      'Ontem': [],
      'Esta semana': [],
      'Mais antigos': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    unpinned.forEach(t => {
      const date = new Date(t.created_at);
      const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      if (itemDate.getTime() === today.getTime()) {
        groups['Hoje'].push(t);
      } else if (itemDate.getTime() === yesterday.getTime()) {
        groups['Ontem'].push(t);
      } else if (date.getTime() >= oneWeekAgo.getTime()) {
        groups['Esta semana'].push(t);
      } else {
        groups['Mais antigos'].push(t);
      }
    });

    return Object.fromEntries(
      Object.entries(groups).filter(([_, items]) => items.length > 0)
    );
  }, [sortedTranscriptions, sortBy, searchQuery]);

  // Transcrição atualmente selecionada
  const selectedTranscription = useMemo(() => {
    return transcriptions.find(t => t.id === selectedId) || null;
  }, [transcriptions, selectedId]);

  // Breadcrumbs unificados para o cabeçalho da área central (para pastas ou áudios)
  const getHeaderBreadcrumbs = useMemo(() => {
    if (selectedTranscription) {
      const crumbs: { id: string | null; name: string; type: 'folder' | 'audio' }[] = [];
      let currentFolderId = selectedTranscription.folder_id;
      let current = folders.find(f => f.id === currentFolderId);
      while (current) {
        crumbs.unshift({ id: current.id, name: current.name, type: 'folder' });
        if (current.parent_id) {
          current = folders.find(f => f.id === current!.parent_id);
        } else {
          current = undefined;
        }
      }
      crumbs.push({ id: selectedTranscription.id, name: selectedTranscription.title || selectedTranscription.file_name, type: 'audio' });
      return crumbs;
    }

    if (selectedFolderId) {
      const crumbs: { id: string | null; name: string; type: 'folder' }[] = [];
      let current = folders.find(f => f.id === selectedFolderId);
      while (current) {
        crumbs.unshift({ id: current.id, name: current.name, type: 'folder' });
        if (current.parent_id) {
          current = folders.find(f => f.id === current!.parent_id);
        } else {
          current = undefined;
        }
      }
      return crumbs;
    }

    return [];
  }, [folders, selectedFolderId, selectedTranscription]);

  // Handler de Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  // Loop de processamento sequencial da fila
  useEffect(() => {
    const processingItem = queue.find(item => item.status === 'processing');
    if (processingItem) return;

    const nextPendingItem = queue.find(item => item.status === 'pending');
    if (nextPendingItem) {
      processQueueItem(nextPendingItem.id);
    }
  }, [queue]);

  // Função para processar um item específico da fila
  const processQueueItem = async (id: string) => {
    const item = queue.find(q => q.id === id);
    if (!item) return;

    // Atualiza status para 'processing'
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'processing', progress: 10 } : q));

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      const formData = new FormData();
      formData.append('file', item.file);

      // Progresso simulado incremental
      progressInterval = setInterval(() => {
        setQueue(prev => prev.map(q => {
          if (q.id === id) {
            const nextProgress = q.progress >= 90 ? 90 : q.progress + 5;
            return { ...q, progress: nextProgress };
          }
          return q;
        }));
      }, 1000);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (progressInterval) clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ocorreu um erro ao processar a transcrição.');
      }

      const newTranscription: Transcription = await response.json();

      setQueue(prev => prev.map(q => q.id === id ? { 
        ...q, 
        status: 'completed', 
        progress: 100, 
        transcriptionId: newTranscription.id 
      } : q));

      // Grava histórico no estado local
      setTranscriptions(prev => [newTranscription, ...prev]);

    } catch (err: any) {
      console.error('Erro ao processar áudio na fila:', err);
      if (progressInterval) clearInterval(progressInterval);
      setQueue(prev => prev.map(q => q.id === id ? { 
        ...q, 
        status: 'failed', 
        progress: 0, 
        error: err.message || 'Falha ao processar o áudio.' 
      } : q));
    }
  };

  // Valida e enfileira múltiplos arquivos
  const enqueueFiles = (files: FileList | File[]) => {
    setFileError(null);
    const filesArray = Array.from(files);
    
    if (filesArray.length === 0) return;

    const allowedExtensions = ['.mp3', '.m4a', '.wav', '.webm'];
    const maxSizeBytes = 25 * 1024 * 1024; // 25 MB

    const newItems: QueueItem[] = [];

    filesArray.forEach((file) => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const hasValidExtension = allowedExtensions.includes(fileExtension);
      const hasValidSize = file.size <= maxSizeBytes;

      let status: 'pending' | 'failed' = 'pending';
      let errorMsg: string | undefined = undefined;

      if (!hasValidExtension) {
        status = 'failed';
        errorMsg = 'Formato inválido (insira .mp3, .m4a, .wav ou .webm).';
      } else if (!hasValidSize) {
        status = 'failed';
        errorMsg = 'Arquivo muito grande (máximo de 25 MB).';
      }

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        status,
        progress: 0,
        error: errorMsg
      });
    });

    if (newItems.length > 0) {
      setIsQueueOpen(true);
      setQueue(prev => [...prev, ...newItems]);
      setSelectedId(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      enqueueFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      enqueueFiles(e.target.files);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  // Copia o texto para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={() => {
        setSelectedAudioIds([]);
        setSelectedFolderIds([]);
        setSelectionAnchorId(null);
        setSelectionAnchorFolderId(null);
      }}
      className="relative flex-1 h-screen flex flex-col md:grid md:grid-cols-[280px_1fr] bg-[#080c14] text-slate-100 overflow-hidden font-sans"
    >
      
      {/* Background Blobs Aura Estética */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-80">
        <div className="aura-bg-blob-one absolute top-[-20%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-blue-900/10 blur-[8rem] will-change-transform"></div>
        <div className="aura-bg-blob-two absolute bottom-[-15%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-cyan-900/8 blur-[9rem] will-change-transform"></div>
        <div className="aura-bg-dots absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '2.5rem 2.5rem' }}></div>
      </div>

      {/* ==========================================
           1. SIDEBAR LATERAL (MENU DE NAVEGAÇÃO)
           ========================================== */}
      <aside className="relative z-10 flex flex-col border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#090f1a]/45 backdrop-blur-2xl h-full md:h-screen overflow-hidden select-none shrink-0 md:w-[240px]">
        
        {/* Header da Sidebar */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.08] bg-white/[0.02] shrink-0">
          <button
            onClick={() => {
              setActiveTab('transcribe');
              setSelectedId(null);
              setSelectedFolderId(null);
              setSelectedAudioIds([]);
              setSelectionAnchorId(null);
              setSelectedFolderIds([]);
              setSelectionAnchorFolderId(null);
              setSearchQuery('');
            }}
            className="flex items-center gap-2.5 cursor-pointer text-left hover:opacity-80 transition"
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-b from-white to-slate-200 border border-white/20 shadow-md flex items-center justify-center">
              <AudioLines className="h-4.5 w-4.5 text-slate-950" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.03em] font-jakarta">
              Transcript <span className="text-cyan-400 font-semibold">Hub</span>
            </span>
          </button>
        </div>

        {/* Menu de Abas */}
        <nav className="flex-1 p-4 space-y-1.5 font-geist">
          <button
            onClick={() => {
              setActiveTab('transcribe');
              setSelectedId(null);
              setSelectedAudioIds([]);
              setSelectionAnchorId(null);
              setSelectedFolderIds([]);
              setSelectionAnchorFolderId(null);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200 text-xs font-semibold cursor-pointer ${
              activeTab === 'transcribe'
                ? 'bg-cyan-400/[0.06] border-cyan-400/30 text-white shadow-[inset_0_1px_1px_rgba(34,211,238,0.15)] scale-[1.01]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <UploadCloud className={`h-4.5 w-4.5 ${activeTab === 'transcribe' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Transcrever</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('files');
              setSelectedId(null);
              setSelectedAudioIds([]);
              setSelectionAnchorId(null);
              setSelectedFolderIds([]);
              setSelectionAnchorFolderId(null);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200 text-xs font-semibold cursor-pointer ${
              activeTab === 'files'
                ? 'bg-cyan-400/[0.06] border-cyan-400/30 text-white shadow-[inset_0_1px_1px_rgba(34,211,238,0.15)] scale-[1.01]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Folder className={`h-4.5 w-4.5 ${activeTab === 'files' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Meus Áudios</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('profile');
              setSelectedId(null);
              setSelectedAudioIds([]);
              setSelectionAnchorId(null);
              setSelectedFolderIds([]);
              setSelectionAnchorFolderId(null);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-200 text-xs font-semibold cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-cyan-400/[0.06] border-cyan-400/30 text-white shadow-[inset_0_1px_1px_rgba(34,211,238,0.15)] scale-[1.01]'
                : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <User className={`h-4.5 w-4.5 ${activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Perfil</span>
          </button>
        </nav>

        {/* Rodapé da Sidebar (User Info & Logout) */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01] flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-medium text-slate-300 truncate font-geist">{userEmail}</p>
              <p className="text-[8px] font-mono-jb text-slate-500 uppercase tracking-wider">Acesso Admin</p>
            </div>
          </div>
          
          <form action="/auth/signout" method="POST" className="w-full shrink-0">
            <button
              type="submit"
              title="Sair da Conta"
              className="w-full h-10 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-400 flex items-center justify-center gap-2 transition-all cursor-pointer font-geist text-xs font-semibold"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da Conta</span>
            </button>
          </form>
        </div>

      </aside>

      {/* ==========================================
           2. ÁREA CENTRAL (UPLOAD & RESULTADOS)
           ========================================== */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Top Header do Dashboard */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.12] bg-[#080c14]/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {selectedTranscription && (
              <button
                onClick={() => {
                  setSelectedId(null);
                  setActiveTab('files'); // Retorna para Meus Áudios
                }}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium transition cursor-pointer font-geist mr-2 group"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
                <span>Voltar</span>
              </button>
            )}
            {getHeaderBreadcrumbs.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold font-geist text-slate-400 animate-fade-in">
                {getHeaderBreadcrumbs.map((crumb, idx) => {
                  const isLast = idx === getHeaderBreadcrumbs.length - 1;
                  return (
                    <div key={crumb.id || `crumb-${idx}`} className="flex items-center gap-1.5 animate-fade-in">
                      {idx > 0 && <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />}
                      {crumb.type === 'folder' ? (
                        <button
                          onClick={() => {
                            setSelectedFolderId(crumb.id);
                            setSelectedId(null); // Fecha tela de detalhes
                            setSelectedAudioIds([]);
                            setSelectionAnchorId(null);
                            setActiveTab('files'); // Direciona para a aba files
                          }}
                          className={`transition cursor-pointer text-left truncate max-w-[600px] ${
                            isLast ? 'text-cyan-400 font-semibold hover:text-cyan-300' : 'hover:text-white'
                          }`}
                          title={crumb.name}
                        >
                          {crumb.name}
                        </button>
                      ) : (
                        <span className="text-cyan-400 font-semibold truncate max-w-[600px] leading-tight" title={crumb.name}>
                          {crumb.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <h1 className="text-sm font-semibold text-white font-jakarta tracking-tight">
                {activeTab === 'transcribe' ? 'Nova Transcrição' : activeTab === 'files' ? 'Meus Áudios' : 'Perfil do Usuário'}
              </h1>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {!selectedTranscription && activeTab === 'transcribe' && (
              <span className="text-[9px] font-mono-jb text-slate-500 uppercase tracking-widest bg-white/[0.03] border border-white/[0.08] px-2 py-0.5 rounded">
                OpenAI gpt-4o-mini-transcribe
              </span>
            )}
          </div>
        </header>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-hidden p-6 md:p-8 flex flex-col">
          
          {selectedTranscription ? (
            
            /* Caso 2: Visualização de Transcrição Selecionada (Layout Lado a Lado / Fontes Ampliadas) */
            <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center py-4 relative z-10 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
                
                {/* Coluna da Esquerda: Metadados e Ações */}
                <div className="lg:col-span-4 w-full">
                  
                  {/* Card de Informações e Metadados */}
                  <div className="rounded-[2rem] border border-white/[0.08] bg-[#090f1a]/70 p-6 backdrop-blur-2xl relative shadow-xl overflow-hidden group transition-all duration-300 hover:border-cyan-400/20 flex flex-col justify-between h-[520px]">
                    <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '1.5rem 1.5rem' }}></div>
                    
                    <div className="space-y-5 relative z-10 w-full flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(34,211,238,0.15)]">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h3 className="text-[10px] font-mono-jb text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                            <span>Arquivo de Áudio</span>
                            {!isEditingDetails && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsEditingDetails(true);
                                  setEditingTitle(getBaseAndExt(selectedTranscription.title || selectedTranscription.file_name).base);
                                }}
                                className="text-slate-500 hover:text-cyan-400 transition cursor-pointer"
                                title="Renomear transcrição"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                          </h3>
                          {isEditingDetails ? (
                            <div className="flex flex-col gap-2 mt-1.5 details-rename-container">
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameTranscription(selectedTranscription.id, editingTitle);
                                    setIsEditingDetails(false);
                                  } else if (e.key === 'Escape') {
                                    setIsEditingDetails(false);
                                  }
                                }}
                                className="w-full bg-slate-950 border border-cyan-400/50 rounded px-2 py-1 text-xs text-white focus:outline-none"
                                autoFocus
                              />
                              <div className="flex gap-1.5 justify-end">
                                <button
                                  onClick={async () => {
                                    await handleRenameTranscription(selectedTranscription.id, editingTitle);
                                    setIsEditingDetails(false);
                                  }}
                                  className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-[10px] rounded border border-cyan-400/20 hover:bg-cyan-500/20 cursor-pointer font-medium"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setIsEditingDetails(false)}
                                  className="px-3 py-1 bg-white/5 text-slate-400 text-[10px] rounded border border-white/10 hover:bg-white/10 cursor-pointer font-medium"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="min-h-[34px] flex flex-col justify-center">
                              <p className="text-xs font-semibold text-white break-words whitespace-pre-wrap pr-1" title={selectedTranscription.title || selectedTranscription.file_name}>
                                {selectedTranscription.title || selectedTranscription.file_name}
                              </p>
                              {selectedTranscription.title && selectedTranscription.title !== selectedTranscription.file_name && (
                                <p className="text-[9px] text-slate-500 truncate mt-0.5">
                                  Original: {selectedTranscription.file_name}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="h-px bg-white/[0.08]"></div>

                      {/* Grade de Metadados Resumo */}
                      <div className="grid grid-cols-2 gap-4 font-geist">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono-jb text-slate-500 uppercase tracking-wide">Duração</p>
                          <p className="text-sm font-semibold text-slate-200">{formatDuration(selectedTranscription.audio_duration)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono-jb text-slate-500 uppercase tracking-wide">Tamanho</p>
                          <p className="text-sm font-semibold text-slate-200">{formatFileSize(selectedTranscription.file_size)}</p>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <p className="text-[10px] font-mono-jb text-slate-500 uppercase tracking-wide">Processado em</p>
                          <p className="text-xs font-semibold text-slate-300">{formatDate(selectedTranscription.created_at)}</p>
                        </div>
                      </div>

                      <div className="h-px bg-white/[0.08]"></div>

                      {/* Seletor de Pasta */}
                      <div className="space-y-1.5 font-geist">
                        <p className="text-[10px] font-mono-jb text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                          <Folder className="h-3 w-3 text-cyan-400" />
                          <span>Pasta Organizadora</span>
                        </p>
                        <select
                          value={selectedTranscription.folder_id || ''}
                          onChange={(e) => handleMoveToFolder(selectedTranscription.id, e.target.value || null)}
                          className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-400 transition cursor-pointer"
                        >
                          <option value="">Nenhuma pasta (Raiz)</option>
                          {foldersWithPaths.map(f => (
                            <option key={f.id} value={f.id}>{f.path}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="h-px bg-white/[0.08] my-4 relative z-10"></div>

                    {/* Botões de Ação na Coluna da Esquerda */}
                    <div className="relative z-10 pt-1 shrink-0 w-full flex gap-2">
                      <button
                        onClick={() => copyToClipboard(selectedTranscription.transcription_text)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 bg-gradient-to-b from-cyan-400 to-cyan-500 border border-cyan-400 text-slate-950 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:from-cyan-300 hover:to-cyan-400 hover:shadow-[0_8px_20px_rgba(34,211,238,0.25)] shadow-[0_4px_12px_rgba(34,211,238,0.15)] cursor-pointer font-geist"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copiar Texto</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleTogglePin(selectedTranscription.id, !!selectedTranscription.is_pinned)}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0 ${
                          selectedTranscription.is_pinned
                            ? 'bg-cyan-500/10 border-cyan-400 text-cyan-400 hover:bg-cyan-500/20'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={selectedTranscription.is_pinned ? "Desafixar do topo" : "Fixar no topo"}
                      >
                        {selectedTranscription.is_pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Coluna da Direita: Texto Transcrito com Tipografia Ampliada */}
                <div className="lg:col-span-8 w-full rounded-[2rem] border border-white/[0.08] bg-[#090f1a]/70 p-6 sm:p-8 backdrop-blur-2xl relative shadow-xl overflow-hidden flex flex-col h-[520px] group transition-all duration-300 hover:border-cyan-400/20">
                  <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                  
                  {/* Cabeçalho do Resultado */}
                  <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/[0.06] mb-5 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-cyan-400/[0.12] flex items-center justify-center text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.15)]">
                        <Sparkles className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[10px] font-mono-jb text-cyan-300 uppercase tracking-widest font-semibold">Texto Transcrito por Inteligência Artificial</span>
                    </div>
                  </div>

                  {/* Conteúdo do Texto Ampliado */}
                  <div className="relative z-10 flex-1 overflow-y-auto custom-scroll pr-2">
                    <p className="text-sm sm:text-base md:text-[17px] text-slate-300 font-inter leading-8 font-light whitespace-pre-line pr-2 selection:bg-cyan-300/30">
                      {selectedTranscription.transcription_text}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <>
              {activeTab === 'transcribe' && (
                
                /* Caso 3: Área de Upload Principal (Layout Lado a Lado / Fontes Ampliadas) */
                <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center py-6 relative z-10 animate-fade-in">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 lg:items-stretch">
                    
                    {/* Coluna da Esquerda: Introdução e Informações */}
                    <div className="lg:col-span-5 space-y-8 text-left">
                      <div className="space-y-4">
                        <h2 className="text-4xl lg:text-5xl font-light tracking-[-0.04em] text-white font-jakarta leading-tight">
                          Transcreva seu <br className="hidden lg:inline" />
                          <span className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Áudio com IA</span>
                        </h2>
                        <p className="text-base text-slate-400 font-geist font-light leading-relaxed max-w-md">
                          Envie notas de voz do iPhone, reuniões longas ou aulas de faculdade e obtenha a transcrição textual instantaneamente com alta precisão e pontuação inteligente.
                        </p>
                      </div>

                      {/* Banner Informativo / Recomendações em coluna vertical estilizada */}
                      <div className="space-y-4 max-w-md">
                        <div className="rounded-2xl border border-white/[0.06] bg-[#090f1a]/50 p-5 space-y-2 relative overflow-hidden transition hover:border-cyan-400/20 group">
                          <div className="flex items-center gap-2 text-[10px] font-mono-jb text-cyan-300 uppercase tracking-wider font-semibold">
                            <HardDrive className="h-4 w-4 text-cyan-400" />
                            <span>Limite de 25 MB</span>
                          </div>
                          <p className="text-xs text-slate-400 font-geist leading-relaxed">
                            A API OpenAI possui um limite máximo de <strong>25 MB</strong> por arquivo. Certifique-se de realizar o fatiamento ou compactação prévia de áudios extremamente longos.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/[0.06] bg-[#090f1a]/50 p-5 space-y-2 relative overflow-hidden transition hover:border-cyan-400/20 group">
                          <div className="flex items-center gap-2 text-[10px] font-mono-jb text-cyan-300 uppercase tracking-wider font-semibold">
                            <PlayCircle className="h-4 w-4 text-cyan-400" />
                            <span>Formatos Compatíveis</span>
                          </div>
                          <p className="text-xs text-slate-400 font-geist leading-relaxed">
                            Suporte completo para formatos de áudio gravados pelo iPhone (Notas de Voz em `.m4a`) e outros formatos padrão da web: `.mp3`, `.wav` e `.webm`.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Coluna da Direita: Área de Upload */}
                    <div className="lg:col-span-7 space-y-4 w-full flex flex-col">
                      {/* Caixa Drag and Drop de Vidro Expandida */}
                      <div 
                        onDragEnter={handleDrag} 
                        onDragOver={handleDrag} 
                        onDragLeave={handleDrag} 
                        onDrop={handleDrop}
                        onClick={triggerSelectFile}
                        className={`relative w-full flex-1 h-full min-h-[380px] rounded-[2rem] border border-dashed transition-all duration-300 flex flex-col items-center justify-center p-8 text-center cursor-pointer overflow-hidden group bg-[#090f1a]/45 ${
                          isDragActive 
                            ? 'border-cyan-400 bg-cyan-400/[0.03] shadow-[0_0_25px_rgba(34,211,238,0.18)] scale-[1.01]' 
                            : 'border-white/10 hover:border-cyan-400/40 hover:bg-[#090f1a]/70 hover:shadow-[0_0_20px_rgba(34,211,238,0.06)]'
                        }`}
                      >
                        {/* Dot grid de fundo sutil */}
                        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '1.5rem 1.5rem' }}></div>
                        
                        {/* Hidden File Input */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".mp3,.m4a,.wav,.webm"
                          multiple
                          className="hidden"
                        />

                        <div className="relative z-10 space-y-5">
                          <div className="inline-flex w-16 h-16 rounded-full bg-white/[0.02] group-hover:bg-cyan-500/10 border border-white/10 group-hover:border-cyan-400/30 items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-all duration-300 group-hover:scale-105 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                            <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-cyan-400 transition-all" />
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition font-geist">
                              {isDragActive ? 'Solte o arquivo para carregar' : 'Arraste seu arquivo de áudio aqui'}
                            </p>
                            <p className="text-xs text-slate-400 font-geist max-w-[240px] mx-auto leading-relaxed">
                              ou clique para navegar pelos arquivos do seu dispositivo
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap justify-center gap-2 text-[9px] font-mono-jb text-slate-500 pt-2">
                            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded-full uppercase">MP3</span>
                            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded-full uppercase">M4A (iOS)</span>
                            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded-full uppercase">WAV</span>
                            <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded-full uppercase">WEBM</span>
                          </div>
                        </div>
                      </div>

                      {/* Caixa de Erro */}
                      {fileError && (
                        <div className="w-full flex items-center gap-3 rounded-2xl bg-red-950/20 p-4 text-xs text-red-300 border border-red-500/15 font-geist transition-all animate-pulse">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                          <p>{fileError}</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'files' && (
                
                /* Caso 4: Gerenciador de Arquivos/Pastas Completo no Centro */
                <div 
                  onClick={() => {
                    setSelectedAudioIds([]);
                    setSelectedFolderIds([]);
                    setSelectionAnchorId(null);
                    setSelectionAnchorFolderId(null);
                  }}
                  className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-start relative z-10 animate-fade-in space-y-6 min-h-0 overflow-hidden"
                >
                  
                  {/* Cabeçalho de Busca e Controles do Gerenciador */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#090f1a]/50 p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md"
                  >
                    
                    {/* Input de Busca */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar pastas e transcrições..."
                        className="w-full rounded-full bg-slate-950/60 border border-white/10 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:shadow-[0_0_10px_rgba(34,211,238,0.1)] transition font-geist"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer animate-fade-in"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Botões de Ação de Pastas/Ordenação */}
                    <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-geist shrink-0">
                      <button
                        onClick={() => setSortBy(prev => prev === 'date' ? 'alphabetical' : 'date')}
                        className="flex items-center gap-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 px-4 py-2.5 text-slate-300 hover:text-white transition cursor-pointer"
                        title={sortBy === 'date' ? "Alternar para ordem alfabética" : "Alternar para ordem cronológica"}
                      >
                        <ArrowUpDown className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Ordenar: {sortBy === 'date' ? 'Cronológica' : 'Alfabética'}</span>
                      </button>

                      <button
                        onClick={() => setIsCreatingFolder(prev => !prev)}
                        className="flex items-center gap-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 px-4 py-2.5 text-cyan-400 hover:text-cyan-300 transition cursor-pointer font-semibold"
                      >
                        <FolderPlus className="h-3.5 w-3.5" />
                        <span>Nova pasta</span>
                      </button>
                    </div>
                  </div>

                  {/* Criação Dinâmica de Pasta */}
                  {isCreatingFolder && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="p-4 rounded-2xl bg-[#090f1a]/50 border border-white/[0.06] backdrop-blur-md animate-fade-in max-w-md"
                    >
                      <form onSubmit={handleCreateFolder} className="flex flex-col gap-3">
                        <h4 className="text-xs font-semibold text-slate-300 font-geist">Criar Nova Pasta</h4>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Nome da pasta..."
                            className="bg-slate-950 border border-cyan-400/30 focus:border-cyan-400 rounded-xl px-3 py-2 text-xs text-white flex-1 focus:outline-none placeholder-slate-600 transition font-geist"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setIsCreatingFolder(false);
                                setNewFolderName('');
                              }
                            }}
                          />
                          <button
                            type="submit"
                            className="rounded-xl bg-cyan-500/10 border border-cyan-400/20 px-4 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 cursor-pointer transition font-geist"
                          >
                            Criar
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
                            className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs text-slate-400 hover:bg-white/10 cursor-pointer transition font-geist"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Barra de Ações em Lote (Áudios ou Pastas) */}
                  {(selectedAudioIds.length > 0 || selectedFolderIds.length > 0) && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 p-3.5 rounded-2xl bg-slate-950/95 border-2 border-cyan-400/40 flex items-center justify-between text-xs text-slate-200 animate-fade-in gap-8 shadow-[0_15px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl max-w-2xl w-[90%] md:min-w-[620px]"
                    >
                      <span className="font-semibold text-xs bg-cyan-500/10 text-cyan-400 px-3.5 py-1.5 rounded-full font-geist shrink-0">
                        {selectedAudioIds.length > 0 
                          ? `${selectedAudioIds.length} ${selectedAudioIds.length === 1 ? 'áudio selecionado' : 'áudios selecionados'}`
                          : `${selectedFolderIds.length} ${selectedFolderIds.length === 1 ? 'pasta selecionada' : 'pastas selecionadas'}`
                        }
                      </span>
                      
                      <div className="flex items-center gap-3.5 min-w-0 flex-1 justify-end">
                        <button
                          onClick={() => {
                            setMoveTargetFolderId(null);
                            setIsMoveModalOpen(true);
                          }}
                          className="relative flex items-center justify-between gap-6 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-[11px] text-slate-300 hover:text-white hover:border-cyan-400/50 transition cursor-pointer font-geist text-left w-[210px] shrink-0"
                        >
                          <span className="truncate font-medium">
                            {selectedAudioIds.length > 0 ? 'Mover selecionados para...' : 'Mover selecionadas para...'}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 rotate-90 shrink-0" />
                        </button>

                        <button
                          onClick={() => {
                            if (selectedAudioIds.length > 0) {
                              handleBatchDeleteRequest();
                            } else {
                              setDeleteModal({
                                isOpen: true,
                                type: 'folder',
                                id: 'batch-folders',
                                title: 'Excluir Pastas em Lote',
                                message: `Tem certeza que deseja excluir as ${selectedFolderIds.length} pastas selecionadas? Todos os áudios dentro delas serão movidos para a raiz.`
                              });
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition cursor-pointer flex items-center gap-1.5 font-semibold shrink-0"
                          title="Excluir selecionados"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Excluir</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAudioIds([]);
                            setSelectionAnchorId(null);
                            setSelectedFolderIds([]);
                            setSelectionAnchorFolderId(null);
                            setSelectedId(null);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition cursor-pointer shrink-0"
                          title="Limpar seleção"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Gerenciador Central de Arquivos (Grid & Lista) */}
                  <div 
                    onClick={() => {
                      setSelectedAudioIds([]);
                      setSelectedFolderIds([]);
                      setSelectionAnchorId(null);
                      setSelectionAnchorFolderId(null);
                    }}
                    className="flex-1 bg-[#090f1a]/40 border border-white/[0.06] rounded-[2rem] p-6 backdrop-blur-md flex flex-col min-h-0 overflow-hidden relative"
                  >
                    <div className="absolute inset-0 opacity-[0.01] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '1.5rem 1.5rem' }}></div>
                    
                    <div 
                      onClick={() => {
                        setSelectedAudioIds([]);
                        setSelectedFolderIds([]);
                        setSelectionAnchorId(null);
                        setSelectionAnchorFolderId(null);
                      }}
                      className="flex-1 overflow-y-auto custom-scroll px-5 py-2.5 space-y-6 relative z-10"
                    >
                      
                      {/* Breadcrumbs locais */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium font-geist text-slate-400 pb-3 border-b border-white/[0.06]">
                        {getBreadcrumbs.map((crumb, idx) => {
                          const isDragOver = dragOverBreadcrumbId === (crumb.id === null ? 'root' : crumb.id);
                          return (
                            <div key={crumb.id || 'root'} className="flex items-center gap-1.5 animate-fade-in">
                              {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-600 shrink-0" />}
                              <button
                                onClick={() => {
                                  setSelectedFolderId(crumb.id);
                                  setSelectedId(null);
                                  setSelectedAudioIds([]);
                                  setSelectionAnchorId(null);
                                }}
                                onDragOver={(e) => handleCrumbDragOver(e, crumb.id)}
                                onDragLeave={handleCrumbDragLeave}
                                onDrop={(e) => handleDropOnFolder(e, crumb.id)}
                                className={`transition-all duration-200 cursor-pointer text-left truncate max-w-[450px] px-2 py-1 rounded-lg border focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${
                                  isDragOver
                                    ? 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20 shadow-md scale-105'
                                    : idx === getBreadcrumbs.length - 1
                                      ? 'text-cyan-400 font-semibold bg-cyan-400/[0.03] border border-cyan-400/10'
                                      : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                                }`}
                                title={crumb.name}
                              >
                                {crumb.name}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Nome e Edição da Pasta Ativa */}
                      {selectedFolderId !== null && (
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-400/[0.02] border border-cyan-400/10 text-cyan-300">
                          <div className="flex items-center gap-3 text-sm font-semibold font-geist flex-1 pr-3">
                            <FolderOpen className="h-5 w-5 shrink-0 text-cyan-400" />
                            {editingFolderId === selectedFolderId ? (
                              <input
                                type="text"
                                value={editingFolderName}
                                onChange={(e) => setEditingFolderName(e.target.value)}
                                onBlur={() => handleRenameFolder(selectedFolderId, editingFolderName)}
                                onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(selectedFolderId, editingFolderName)}
                                className="bg-transparent text-cyan-300 font-semibold focus:outline-none border-b border-cyan-400/50 w-full"
                                autoFocus
                              />
                            ) : (
                              <span className="line-clamp-2 whitespace-normal break-words leading-tight flex-1">{folders.find(f => f.id === selectedFolderId)?.name}</span>
                            )}
                          </div>
                          {editingFolderId !== selectedFolderId && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingFolderId(selectedFolderId);
                                  setEditingFolderName(folders.find(f => f.id === selectedFolderId)?.name || '');
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition cursor-pointer"
                                title="Renomear pasta"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => requestDeleteFolder(selectedFolderId)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                title="Excluir pasta"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Seção de Pastas em Grid */}
                      {!searchQuery.trim() && currentFolders.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-mono-jb text-slate-500 uppercase tracking-widest pl-1">
                            Pastas
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
                            {currentFolders.map(f => {
                              const isDragOver = dragOverFolderId === f.id;
                              const isEditing = editingFolderId === f.id;
                              return (
                                <div
                                  key={f.id}
                                  draggable={!isEditing}
                                  onDragStart={(e) => handleFolderDragStart(e, f)}
                                  onDragEnd={handleFolderDragEnd}
                                  onDragOver={(e) => handleFolderDragOver(e, f.id)}
                                  onDragLeave={handleFolderDragLeave}
                                  onDrop={(e) => handleDropOnFolder(e, f.id)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFolderClick(e, f);
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFolderId(f.id);
                                    setSelectedId(null);
                                    setSelectedAudioIds([]);
                                    setSelectionAnchorId(null);
                                    setSelectedFolderIds([]);
                                    setSelectionAnchorFolderId(null);
                                  }}
                                  className={`group relative flex items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 text-slate-300 font-geist cursor-pointer ${
                                    isDragOver
                                      ? 'bg-cyan-500/15 border-cyan-400 border-2 shadow-[0_0_25px_rgba(34,211,238,0.3)] text-white scale-[1.05] animate-pulse'
                                      : selectedFolderIds.includes(f.id)
                                        ? 'bg-cyan-400/[0.06] border-cyan-400/35 text-white shadow-[inset_0_1px_1px_rgba(34,211,238,0.2)]'
                                        : 'border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.04] hover:border-white/10'
                                  }`}
                                  title="Clique simples para selecionar. Duplo clique para abrir."
                                >
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editingFolderName}
                                      onChange={(e) => setEditingFolderName(e.target.value)}
                                      onBlur={() => handleRenameFolder(f.id, editingFolderName)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleRenameFolder(f.id, editingFolderName);
                                        } else if (e.key === 'Escape') {
                                          setEditingFolderId(null);
                                        }
                                      }}
                                      className="bg-slate-950 border border-cyan-400/50 rounded-lg px-2.5 py-1.5 text-xs text-white w-full focus:outline-none font-geist"
                                      onClick={(e) => e.stopPropagation()}
                                      autoFocus
                                    />
                                  ) : (
                                    <>
                                      <div className="flex-1 flex items-center gap-3 text-xs font-semibold text-left font-geist pr-2">
                                        <Folder className="h-5 w-5 text-cyan-400 shrink-0" />
                                        <span className="line-clamp-6 whitespace-normal break-words leading-tight flex-1">{f.name}</span>
                                      </div>
                                      
                                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition shrink-0 ml-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingFolderId(f.id);
                                            setEditingFolderName(f.name);
                                          }}
                                          className="p-1 rounded text-slate-500 hover:text-white hover:bg-white/5 transition cursor-pointer"
                                          title="Renomear pasta"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            requestDeleteFolder(f.id);
                                          }}
                                          className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                                          title="Excluir pasta"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Seção de Áudios (Fixados e Comuns) */}
                      {(pinnedTranscriptions.length > 0 || sortedTranscriptions.length > 0) && (
                        <div className="space-y-4 animate-fade-in pt-2">
                          {!searchQuery.trim() && currentFolders.length > 0 && (
                            <div className="h-px bg-white/[0.06] my-4" />
                          )}

                          <div className="text-[10px] font-mono-jb text-slate-500 uppercase tracking-widest pl-1">
                            Áudios
                          </div>

                          {/* Áudios Fixados */}
                          {pinnedTranscriptions.length > 0 && (
                            <div className="space-y-2 pl-2 border-l border-white/[0.03]">
                              <div className="text-[9px] font-mono-jb text-slate-600 uppercase tracking-wider pl-1">
                                Fixados
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {pinnedTranscriptions.map(t => renderTranscriptionItem(t))}
                              </div>
                            </div>
                          )}

                          {/* Lista Principal de Áudios */}
                          <div className="space-y-4">
                            {isLoadingHistory ? (
                              <div className="flex flex-col items-center justify-center p-8 space-y-2 text-slate-500">
                                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                                <span className="text-xs font-geist">Carregando histórico...</span>
                              </div>
                            ) : sortedTranscriptions.length === 0 && folders.length === 0 ? (
                              <div className="p-8 text-center text-sm text-slate-500 font-geist font-light">
                                Nenhuma transcrição encontrada nesta pasta
                              </div>
                            ) : (
                              Object.entries(groupedUnpinnedTranscriptions).map(([groupName, items]) => {
                                if (items.length === 0) return null;
                                return (
                                  <div key={groupName} className="space-y-2 pl-2 border-l border-white/[0.03]">
                                    <div className="text-[9px] font-mono-jb text-slate-600 uppercase tracking-wider pl-1">
                                      {groupName}
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                      {items.map(t => renderTranscriptionItem(t))}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                </div>
              )}

              {activeTab === 'profile' && (
                /* Caso 5: Tela de Perfil e Configurações Completa */
                <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col justify-center py-6 relative z-10 animate-fade-in">
                  <div className="rounded-[2.5rem] border border-white/[0.08] bg-[#090f1a]/70 p-8 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden flex flex-col group transition-all duration-300 hover:border-cyan-400/25">
                    {/* Grid de bolinhas de fundo sutil */}
                    <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '1.5rem 1.5rem' }}></div>
                    
                    {/* Cabeçalho do Perfil (Avatar + Info) */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/[0.08] relative z-10">
                      
                      {/* Avatar com Glow */}
                      <div className="relative shrink-0">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)] relative transition-all duration-300 hover:border-cyan-400/40">
                          <User className="h-9 w-9 text-cyan-400" />
                          
                          {/* Badge de Status Online Pulsante */}
                          <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                          </span>
                        </div>
                      </div>

                      {/* Nome e Acesso */}
                      <div className="space-y-1.5 text-center sm:text-left">
                        <h2 className="text-xl font-bold text-white tracking-tight font-jakarta">Conta do Usuário</h2>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                          <span className="text-slate-300 font-semibold font-geist">{userEmail}</span>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                          <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 rounded-full text-[10px] font-mono-jb uppercase tracking-wider font-bold">
                            Administrador
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Corpo de Configurações */}
                    <div className="py-6 space-y-6 relative z-10 flex-1 font-geist text-left">
                      
                      {/* Seção 1: Chave de API OpenAI */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-cyan-400" />
                            <span>Chave de API OpenAI</span>
                          </label>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-semibold uppercase tracking-wider">
                            <Check className="h-3 w-3" />
                            Configuração Global Ativa
                          </span>
                        </div>

                        {/* Input Estilizado Desabilitado */}
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value="sk-proj-••••••••••••••••••••••••••••••••"
                            className="w-full bg-slate-950/60 border border-white/10 rounded-2xl pl-4 pr-4 py-3 text-xs text-slate-500 font-mono-jb opacity-60 cursor-not-allowed select-none focus:outline-none"
                          />
                        </div>

                        {/* Descrição Explicativa */}
                        <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                          No momento, o processamento de áudio do <strong>Transcript Hub</strong> está configurado com a chave de API global do servidor (faturamento centralizado). Em futuras updates públicas do sistema, você poderá configurar sua própria chave de API pessoal aqui para uso descentralizado.
                        </p>
                      </div>

                      <div className="h-px bg-white/[0.08]"></div>

                      {/* Seção 2: Preferências Gerais */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Preferências Gerais</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Preferência 1: Idioma Padrão */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-400">Idioma de Transcrição Padrão</label>
                            <select
                              disabled
                              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed opacity-60"
                              defaultValue="auto"
                            >
                              <option value="auto">Detecção Automática (Recomendado)</option>
                              <option value="pt">Português (Brasil)</option>
                              <option value="en">Inglês</option>
                              <option value="es">Espanhol</option>
                            </select>
                          </div>

                          {/* Preferência 2: Aparência */}
                          <div className="space-y-1.5">
                            <label className="text-[11px] text-slate-400">Aparência do Sistema</label>
                            <select
                              disabled
                              className="w-full bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-500 cursor-not-allowed opacity-60"
                              defaultValue="dark"
                            >
                              <option value="dark">Tema Escuro Premium (Padrão)</option>
                              <option value="light">Tema Claro (Em breve)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="h-px bg-white/[0.08] my-2 relative z-10"></div>

                    {/* Rodapé das Configurações (Botão Salvar Mock) */}
                    <div className="relative z-10 pt-4 shrink-0 w-full flex justify-end">
                      <button
                        onClick={(e) => {
                          const btn = e.currentTarget;
                          const originalText = btn.innerHTML;
                          btn.disabled = true;
                          btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Salvando...`;
                          
                          setTimeout(() => {
                            btn.innerHTML = `<svg class="h-4 w-4 text-emerald-950 inline mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg> Salvo com sucesso!`;
                            btn.classList.remove('from-cyan-400', 'to-cyan-500', 'hover:from-cyan-300', 'hover:to-cyan-400');
                            btn.classList.add('from-emerald-400', 'to-emerald-500');
                            
                            setTimeout(() => {
                              btn.innerHTML = originalText;
                              btn.disabled = false;
                              btn.classList.remove('from-emerald-400', 'to-emerald-500');
                              btn.classList.add('from-cyan-400', 'to-cyan-500', 'hover:from-cyan-300', 'hover:to-cyan-400');
                            }, 2000);
                          }, 1000);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 bg-gradient-to-b from-cyan-400 to-cyan-500 border border-cyan-400 text-slate-950 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:from-cyan-300 hover:to-cyan-400 hover:shadow-[0_8px_20px_rgba(34,211,238,0.25)] shadow-[0_4px_12px_rgba(34,211,238,0.15)] cursor-pointer font-geist"
                      >
                        Salvar Preferências
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </main>

      {/* ==========================================
           3. PAINEL FLUTUANTE DE FILA (UPLOAD)
           ========================================== */}
      {queue.length > 0 && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 right-6 z-50 w-96 bg-[#090f1a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300"
        >
          
          {/* Cabeçalho do Painel */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              {queue.some(q => q.status === 'processing' || q.status === 'pending') ? (
                <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
              ) : (
                <Check className="h-4 w-4 text-emerald-400" />
              )}
              <span className="text-xs font-semibold text-white font-jakarta">
                {queue.some(q => q.status === 'processing' || q.status === 'pending') 
                  ? 'Transcrevendo áudios...' 
                  : 'Transcrições finalizadas'}
              </span>
              <span className="text-[10px] bg-cyan-400/10 text-cyan-300 px-1.5 py-0.5 rounded-full font-mono">
                {queue.filter(q => q.status === 'completed').length}/{queue.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsQueueOpen(!isQueueOpen)} 
                title={isQueueOpen ? "Minimizar" : "Expandir"}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                {isQueueOpen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              {!queue.some(q => q.status === 'pending' || q.status === 'processing') && (
                <button 
                  onClick={() => setQueue([])} 
                  title="Fechar painel"
                  className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Arquivos (Corpo) */}
          {isQueueOpen && (
            <div className="p-3 max-h-72 overflow-y-auto custom-scroll space-y-2.5 bg-slate-950/20">
              {queue.map((item) => (
                <div key={item.id} className="space-y-1.5 text-left text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-200 truncate pr-2" title={item.file.name}>
                        {item.file.name}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono">
                        {formatFileSize(item.file.size)}
                      </p>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-1.5">
                      {item.status === 'pending' && (
                        <span className="text-slate-500 flex items-center gap-1 text-[10px] font-mono">
                          <Clock className="h-3.5 w-3.5" />
                          Aguardando
                        </span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-cyan-400 flex items-center gap-1 text-[10px] font-mono font-semibold animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          {item.progress}%
                        </span>
                      )}
                      {item.status === 'completed' && (
                        <button
                          onClick={() => item.transcriptionId && setSelectedId(item.transcriptionId)}
                          className="text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 text-[9px] font-medium transition cursor-pointer"
                        >
                          <Check className="h-3 w-3" />
                          Visualizar
                        </button>
                      )}
                      {item.status === 'failed' && (
                        <span className="text-red-400 flex items-center gap-1 text-[10px] font-mono" title={item.error}>
                          <AlertCircle className="h-3.5 w-3.5" />
                          Falhou
                        </span>
                      )}
                    </div>
                  </div>

                  {item.status === 'processing' && (
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {item.status === 'failed' && item.error && (
                    <p className="text-[9px] text-red-300 leading-tight bg-red-950/20 p-1.5 rounded border border-red-500/10">
                      {item.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Customizado de Confirmação de Exclusão */}
      {deleteModal.isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#090f1a]/95 p-8 shadow-2xl relative overflow-hidden text-center font-geist">
            {/* Background Blob */}
            <div className="absolute top-[-20%] left-[-20%] w-60 h-60 rounded-full bg-red-900/10 blur-[4rem] pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
              {/* Icon */}
              <div className="inline-flex w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <Trash2 className="h-6 w-6" />
              </div>

              {/* Title & Msg */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white tracking-tight">
                  {deleteModal.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed px-2">
                  {deleteModal.message}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Cancelar (Safe/Prominent) */}
                <button
                  onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 inline-flex justify-center items-center rounded-full bg-gradient-to-b from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 border border-cyan-400 text-slate-950 px-5 py-3 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_12px_rgba(34,211,238,0.25)] hover:shadow-[0_6px_16px_rgba(34,211,238,0.35)] cursor-pointer"
                >
                  Cancelar
                </button>
                {/* Excluir (Destructive/Outline) */}
                <button
                  onClick={executeDelete}
                  className="flex-1 inline-flex justify-center items-center rounded-full bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-5 py-3 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Customizado de Mover Hierárquico */}
      {isMoveModalOpen && (
        <div 
          onClick={() => setIsMoveModalOpen(false)} 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-[#090f1a]/95 p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] font-geist"
          >
            {/* Background Blob */}
            <div className="absolute top-[-20%] left-[-20%] w-60 h-60 rounded-full bg-cyan-900/10 blur-[4rem] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col h-full min-h-0 space-y-5">
              {/* Header */}
              <div className="space-y-1.5 text-left">
                <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-cyan-400" />
                  Mover para...
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Selecione a pasta de destino para os {selectedAudioIds.length > 0 
                    ? `${selectedAudioIds.length} ${selectedAudioIds.length === 1 ? 'áudio selecionado' : 'áudios selecionados'}`
                    : `${selectedFolderIds.length} ${selectedFolderIds.length === 1 ? 'pasta selecionada' : 'pastas selecionadas'}`
                  }.
                </p>
              </div>

              {/* Lista de Pastas (Hierárquica) */}
              <div className="flex-1 overflow-y-auto custom-scroll space-y-1 py-3 border-y border-white/[0.08] max-h-[45vh] pr-1">
                {/* Opção Raiz (Início) */}
                {(() => {
                  const isValid = isMoveTargetValid(null);
                  const isSelected = moveTargetFolderId === null;
                  return (
                    <button
                      disabled={!isValid}
                      onClick={() => setMoveTargetFolderId(null)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-xl transition duration-150 text-xs text-left cursor-pointer select-none font-geist ${
                        !isValid
                          ? 'opacity-30 cursor-not-allowed text-slate-500'
                          : isSelected
                            ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold'
                            : 'border border-transparent text-slate-300 hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      <HardDrive className={`h-4 w-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>Início (Raiz)</span>
                    </button>
                  );
                })()}

                {/* Subpastas Hierárquicas */}
                {folderTree.map((f) => {
                  const isValid = isMoveTargetValid(f.id);
                  const isSelected = moveTargetFolderId === f.id;
                  return (
                    <button
                      key={f.id}
                      disabled={!isValid}
                      onClick={() => setMoveTargetFolderId(f.id)}
                      style={{ paddingLeft: `${(f.depth + 1) * 16 + 16}px` }}
                      className={`w-full flex items-center gap-2.5 py-2 pr-4 rounded-xl transition duration-150 text-xs text-left cursor-pointer select-none font-geist ${
                        !isValid
                          ? 'opacity-30 cursor-not-allowed text-slate-500'
                          : isSelected
                            ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold'
                            : 'border border-transparent text-slate-300 hover:bg-white/[0.03] hover:text-white'
                      }`}
                    >
                      <Folder className={`h-4 w-4 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span className="truncate">{f.name}</span>
                    </button>
                  );
                })}

                {folderTree.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    Nenhuma subpasta criada no sistema.
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsMoveModalOpen(false)}
                  className="flex-1 inline-flex justify-center items-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-slate-200 px-5 py-3 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmMove}
                  className="flex-1 inline-flex justify-center items-center rounded-full bg-gradient-to-b from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 border border-cyan-400 text-slate-950 px-5 py-3 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_12px_rgba(34,211,238,0.25)] hover:shadow-[0_6px_16px_rgba(34,211,238,0.35)] cursor-pointer"
                >
                  Confirmar Mover
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
