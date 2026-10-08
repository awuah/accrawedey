import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ezqknoatatwuawzdimah.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cWtub2F0YXR3dWF3emRpbWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODkwNzIsImV4cCI6MjA4NTU2NTA3Mn0.VJvG55C1VL6hi7UuFqCDAdQhXU-r6HOsvJdktTqsQog';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
