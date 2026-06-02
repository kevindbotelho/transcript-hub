'use client';

import { useState, useRef, useMemo } from 'react';
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
  Loader2
} from 'lucide-react';

interface Transcription {
  id: string;
  file_name: string;
  file_size: number;
  audio_duration: number | null; // em segundos
  transcription_text: string;
  created_at: string;
}

interface DashboardClientProps {
  userEmail: string;
}

// Lista de transcrições iniciais para demonstração visual rica
const INITIAL_MOCK_TRANSCRIPTIONS: Transcription[] = [
  {
    id: '1',
    file_name: 'Aula_de_Quimica_Organica_Parte_2.mp3',
    file_size: 18456000,
    audio_duration: 3650,
    transcription_text: 'Olá a todos. Na aula de hoje nós vamos dar continuidade ao estudo dos compostos de carbono, focando especificamente nas reações de substituição nucleofílica. As reações do tipo SN1 e SN2 são fundamentais para compreender como podemos sintetizar diferentes moléculas orgânicas a partir de haletos de alquila. A velocidade da reação SN1 depende unicamente da concentração do substrato, visto que a etapa determinante envolve a formação de um carbocátion intermediário estável. Já na SN2, temos um processo concertado de etapa única, onde o nucleófilo ataca o carbono pelo lado oposto ao grupo de saída simultaneamente.',
    created_at: '2026-06-02T14:32:00Z',
  },
  {
    id: '2',
    file_name: 'Reuniao_Alinhamento_Semanal_Marketing.wav',
    file_size: 24100000,
    audio_duration: 1820,
    transcription_text: 'Bom dia equipe. Revisando os KPIs da última semana, percebemos um aumento de 15% na taxa de conversão das nossas campanhas de tráfego pago no Instagram. O novo criativo utilizando depoimentos de clientes performou muito acima do esperado, reduzindo o nosso CAC em quase 12%. Para a próxima sprint, o foco principal será estruturar a landing page do novo produto e iniciar os testes com o público B2B no LinkedIn. O orçamento para essa frente está aprovado e a equipe de design deve entregar os mockups de alta fidelidade até quinta-feira.',
    created_at: '2026-06-01T09:15:00Z',
  },
  {
    id: '3',
    file_name: 'Gravação_de_Voz_Ideias_App_Transcrições.m4a',
    file_size: 4200000,
    audio_duration: 450,
    transcription_text: 'Ideia para o Transcript Hub: Seria incrível adicionar uma funcionalidade de resumo automático utilizando IA diretamente na tela de resultado. Algo como um botão "Gerar Resumo" que envie o texto para o GPT-4o-mini e traga tópicos principais, pontos de ação e tarefas pendentes. Isso pouparia muito tempo de quem grava reuniões ou aulas inteiras. Outra coisa seria a divisão de locutores para o futuro, ajudando a identificar quem falou o quê. Preciso mapear isso no backlog do PRD.',
    created_at: '2026-05-30T18:40:00Z',
  },
];

export default function DashboardClient({ userEmail }: DashboardClientProps) {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>(INITIAL_MOCK_TRANSCRIPTIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de Upload
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  
  // Estados de Processamento
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Valida e processa o arquivo selecionado
  const processFile = (file: File) => {
    setFileError(null);
    
    // Suporte a múltiplos formatos suportados e Notas de voz iOS (.m4a)
    const allowedExtensions = ['.mp3', '.m4a', '.wav', '.webm'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      setFileError('Formato inválido. Insira um arquivo .mp3, .m4a, .wav ou .webm');
      return;
    }

    // Limite da OpenAI de 25 MB (25 * 1024 * 1024 bytes)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFileError('Arquivo muito grande. O limite máximo da API é de 25 MB.');
      return;
    }

    // Inicia fluxo simulado de processamento/transcrição por IA
    setIsProcessing(true);
    setProcessingProgress(10);
    setProcessingStatus('Carregando arquivo de áudio...');
    setSelectedId(null);

    // Passo 1: Upload / Buffer do arquivo no servidor
    setTimeout(() => {
      setProcessingProgress(40);
      setProcessingStatus('Conectando à API do Next.js e preparando payload...');
      
      // Passo 2: Chamada ao endpoint da OpenAI (Processando Áudio com gpt-4o-mini-transcribe)
      setTimeout(() => {
        setProcessingProgress(75);
        setProcessingStatus('IA transcrevendo áudio (gpt-4o-mini-transcribe)...');
        
        // Passo 3: Gravação do resultado no Supabase e finalização
        setTimeout(() => {
          setProcessingProgress(100);
          setProcessingStatus('Finalizado! Salvando no banco de dados...');
          
          setTimeout(() => {
            const newId = Date.now().toString();
            const newTranscription: Transcription = {
              id: newId,
              file_name: file.name,
              file_size: file.size,
              audio_duration: Math.floor(Math.random() * 900) + 120, // Simula duração entre 2 e 17 min
              transcription_text: `[Transcrição gerada por IA] Este é um texto simulado representando a transcrição bem-sucedida do arquivo "${file.name}". A transcrição de áudio por inteligência artificial da OpenAI funciona processando os buffers do arquivo e convertendo fonemas em texto estruturado com pontuação inteligente e alta taxa de precisão, ideal para reuniões, notas rápidas e aulas de faculdade.`,
              created_at: new Date().toISOString(),
            };

            setTranscriptions(prev => [newTranscription, ...prev]);
            setSelectedId(newId);
            setIsProcessing(false);
            setProcessingProgress(0);
          }, 800);
        }, 1200);
      }, 1500);
    }, 1200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
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
          
          {filteredTranscriptions.length === 0 ? (
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
          
          {/* Caso 1: Loader de Carregamento/Processamento */}
          {isProcessing ? (
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full text-center space-y-6">
              <div className="relative flex items-center justify-center w-20 h-20">
                {/* Efeito radar brilhante */}
                <div className="absolute inset-0 rounded-full border border-cyan-400 animate-ping opacity-25"></div>
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/35 flex items-center justify-center text-cyan-400">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white font-jakarta tracking-tight">Processando seu Áudio</h3>
                <p className="text-xs text-slate-400 font-geist max-w-xs mx-auto leading-relaxed">
                  {processingStatus}
                </p>
              </div>

              {/* Barra de progresso baseada no design-system */}
              <div className="w-full max-w-xs space-y-1.5">
                <div className="flex justify-between text-[9px] font-mono-jb text-slate-500">
                  <span>Progresso</span>
                  <span className="text-cyan-300">{processingProgress}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-500" 
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : selectedTranscription ? (
            
            /* Caso 2: Visualização de Transcrição Selecionada */
            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full space-y-6">
              
              {/* Top Banner de Metadados */}
              <div className="rounded-2xl border border-white/[0.08] bg-[#090f1a]/60 backdrop-blur-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate pr-4">{selectedTranscription.file_name}</h3>
                    <p className="text-[10px] text-slate-500 font-geist">Processado em {formatDate(selectedTranscription.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[9px] font-mono-jb text-slate-500 uppercase">Duração</p>
                    <p className="text-xs font-semibold text-slate-200">{formatDuration(selectedTranscription.audio_duration)}</p>
                  </div>
                  <div className="h-6 w-px bg-white/[0.08]"></div>
                  <div className="text-right">
                    <p className="text-[9px] font-mono-jb text-slate-500 uppercase">Tamanho</p>
                    <p className="text-xs font-semibold text-slate-200">{formatFileSize(selectedTranscription.file_size)}</p>
                  </div>
                </div>
              </div>

              {/* Caixa do Texto Transcrito (Glassmorphism) */}
              <div className="flex-1 rounded-[2rem] border border-white/[0.08] bg-[#090f1a]/70 p-6 sm:p-8 backdrop-blur-2xl relative shadow-xl overflow-hidden flex flex-col">
                <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                
                {/* Cabeçalho do Resultado */}
                <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/[0.06] mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-400/[0.12] flex items-center justify-center text-cyan-300">
                      <Sparkles className="h-3 w-3" />
                    </span>
                    <span className="text-[10px] font-mono-jb text-cyan-300 uppercase tracking-wider">Texto Transcrito</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(selectedTranscription.transcription_text)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 bg-gradient-to-b from-cyan-400 to-cyan-500 border border-cyan-400 text-slate-950 text-[10px] font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:from-cyan-300 hover:to-cyan-400 cursor-pointer shadow-[0_2px_8px_rgba(34,211,238,0.15)]"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar Texto</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setSelectedId(null)}
                      title="Voltar ao início"
                      className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-slate-200 flex items-center justify-center transition cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Texto */}
                <div className="relative z-10 flex-1 overflow-y-auto custom-scroll max-h-[400px]">
                  <p className="text-xs sm:text-sm text-slate-300 font-inter leading-8 font-light whitespace-pre-line pr-2 selection:bg-cyan-300/30">
                    {selectedTranscription.transcription_text}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            
            /* Caso 3: Área de Upload Principal */
            <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-6">
              
              {/* Header de Introdução */}
              <div className="text-center space-y-2">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-slate-950/60 px-3 py-1.5 text-[9px] text-slate-400 font-geist shadow-xl backdrop-blur-xl">
                  <span className="w-4 h-4 rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center text-[9px] text-cyan-300">★</span>
                  <span>PREMIUM AUDIO CONVERSION</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-light tracking-[-0.04em] text-white font-jakarta">
                  Transcreva seu <span className="font-semibold text-cyan-400">Áudio</span>
                </h2>
                <p className="text-xs text-slate-400 font-geist max-w-xs mx-auto leading-relaxed">
                  Envie notas de voz, reuniões ou aulas e obtenha o texto instantaneamente com precisão cirúrgica.
                </p>
              </div>

              {/* Caixa Drag and Drop de Vidro */}
              <div 
                onDragEnter={handleDrag} 
                onDragOver={handleDrag} 
                onDragLeave={handleDrag} 
                onDrop={handleDrop}
                onClick={triggerSelectFile}
                className={`relative w-full aspect-video sm:h-64 rounded-[2rem] border border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center cursor-pointer overflow-hidden group bg-[#090f1a]/40 ${
                  isDragActive 
                    ? 'border-cyan-400 bg-cyan-400/[0.03] shadow-[0_0_20px_rgba(34,211,238,0.15)] scale-[1.01]' 
                    : 'border-white/10 hover:border-cyan-400/40 hover:bg-[#090f1a]/70 hover:shadow-[0_0_15px_rgba(34,211,238,0.05)]'
                }`}
              >
                {/* Dot grid de fundo sutil */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '1.25rem 1.25rem' }}></div>
                
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".mp3,.m4a,.wav,.webm"
                  className="hidden"
                />

                <div className="relative z-10 space-y-4">
                  <div className="inline-flex w-12 h-12 rounded-full bg-white/[0.02] group-hover:bg-cyan-500/10 border border-white/10 group-hover:border-cyan-400/30 items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-all duration-300 group-hover:scale-105 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition font-geist">
                      {isDragActive ? 'Solte o arquivo para iniciar' : 'Arraste seu arquivo de áudio aqui'}
                    </p>
                    <p className="text-[10px] text-slate-500 font-geist">
                      ou clique para procurar em seu dispositivo
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-1.5 text-[8px] font-mono-jb text-slate-500">
                    <span className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded uppercase">MP3</span>
                    <span className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded uppercase">M4A (iOS)</span>
                    <span className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded uppercase">WAV</span>
                    <span className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.05] rounded uppercase">WEBM</span>
                  </div>
                </div>
              </div>

              {/* Caixa de Erro */}
              {fileError && (
                <div className="w-full flex items-center gap-3 rounded-xl bg-red-950/20 p-4 text-xs text-red-300 border border-red-500/15 font-geist transition-all animate-pulse">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <p>{fileError}</p>
                </div>
              )}

              {/* Banner Informativo / Recomendações */}
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.06] bg-[#090f1a]/40 p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono-jb text-slate-500 uppercase font-semibold">
                    <HardDrive className="h-3 w-3 text-cyan-400" />
                    <span>Limite de Tamanho</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-geist leading-relaxed">
                    A API OpenAI limita arquivos a <strong>25 MB</strong>. Para arquivos maiores, faça fatiamento prévio.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-[#090f1a]/40 p-4 space-y-1">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono-jb text-slate-500 uppercase font-semibold">
                    <PlayCircle className="h-3 w-3 text-cyan-400" />
                    <span>Formatos de Áudio</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-geist leading-relaxed">
                    Compatível com gravações nativas do Gravador de Voz do iPhone 15 e outros formatos padrão.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}
