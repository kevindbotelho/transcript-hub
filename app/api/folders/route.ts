import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado. Usuário não autenticado.' },
        { status: 401 }
      );
    }

    const { data: folders, error } = await supabase
      .from('folders')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar pastas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar pastas do banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json(folders);
  } catch (err: any) {
    console.error('Erro interno na rota GET /api/folders:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
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
      .insert({
        user_id: user.id,
        name: name.trim(),
      })
      .select('id, name, created_at')
      .single();

    if (error) {
      console.error('Erro ao criar pasta:', error);
      return NextResponse.json(
        { error: 'Erro ao criar a pasta no banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json(folder);
  } catch (err: any) {
    console.error('Erro interno na rota POST /api/folders:', err);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
