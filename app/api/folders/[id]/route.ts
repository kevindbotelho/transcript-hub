import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: 'O nome da pasta é obrigatório.' },
        { status: 400 }
      );
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, name, created_at')
      .single();

    if (error) {
      console.error('Erro ao renomear pasta:', error);
      return NextResponse.json(
        { error: 'Erro ao renomear a pasta no banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json(folder);
  } catch (err: any) {
    console.error('Erro interno na rota PATCH /api/folders/[id]:', err);
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
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erro ao deletar pasta:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar a pasta no banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro interno na rota DELETE /api/folders/[id]:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
