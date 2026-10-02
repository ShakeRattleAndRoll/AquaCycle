import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbmjjygqnlnnedjoptgm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZibWpqeWdxbmxubmVkam9wdGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5MzY2MjYsImV4cCI6MjEwNjUxMjYyNn0.aPa8dCL8jMHCS4mbKi2gXzRdbcCZ_CMi6ieg2VYlmuw';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY) to .env.local, then restart Expo.',
    );
  }
  return supabase;
}
