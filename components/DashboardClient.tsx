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
  Maximize2
} from 'lucide-react';

interface Transcription {
  id: string;
  file_name: string;
  file_size: number;
  audio_duration: number | null; // em segundos
  transcription_text: string;
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
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de Upload
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Estados da Fila de Processamento
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar histórico de transcrições do Supabase
  useEffect(() => {
    async function fetchTranscriptions() {
      try {
        const response = await fetch('/api/transcriptions');
        if (response.ok) {
          const data = await response.json();
          setTranscriptions(data);
        } else {
          console.error('Falha ao carregar o histórico de transcrições.');
        }
      } catch (err) {
        console.error('Erro ao buscar transcrições:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    }
    fetchTranscriptions();
  }, []);

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

  // Filtra as transcrições da busca
  const filteredTranscriptions = useMemo(() => {
    return transcriptions.filter(t => 
      t.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.transcription_text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transcriptions, searchQuery]);

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
    <div className="relative flex-1 flex flex-col md:grid md:grid-cols-[280px_1fr] bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      
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
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-gradient-to-b from-white to-slate-200 border border-white/20 shadow-md flex items-center justify-center">
              <AudioLines className="h-4.5 w-4.5 text-slate-950" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.03em] font-jakarta">
              Transcript <span className="text-cyan-400 font-semibold">Hub</span>
            </span>
          </div>
        </div>

        {/* Busca */}
        <div className="p-4 border-b border-white/[0.05]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar transcrições..."
              className="w-full rounded-full bg-slate-950/60 border border-white/10 pl-9 pr-4 py-2 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40 focus:shadow-[0_0_10px_rgba(34,211,238,0.1)] transition font-geist"
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
        </div>

        {/* Lista de Transcrições */}
        <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-1.5 max-h-[350px] md:max-h-none">
          <div className="text-[9px] font-mono-jb text-slate-500 uppercase tracking-widest pl-2.5 mb-2">
            Histórico de Áudios
          </div>
          
          {isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center p-6 space-y-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              <span className="text-[10px] font-geist">Carregando histórico...</span>
            </div>
          ) : filteredTranscriptions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-geist font-light">
              Nenhuma transcrição encontrada
            </div>
          ) : (
            filteredTranscriptions.map((t) => {
              const isActive = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left rounded-xl p-3 border transition-all duration-200 cursor-pointer font-geist ${
                    isActive
                      ? 'bg-cyan-400/[0.06] border-cyan-400/30 text-white shadow-[inset_0_1px_1px_rgba(34,211,238,0.1)]'
                      : 'bg-white/[0.01] border-white/[0.05] text-slate-300 hover:bg-white/[0.04] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileText className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-xs font-semibold truncate leading-tight">{t.file_name}</p>
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
                </button>
              );
            })
          )}
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
        <div className="flex-1 overflow-y-auto custom-scroll p-6 md:p-8 flex flex-col">
          
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
                          <h3 className="text-[10px] font-mono-jb text-cyan-300 uppercase tracking-wider">Arquivo de Áudio</h3>
                          <p className="text-xs font-semibold text-white break-words whitespace-pre-wrap pr-1" title={selectedTranscription.file_name}>
                            {selectedTranscription.file_name}
                          </p>
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
                    </div>

                    <div className="h-px bg-white/[0.08] my-4 relative z-10"></div>

                    {/* Botões de Ação na Coluna da Esquerda */}
                    <div className="relative z-10 pt-1 shrink-0 w-full">
                      <button
                        onClick={() => copyToClipboard(selectedTranscription.transcription_text)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 bg-gradient-to-b from-cyan-400 to-cyan-500 border border-cyan-400 text-slate-950 text-xs font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:from-cyan-300 hover:to-cyan-400 hover:shadow-[0_8px_20px_rgba(34,211,238,0.25)] shadow-[0_4px_12px_rgba(34,211,238,0.15)] cursor-pointer font-geist"
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

    </div>
  );
}
