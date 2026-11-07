import dotenv from 'dotenv';
import path from 'path';

// ── Load .env BEFORE importing any module that reads process.env ──
// Use process.cwd() to resolve .env reliably
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ── Now dynamically import modules that depend on env vars ────────────
const { default: app } = await import('./app.js');
const { connectDB } = await import('./db/index.js');

const rawPort = process.env['PORT'] ?? '3000';
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

await connectDB();

app.listen(port, () => {
  console.log(`[MSK Backend] Listening on port ${port}`);
});
