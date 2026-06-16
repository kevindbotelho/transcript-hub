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
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de Pastas & Filtros
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'alphabetical'>('date');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
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
  
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar histórico de transcrições e pastas do Supabase
  useEffect(() => {
    async function fetchTranscriptionsAndFolders() {
      try {
        const [transRes, foldersRes] = await Promise.all([
          fetch('/api/transcriptions'),
          fetch('/api/folders')
        ]);
        if (transRes.ok) {
          const data = await transRes.json();
          setTranscriptions(data);
        }
        if (foldersRes.ok) {
          const data = await foldersRes.json();
          setFolders(data);
        }
      } catch (err) {
        console.error('Erro ao buscar dados do Supabase:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    fetchTranscriptionsAndFolders();
  }, []);

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
        body: JSON.stringify({ name: newFolderName.trim() })
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
      try {
        const response = await fetch(`/api/folders/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setFolders(prev => prev.filter(f => f.id !== id));
          setTranscriptions(prev => prev.map(t => t.folder_id === id ? { ...t, folder_id: null } : t));
          if (selectedFolderId === id) setSelectedFolderId(null);
        }
      } catch (err) {
        console.error('Erro ao deletar pasta:', err);
      }
    } else if (type === 'transcription') {
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
  };

  const renderTranscriptionItem = (t: Transcription) => {
    const isActive = t.id === selectedId;
    return (
      <div
        key={t.id}
        className={`group relative flex items-center rounded-xl border transition-all duration-200 font-geist ${
          activeMenuId === t.id ? 'z-30' : 'z-0'
        } ${
          isActive
            ? 'bg-cyan-400/[0.06] border-cyan-400/30 text-white shadow-[inset_0_1px_1px_rgba(34,211,238,0.15)]'
            : 'bg-white/[0.01] border-white/[0.05] text-slate-300 hover:bg-white/[0.04] hover:border-white/10'
        }`}
      >
        <button
          onClick={() => setSelectedId(t.id)}
          className="flex-1 text-left p-3 pr-8 flex items-start gap-2.5 overflow-hidden cursor-pointer"
        >
          <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
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
              <p className="text-xs font-semibold truncate leading-tight flex items-center gap-1.5 font-geist">
                {t.is_pinned && <Pin className="h-2.5 w-2.5 text-cyan-400 shrink-0 fill-cyan-400/20" />}
                <span className="truncate">{t.title || t.file_name}</span>
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
        </button>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 dropdown-menu-trigger">
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

              {folders.length > 0 && (
                <div className="h-px bg-white/5 my-1" />
              )}
              {folders.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    handleMoveToFolder(t.id, t.folder_id === f.id ? null : f.id);
                    setActiveMenuId(null);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Folder className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </span>
                  {t.folder_id === f.id && <Check className="h-3 w-3 text-cyan-400 shrink-0" />}
                </button>
              ))}

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

      // Abre automaticamente se o usuário não estiver com nenhuma transcrição selecionada
      setSelectedId(prev => prev === null ? newTranscription.id : prev);

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
    <div className="relative flex-1 md:h-screen flex flex-col md:grid md:grid-cols-[280px_1fr] bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      
      {/* Background Blobs Aura Estética */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-80">
        <div className="aura-bg-blob-one absolute top-[-20%] left-[-10%] w-[65vw] h-[65vw] rounded-full bg-blue-900/10 blur-[8rem] will-change-transform"></div>
        <div className="aura-bg-blob-two absolute bottom-[-15%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-cyan-900/8 blur-[9rem] will-change-transform"></div>
        <div className="aura-bg-dots absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '2.5rem 2.5rem' }}></div>
      </div>

      {/* ==========================================
           1. SIDEBAR LATERAL (HISTÓRICO)
           ========================================== */}
      <aside className="relative z-10 flex flex-col border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#090f1a]/45 backdrop-blur-2xl h-full select-none shrink-0">
        
        {/* Header da Sidebar */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/[0.08] bg-white/[0.02]">
          <button
            onClick={() => setSelectedId(null)}
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

        {/* Busca e Controles */}
        <div className="p-4 border-b border-white/[0.05] space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar transcrições..."
              className="w-full rounded-full bg-slate-950/60 border border-white/10 pl-9 pr-9 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:shadow-[0_0_10px_rgba(34,211,238,0.1)] transition font-geist"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between px-1 text-[10px] font-geist">
            <button
              onClick={() => setSortBy(prev => prev === 'date' ? 'alphabetical' : 'date')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              title={sortBy === 'date' ? "Alternar para ordem alfabética" : "Alternar para ordem cronológica"}
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>{sortBy === 'date' ? 'Cronológica' : 'Alfabética'}</span>
            </button>

            {selectedFolderId === null && (
              <button
                onClick={() => setIsCreatingFolder(prev => !prev)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition cursor-pointer"
              >
                <FolderPlus className="h-3 w-3" />
                <span>Nova pasta</span>
              </button>
            )}
          </div>

          {isCreatingFolder && (
            <form onSubmit={handleCreateFolder} className="flex gap-1.5 mt-1.5 animate-fade-in">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nome da pasta..."
                className="flex-1 rounded-lg bg-slate-950/80 border border-white/10 px-2 py-1.5 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-lg bg-cyan-500/10 border border-cyan-400/20 px-2 py-1.5 text-[10px] font-semibold text-cyan-400 hover:bg-cyan-500/20 cursor-pointer"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => { setIsCreatingFolder(false); setNewFolderName(''); }}
                className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-[10px] text-slate-400 hover:bg-white/10 cursor-pointer"
              >
                Cancelar
              </button>
            </form>
          )}
        </div>

        {/* Lista de Transcrições */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-3 space-y-4 max-h-[350px] md:max-h-[calc(100vh-15rem)]">
          
          {/* Seção 1: Navegação de Pasta Ativa */}
          {selectedFolderId !== null && (
            <div className="space-y-1.5 pb-2 border-b border-white/[0.05]">
              <button
                onClick={() => setSelectedFolderId(null)}
                className="w-full text-left rounded-xl p-2.5 bg-white/[0.02] border border-white/[0.05] text-slate-400 hover:text-white hover:bg-white/[0.05] transition flex items-center gap-2 text-[11px] font-medium font-geist cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
                <span>Voltar ao início</span>
              </button>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-400/[0.02] border border-cyan-400/10 text-cyan-300">
                <div className="flex items-center gap-2 text-xs font-semibold font-geist truncate flex-1 pr-2">
                  <FolderOpen className="h-4 w-4 shrink-0 text-cyan-400" />
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
                    <span className="truncate">{folders.find(f => f.id === selectedFolderId)?.name}</span>
                  )}
                </div>
                {editingFolderId !== selectedFolderId && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingFolderId(selectedFolderId);
                        setEditingFolderName(folders.find(f => f.id === selectedFolderId)?.name || '');
                      }}
                      className="p-1 text-slate-500 hover:text-white transition cursor-pointer"
                      title="Renomear pasta"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => requestDeleteFolder(selectedFolderId)}
                      className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                      title="Excluir pasta"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Seção 2: Pastas (Apenas na raiz) */}
          {selectedFolderId === null && !searchQuery.trim() && folders.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] font-mono-jb text-slate-500 uppercase tracking-widest pl-2.5 mb-1.5">
                Pastas
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {folders.map(f => (
                  <div
                    key={f.id}
                    className="group relative flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.01] hover:bg-white/[0.04] p-3 text-left transition text-slate-300 hover:border-white/10 font-geist"
                  >
                    <button
                      onClick={() => setSelectedFolderId(f.id)}
                      className="flex-1 flex items-center gap-2.5 text-xs font-semibold truncate cursor-pointer text-left font-geist"
                    >
                      <Folder className="h-4 w-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                    
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition shrink-0 ml-1">
                      <button
                        onClick={() => requestDeleteFolder(f.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                        title="Excluir pasta"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção 3: Áudios Fixados (Pinned) */}
          {pinnedTranscriptions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] font-mono-jb text-slate-500 uppercase tracking-widest pl-2.5">
                Fixados
              </div>
              <div className="space-y-1.5">
                {pinnedTranscriptions.map(t => renderTranscriptionItem(t))}
              </div>
            </div>
          )}

          {/* Seção 4: Lista Principal (Cronológica Agrupada ou Alfabética Direta) */}
          <div className="space-y-4">
            {isLoadingHistory ? (
              <div className="flex flex-col items-center justify-center p-6 space-y-2 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                <span className="text-[10px] font-geist">Carregando histórico...</span>
              </div>
            ) : sortedTranscriptions.length === 0 && folders.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-geist font-light">
                Nenhuma transcrição encontrada
              </div>
            ) : (
              Object.entries(groupedUnpinnedTranscriptions).map(([groupName, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={groupName} className="space-y-1.5">
                    <div className="text-[9px] font-mono-jb text-slate-500 uppercase tracking-widest pl-2.5">
                      {groupName}
                    </div>
                    <div className="space-y-1.5">
                      {items.map(t => renderTranscriptionItem(t))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Rodapé da Sidebar (User Info & Logout) */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-medium text-slate-300 truncate font-geist">{userEmail}</p>
              <p className="text-[8px] font-mono-jb text-slate-500 uppercase tracking-wider">Acesso Admin</p>
            </div>
          </div>
          
          <form action="/auth/signout" method="POST" className="shrink-0">
            <button
              type="submit"
              title="Sair da Conta"
              className="w-8 h-8 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 text-red-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>

      </aside>

      {/* ==========================================
           2. ÁREA CENTRAL (UPLOAD & RESULTADOS)
           ========================================== */}
      <main className="relative z-10 flex-1 flex flex-col min-w-0">
        
        {/* Top Header do Dashboard */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.08] bg-[#080c14]/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {selectedTranscription && (
              <button
                onClick={() => setSelectedId(null)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium transition cursor-pointer font-geist mr-2 group"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-colors" />
                <span>Voltar</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-white font-jakarta tracking-tight">
                {selectedTranscription ? 'Detalhes da Transcrição' : 'Nova Transcrição'}
              </h1>
              {selectedTranscription && (
                <span className="rounded-full bg-cyan-400/[0.12] border border-cyan-400/20 px-2 py-0.5 text-[9px] font-medium text-cyan-300">
                  Histórico
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!selectedTranscription && (
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
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
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
            
            /* Caso 3: Área de Upload Principal (Layout Lado a Lado / Fontes Ampliadas) */
            <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col justify-center py-6 relative z-10">
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

        </div>

      </main>

      {/* ==========================================
           3. PAINEL FLUTUANTE DE FILA (UPLOAD)
           ========================================== */}
      {queue.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-96 bg-[#090f1a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300">
          
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
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

    </div>
  );
}
