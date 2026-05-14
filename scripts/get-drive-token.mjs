#!/usr/bin/env node
/**
 * One-time script to get a Google Drive OAuth2 refresh token.
 *
 * Prerequisites:
 *   1. In GCP console → APIs & Services → Credentials → Create credentials
 *      → OAuth 2.0 Client ID → Desktop app → download the JSON
 *   2. Run: node scripts/get-drive-token.mjs <path-to-client-secret.json>
 *   3. Visit the printed URL, authorize, paste the code back.
 *   4. Copy the printed values into .env.local.
 */

import { readFileSync } from "fs";
import { createServer } from "http";
import { google } from "googleapis";
import { URL } from "url";

const credFile = process.argv[2];
if (!credFile) {
  console.error("Usage: node scripts/get-drive-token.mjs <client-secret.json>");
  process.exit(1);
}

const { installed, web } = JSON.parse(readFileSync(credFile, "utf-8"));
const creds = installed ?? web;
if (!creds) {
  console.error("Could not parse client_id/client_secret from file.");
  process.exit(1);
}

const { client_id, client_secret } = creds;
const REDIRECT = "http://localhost:9876/callback";

const oauth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT);

const url = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive.file"],
});

console.log("\nOpen this URL in your browser:\n");
console.log(url);
console.log("\nWaiting for callback on http://localhost:9876 …\n");

const server = createServer(async (req, res) => {
  const parsed = new URL(req.url, "http://localhost:9876");
  const code = parsed.searchParams.get("code");
  if (!code) {
    res.end("No code found.");
    return;
  }
  res.end("Done! You can close this tab.");
  server.close();

  const { tokens } = await oauth2Client.getToken(code);
  console.log("\n✅ Add these to .env.local:\n");
  console.log(`GOOGLE_DRIVE_CLIENT_ID=${client_id}`);
  console.log(`GOOGLE_DRIVE_CLIENT_SECRET=${client_secret}`);
  console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${tokens.refresh_token}`);
}).listen(9876);
