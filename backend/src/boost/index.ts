import 'dotenv/config';
import { connectDB } from './db/index.js';
import app from './app.js';

const PORT = Number(process.env['PORT']) || 3012;

async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[boost-backend] Listening on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('[boost-backend] Fatal startup error:', err);
  process.exit(1);
});
