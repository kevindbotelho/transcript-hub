import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  getAudioContentType,
  getAudioExtension,
  isValidAudioFileSize,
  TRANSCRIPTION_UPLOAD_BUCKET,
} from '@/lib/transcription/audio';

export const maxDuration = 300;

interface TranscriptionRequestBody {
  uploadPath?: unknown;
  fileName?: unknown;
  fileSize?: unknown;
}

interface OpenAiTranscriptionResponse {
  duration?: number;
  text?: string;
}

function isOwnedTemporaryUploadPath(uploadPath: string, userId: string): boolean {
  const [ownerId, objectName, extraSegment] = uploadPath.split('/');
  return (
    ownerId === userId &&
    !extraSegment &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(mp3|m4a|wav|webm)$/i.test(objectName)
  );
}

function getErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;

  const candidate = error as { error?: { message?: unknown } };
  return typeof candidate.error?.message === 'string' ? candidate.error.message : null;
}

export async function POST(request: Request) {
  let temporaryUploadPath: string | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para transcrever.' },
        { status: 401 }
      );
    }

    const body = await request.json() as TranscriptionRequestBody;
    const uploadPath = typeof body.uploadPath === 'string' ? body.uploadPath : '';
    const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
    const declaredFileSize = typeof body.fileSize === 'number' ? body.fileSize : Number.NaN;
    const extension = getAudioExtension(fileName);

    if (
      !uploadPath ||
      !isOwnedTemporaryUploadPath(uploadPath, user.id) ||
      !fileName ||
      fileName.length > 255 ||
      !extension ||
      !uploadPath.toLowerCase().endsWith(extension)
    ) {
      return NextResponse.json(
        { error: 'Dados do arquivo de áudio inválidos.' },
        { status: 400 }
      );
    }

    if (!isValidAudioFileSize(declaredFileSize)) {
      return NextResponse.json(
        { error: 'Arquivo vazio ou muito grande. O limite máximo é de 25 MB.' },
        { status: 400 }
      );
    }

    temporaryUploadPath = uploadPath;
    const admin = getSupabaseAdmin();
    const { data: audioBlob, error: downloadError } = await admin.storage
      .from(TRANSCRIPTION_UPLOAD_BUCKET)
      .download(uploadPath);

    if (downloadError || !audioBlob) {
      console.error('Erro ao baixar áudio temporário:', downloadError);
      return NextResponse.json(
        { error: 'O upload do áudio não foi encontrado. Envie o arquivo novamente.' },
        { status: 400 }
      );
    }

    if (!isValidAudioFileSize(audioBlob.size) || audioBlob.size !== declaredFileSize) {
      return NextResponse.json(
        { error: 'O arquivo enviado está incompleto ou excede o limite de 25 MB.' },
        { status: 400 }
      );
    }

    const openAiApiKey = process.env.OPENAI_API_KEY;
    if (!openAiApiKey) {
      return NextResponse.json(
        { error: 'Chave de API da OpenAI não configurada no servidor.' },
        { status: 500 }
      );
    }

    const audioFile = new File([audioBlob], fileName, {
      type: getAudioContentType(extension),
    });
    const openAiFormData = new FormData();
    openAiFormData.append('file', audioFile);
    openAiFormData.append('model', 'whisper-1');
    openAiFormData.append('response_format', 'verbose_json');

    const openAiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: openAiFormData,
    });

    if (!openAiResponse.ok) {
      const errorData: unknown = await openAiResponse.json().catch(() => null);
      console.error('Erro retornado pela API da OpenAI:', errorData);
      return NextResponse.json(
        { error: getErrorMessage(errorData) || 'Erro ao processar áudio na API da OpenAI.' },
        { status: openAiResponse.status }
      );
    }

    const openAiData = await openAiResponse.json() as OpenAiTranscriptionResponse;
    const { data: dbData, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_size: audioBlob.size,
        audio_duration: openAiData.duration ? Math.round(openAiData.duration) : null,
        transcription_text: openAiData.text || '',
      })
      .select('id, file_name, file_size, audio_duration, transcription_text, created_at, title, is_pinned, folder_id')
      .single();

    if (dbError) {
      console.error('Erro ao salvar transcrição no banco de dados:', dbError);
      return NextResponse.json(
        { error: 'Áudio transcrito com sucesso, mas falhou ao salvar no histórico do banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json(dbData);
  } catch (error) {
    console.error('Erro interno na rota POST /api/transcribe:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao processar áudio.' },
      { status: 500 }
    );
  } finally {
    if (temporaryUploadPath) {
      try {
        const { error: cleanupError } = await getSupabaseAdmin().storage
          .from(TRANSCRIPTION_UPLOAD_BUCKET)
          .remove([temporaryUploadPath]);

        if (cleanupError) {
          console.error('Erro ao remover áudio temporário:', cleanupError);
        }
      } catch (cleanupError) {
        // A limpeza não deve substituir uma resposta de transcrição já concluída.
        console.error('Erro inesperado ao remover áudio temporário:', cleanupError);
      }
    }
  }
}
