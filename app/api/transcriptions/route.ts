import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Obter o usuário logado
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Usuário não autenticado.' },
        { status: 401 }
      );
    }

    // Buscar as transcrições ordenadas da mais recente para a mais antiga
    const { data: transcriptions, error } = await supabase
      .from('transcriptions')
      .select('id, file_name, file_size, audio_duration, transcription_text, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transcrições:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar transcrições do banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json(transcriptions);
  } catch (err: any) {
    console.error('Erro interno na rota GET /api/transcriptions:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
