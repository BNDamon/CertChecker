import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { pool } from '../db/pool';
import { asyncHandler } from './asyncHandler';

// Anon-key client used only to validate the bearer token against Supabase Auth.
// Verifying via auth.getUser() means an expired/tampered token is rejected
// without the backend needing to hold or check the project's JWT secret directly.
const supabaseAuth = createClient(env.supabaseUrl, env.supabaseAnonKey);

export const requireAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const token = header.slice('Bearer '.length);
  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.user = { id: data.user.id, email: data.user.email ?? '' };

  // Ensure a matching row exists in public.users (first request after signup).
  await pool.query(
    `insert into public.users (id, email)
     values ($1, $2)
     on conflict (id) do nothing`,
    [req.user.id, req.user.email]
  );

  next();
});
