import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceKey || !publicKey) {
    return json({ error: 'Login service is not configured' }, 500);
  }

  let username: string;
  let password: string;
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 4_000) {
      return json({ error: 'Request is too large' }, 413);
    }
    const body = await request.json();
    username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  if (!/^[a-z0-9_]{3,24}$/.test(username) || password.length < 1 || password.length > 128) {
    return json({ error: 'Invalid username or password' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const auth = createClient(supabaseUrl, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile } = await admin
    .from('profiles')
    .select('email')
    .eq('username', username)
    .maybeSingle();

  // Use the same response for unknown usernames and bad passwords.
  const email = profile?.email ?? 'unknown-user@aquacycle.invalid';
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return json({ error: 'Invalid username or password' }, 401);
  }

  return json({ session: data.session }, 200);
});
