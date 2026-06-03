import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Obter o usuário logado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para transcrever.' },
        { status: 401 }
      );
    }

    // Obter os dados da requisição multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de áudio foi enviado.' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo (limite da OpenAI de 25 MB)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. O limite máximo da API é de 25 MB.' },
        { status: 400 }
      );
    }

    // Validar extensões permitidas
    const allowedExtensions = ['.mp3', '.m4a', '.wav', '.webm'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Formato inválido. Envie um arquivo .mp3, .m4a, .wav ou .webm.' },
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

    // Preparar formData para enviar para a OpenAI
    const openAiFormData = new FormData();
    openAiFormData.append('file', file);
    openAiFormData.append('model', 'whisper-1');
    openAiFormData.append('response_format', 'verbose_json');

    // Chamar a API da OpenAI
    const openAiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiApiKey}`,
      },
      body: openAiFormData,
    });

    if (!openAiResponse.ok) {
      const errorData = await openAiResponse.json().catch(() => ({}));
      console.error('Erro retornado pela API da OpenAI:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Erro ao processar áudio na API da OpenAI.' },
        { status: openAiResponse.status }
      );
    }

    // Obter resposta detalhada contendo a duração do áudio e o texto transcrito
    const openAiData = await openAiResponse.json();

    // Salvar resultado no Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        audio_duration: openAiData.duration ? Math.round(openAiData.duration) : null,
        transcription_text: openAiData.text || '',
      })
      .select('id, file_name, file_size, audio_duration, transcription_text, created_at')
      .single();

    if (dbError) {
      console.error('Erro ao salvar transcrição no banco de dados:', dbError);
      return NextResponse.json(
        { error: 'Áudio transcrito com sucesso, mas falhou ao salvar no histórico do banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json(dbData);
  } catch (err: any) {
    console.error('Erro interno na rota POST /api/transcribe:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao processar áudio.' },
      { status: 500 }
    );
  }
}
