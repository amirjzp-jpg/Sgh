// Deploy preflight: validates the environment BEFORE the expensive build
// steps, so a missing/malformed variable fails immediately with instructions
// instead of a cryptic Prisma or NextAuth error minutes into the build.
// Set SKIP_ENV_CHECK=1 to bypass (e.g. CI builds with placeholder values).

// Load .env for local runs (Vercel injects real env vars; locally Prisma
// reads .env itself but this plain Node script has to do it by hand).
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*(#.*)?$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2].trim();
  }
}

const problems = [];
const warnings = [];

function isPostgresUrl(value) {
  return /^postgres(ql)?:\/\//.test(value);
}

const { DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, VERCEL } = process.env;

if (!DATABASE_URL) {
  problems.push(
    'DATABASE_URL is missing.\n' +
      '    → Supabase dashboard → Connect → Transaction pooler URI (port 6543),\n' +
      '      with ?pgbouncer=true&connection_limit=1 appended.',
  );
} else if (!isPostgresUrl(DATABASE_URL)) {
  problems.push('DATABASE_URL must start with postgresql:// — check for stray spaces or quotes.');
} else {
  if (/@db\.[a-z0-9]+\.supabase\.co/.test(DATABASE_URL)) {
    problems.push(
      'DATABASE_URL points at the db.*.supabase.co direct host, which is IPv6-only\n' +
        '    and unreachable from Vercel. Use the pooler host (aws-…pooler.supabase.com:6543).',
    );
  }
  if (DATABASE_URL.includes('pooler.supabase.com') && !DATABASE_URL.includes('pgbouncer=true')) {
    warnings.push(
      'DATABASE_URL uses the Supabase pooler but is missing ?pgbouncer=true&connection_limit=1 —\n' +
        '    prepared-statement errors are likely at runtime without it.',
    );
  }
}

if (!DIRECT_URL) {
  problems.push(
    'DIRECT_URL is missing.\n' +
      '    → Supabase dashboard → Connect → Session pooler URI (port 5432, same pooler host).',
  );
} else if (!isPostgresUrl(DIRECT_URL)) {
  problems.push('DIRECT_URL must start with postgresql:// — check for stray spaces or quotes.');
} else if (VERCEL && /@db\.[a-z0-9]+\.supabase\.co/.test(DIRECT_URL)) {
  problems.push(
    'DIRECT_URL points at the db.*.supabase.co direct host, which is IPv6-only and\n' +
      '    unreachable from Vercel. Use the session pooler (aws-…pooler.supabase.com:5432).',
  );
}

if (!NEXTAUTH_SECRET) {
  problems.push(
    'NEXTAUTH_SECRET is missing. Any long random string works:\n' +
      '    → openssl rand -base64 32',
  );
}

if (!NEXTAUTH_URL && !VERCEL) {
  warnings.push('NEXTAUTH_URL is not set — fine on Vercel (auto-detected), needed elsewhere.');
}

if (process.env.SKIP_ENV_CHECK === '1') {
  console.log('[preflight] SKIP_ENV_CHECK=1 — skipping environment validation.');
  process.exit(0);
}

for (const w of warnings) console.warn(`\n[preflight] ⚠ ${w}`);

if (problems.length > 0) {
  console.error('\n[preflight] ✖ Build stopped — environment problems found:\n');
  problems.forEach((p, i) => console.error(`  ${i + 1}. ${p}\n`));
  console.error(
    '  Fix these in Vercel → Project → Settings → Environment Variables\n' +
      '  (tick Production, Preview AND Development for each), then redeploy.\n' +
      '  Reference values live in .env.example.\n',
  );
  process.exit(1);
}

console.log('[preflight] ✓ Environment looks good.');
