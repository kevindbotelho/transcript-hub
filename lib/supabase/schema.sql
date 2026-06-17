-- Criação da tabela de pastas (folders)
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitando o Row Level Security (RLS) para folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Seguro (RLS) para folders
CREATE POLICY "Users can view their own folders" 
  ON folders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders" 
  ON folders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
  ON folders 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
  ON folders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criação do índice para buscas rápidas de subpastas
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON folders(parent_id);


-- Criação da tabela de transcrições
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- tamanho em bytes
  audio_duration NUMERIC, -- duração em segundos (opcional/estimado)
  transcription_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT,
  is_pinned BOOLEAN DEFAULT false,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL
);

-- Habilitando o Row Level Security (RLS) para transcriptions
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Seguro (RLS) para transcriptions
CREATE POLICY "Users can view their own transcriptions" 
  ON transcriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transcriptions" 
  ON transcriptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcriptions" 
  ON transcriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcriptions" 
  ON transcriptions 
  FOR DELETE 
  USING (auth.uid() = user_id);
