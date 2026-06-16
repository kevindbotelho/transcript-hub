import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const body = await request.json();
    const { title, is_pinned, folder_id } = body;

    // Construir o payload de update dinamicamente
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (is_pinned !== undefined) updateData.is_pinned = is_pinned;
    if (folder_id !== undefined) updateData.folder_id = folder_id;

    // Atualizar no Supabase
    const { data, error } = await supabase
      .from('transcriptions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, file_name, file_size, audio_duration, transcription_text, created_at, title, is_pinned, folder_id')
      .single();

    if (error) {
      console.error('Erro ao atualizar transcrição:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar a transcrição no banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Erro interno na rota PATCH /api/transcriptions/[id]:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    const { error } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar transcrição:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar a transcrição no banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro interno na rota DELETE /api/transcriptions/[id]:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
