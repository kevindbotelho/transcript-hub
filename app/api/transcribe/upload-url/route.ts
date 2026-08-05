import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
  getAudioExtension,
  getAudioContentType,
  isValidAudioFileSize,
  MAX_AUDIO_FILE_SIZE,
  TRANSCRIPTION_UPLOAD_BUCKET,
} from '@/lib/transcription/audio';

interface UploadRequestBody {
  fileName?: unknown;
  fileSize?: unknown;
}

async function ensureTemporaryUploadBucket() {
  const admin = getSupabaseAdmin();
  const { error: getBucketError } = await admin.storage.getBucket(TRANSCRIPTION_UPLOAD_BUCKET);

  if (!getBucketError) return;
  if (getBucketError.status !== 404) throw getBucketError;

  const { error: createBucketError } = await admin.storage.createBucket(
    TRANSCRIPTION_UPLOAD_BUCKET,
    {
      public: false,
      fileSizeLimit: MAX_AUDIO_FILE_SIZE,
    }
  );

  // Outra requisição pode ter criado o bucket entre getBucket e createBucket.
  if (createBucketError && createBucketError.status !== 409) {
    throw createBucketError;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para enviar o áudio.' },
        { status: 401 }
      );
    }

    const body = await request.json() as UploadRequestBody;
    const fileName = typeof body.fileName === 'string' ? body.fileName.trim() : '';
    const fileSize = typeof body.fileSize === 'number' ? body.fileSize : Number.NaN;
    const extension = getAudioExtension(fileName);

    if (!fileName || fileName.length > 255 || !extension) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo .mp3, .m4a, .wav ou .webm.' },
        { status: 400 }
      );
    }

    if (!isValidAudioFileSize(fileSize)) {
      return NextResponse.json(
        { error: 'Arquivo vazio ou muito grande. O limite máximo é de 25 MB.' },
        { status: 400 }
      );
    }

    await ensureTemporaryUploadBucket();

    const uploadPath = `${user.id}/${crypto.randomUUID()}${extension}`;
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage
      .from(TRANSCRIPTION_UPLOAD_BUCKET)
      .createSignedUploadUrl(uploadPath);

    if (error) throw error;

    return NextResponse.json({
      bucket: TRANSCRIPTION_UPLOAD_BUCKET,
      uploadPath,
      token: data.token,
      contentType: getAudioContentType(extension),
    });
  } catch (error) {
    console.error('Erro ao preparar upload temporário:', error);
    return NextResponse.json(
      { error: 'Não foi possível preparar o envio do áudio. Tente novamente.' },
      { status: 500 }
    );
  }
}
