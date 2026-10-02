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

async function inviteCodeMatches(candidate: string, expected: string) {
  const encoder = new TextEncoder();
  const [candidateHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(candidate)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const a = new Uint8Array(candidateHash);
  const b = new Uint8Array(expectedHash);
  let difference = a.length ^ b.length;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
  const expectedInviteCode = Deno.env.get('AQUACYCLE_STAFF_INVITE_CODE');
  if (!supabaseUrl || !serviceKey || !publicKey || !expectedInviteCode) {
    return json({ error: 'Staff signup is not configured' }, 500);
  }

  let input: Record<string, unknown>;
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 12_000) {
      return json({ error: 'Request is too large' }, 413);
    }
    input = await request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const fullName = typeof input.full_name === 'string' ? input.full_name.trim() : '';
  const phone = typeof input.phone === 'string' ? input.phone.trim() : '';
  const address = typeof input.address === 'string' ? input.address.trim() : '';
  const inviteCode = typeof input.invite_code === 'string' ? input.invite_code : '';

  if (!(await inviteCodeMatches(inviteCode, expectedInviteCode))) {
    return json({ error: 'The staff testing code is incorrect.' }, 401);
  }
  if (
    !/^[a-z0-9_]{3,24}$/.test(username) ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    password.length < 8 || password.length > 128 ||
    !fullName || fullName.length > 120 ||
    !phone || phone.length > 40 ||
    !address || address.length > 300
  ) {
    return json({ error: 'Check the account details and try again.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const auth = createClient(supabaseUrl, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: fullName, phone, address },
  });
  if (createError || !created.user) {
    return json({ error: 'Could not create staff account. Check whether that email or username is already in use.' }, 400);
  }

  const { error: roleError } = await admin
    .from('profiles')
    .update({ role: 'staff' })
    .eq('id', created.user.id)
    .select('id')
    .single();
  if (roleError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: 'Could not finish staff account setup. Please try again.' }, 500);
  }

  const { data: signedIn, error: signInError } = await auth.auth.signInWithPassword({ email, password });
  if (signInError || !signedIn.session) {
    await admin.auth.admin.deleteUser(created.user.id);
    return json({ error: 'Could not sign in to the new staff account. Please try again.' }, 500);
  }

  return json({ session: signedIn.session }, 200);
});
