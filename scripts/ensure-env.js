// Copies .env.example -> .env on first run so `npm install && npm run dev`
// works with zero manual setup. Never overwrites an existing .env.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");

if (!fs.existsSync(envPath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log("Created .env from .env.example");
}
