import { Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { asyncHandler } from './asyncHandler';

// Separate from requireAuth (Supabase JWT) -- this is for the personal API
// key Pro users generate in Settings, meant for their own scripts/tooling
// rather than the dashboard itself.
export const requireApiKey = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const apiKey = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : (req.headers['x-api-key'] as string | undefined);

  if (!apiKey) {
    return res.status(401).json({ error: 'Missing API key -- pass it as "Authorization: Bearer <key>" or "X-API-Key"' });
  }

  const { rows } = await pool.query(`select id, email from public.users where api_key = $1`, [apiKey]);
  if (rows.length === 0) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  req.user = { id: rows[0].id, email: rows[0].email };
  next();
});
