-- Supabase Database Schema for IHC Conversation Recorder
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  type TEXT, -- 'bathroom', 'kitchen', 'basement', etc.
  status TEXT DEFAULT 'lead', -- 'lead', 'qualified', 'estimate', 'closed', 'lost'
  notes TEXT,
  projects JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transcripts table
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  title TEXT,
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_analysis JSONB,
  total_duration INTEGER DEFAULT 0, -- milliseconds
  word_count INTEGER DEFAULT 0,
  ai_enhanced BOOLEAN DEFAULT false,
  speaker_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recordings table (metadata only, actual files stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS public.recordings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transcript_id UUID REFERENCES public.transcripts(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT,
  duration INTEGER, -- milliseconds
  mime_type TEXT DEFAULT 'audio/webm',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_size BIGINT,
  mime_type TEXT,
  category TEXT, -- 'before', 'during', 'after', 'planning', 'legal', 'financial'
  doc_type TEXT, -- 'photo', 'drawing', 'estimate', 'scope_of_work', 'contract', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scope of Work table
CREATE TABLE IF NOT EXISTS public.scope_of_work (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  transcript_id UUID REFERENCES public.transcripts(id) ON DELETE SET NULL,
  homeowner_scope JSONB NOT NULL,
  contractor_scope JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table (user preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key TEXT NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, key)
);

-- Consultations table
CREATE TABLE IF NOT EXISTS public.consultations (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT,
  client_email TEXT,
  client_phone TEXT,
  address TEXT,
  consultation_date TIMESTAMPTZ NOT NULL,
  has_recording BOOLEAN DEFAULT false,
  recording_id TEXT,
  session_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consultation photos table
CREATE TABLE IF NOT EXISTS public.consultation_photos (
  id TEXT PRIMARY KEY,
  consultation_id TEXT NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON public.transcripts(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON public.transcripts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_lead_id ON public.documents(lead_id);
CREATE INDEX IF NOT EXISTS idx_scope_of_work_user_id ON public.scope_of_work(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_consultation_date ON public.consultations(consultation_date DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_photos_consultation_id ON public.consultation_photos(consultation_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scope_of_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can manage own leads"
  ON public.leads FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transcripts"
  ON public.transcripts FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recordings"
  ON public.recordings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own scope of work"
  ON public.scope_of_work FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own consultations"
  ON public.consultations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own consultation photos"
  ON public.consultation_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.consultations
      WHERE consultations.id = consultation_photos.consultation_id
      AND consultations.user_id = auth.uid()
    )
  );

-- Create Storage Buckets
-- Run these in Supabase Dashboard > Storage

-- Bucket for recordings
-- INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);

-- Bucket for documents
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Bucket for consultation photos
-- INSERT INTO storage.buckets (id, name, public) VALUES ('consultation-photos', 'consultation-photos', false);

-- Storage Policies
-- CREATE POLICY "Users can upload own recordings"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own recordings"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own recordings"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can upload own documents"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own documents"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own documents"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can upload own consultation photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'consultation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own consultation photos"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'consultation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own consultation photos"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'consultation-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON public.transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scope_of_work_updated_at BEFORE UPDATE ON public.scope_of_work
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

