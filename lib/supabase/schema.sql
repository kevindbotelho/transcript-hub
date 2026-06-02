-- Criação da tabela de transcrições
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL, -- tamanho em bytes
  audio_duration NUMERIC, -- duração em segundos (opcional/estimado)
  transcription_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitando o Row Level Security (RLS)
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Seguro (RLS)
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
