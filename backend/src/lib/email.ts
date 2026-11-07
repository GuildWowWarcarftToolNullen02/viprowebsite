import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

// Use process.cwd() to reliably find the project root in Vercel
const projectRoot = process.cwd();

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!_resend) {
    const key = process.env['RESEND_API_KEY'];
    if (key) _resend = new Resend(key);
  }
  return _resend;
}

function loadTemplate(filename: string): string {
  const p = path.resolve(projectRoot, 'email_embed', filename);
  return fs.readFileSync(p, 'utf-8');
}

export async function sendVerificationEmail(
  email: string,
  username: string,
  token: string,
  appBaseUrl: string,
): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn('[Email] RESEND_API_KEY not set - skipping verification email');
    console.info(`[Email] Verify link: ${appBaseUrl}/api/auth/verify-email?token=${token}`);
    return;
  }

  const verifyLink = `${appBaseUrl}/api/auth/verify-email?token=${token}`;

  let html = loadTemplate('verification.html');
  html = html.replace(/\{\{APP_URL\}\}/g, appBaseUrl);
  html = html.replace(/\{\{USERNAME\}\}/g, username);
  html = html.replace(/\{\{VERIFY_LINK\}\}/g, verifyLink);

  await client.emails.send({
    from: 'MSK Hub <noreply@mskhub.store>',
    to: email,
    subject: 'Verify your MSK Hub account',
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  username: string,
  token: string,
  appBaseUrl: string,
): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn('[Email] RESEND_API_KEY not set - skipping password reset email');
    console.info(`[Email] Reset link: ${appBaseUrl}/reset-password?token=${token}`);
    return;
  }

  const resetLink = `${appBaseUrl}/reset-password?token=${token}`;

  let html = loadTemplate('password-reset.html');
  html = html.replace(/\{\{APP_URL\}\}/g, appBaseUrl);
  html = html.replace(/\{\{USERNAME\}\}/g, username);
  html = html.replace(/\{\{RESET_LINK\}\}/g, resetLink);

  await client.emails.send({
    from: 'MSK Hub <noreply@mskhub.store>',
    to: email,
    subject: 'Reset your MSK Hub password',
    html,
  });
}

export async function sendPurchaseConfirmEmail(
  email: string,
  licenseKey: string,
  productName: string,
  planLabel: string,
  appBaseUrl: string,
): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn('[Email] RESEND_API_KEY not set - skipping purchase confirmation email');
    return;
  }

  let html = loadTemplate('purchase-confirm.html');
  html = html.replace(/\{\{APP_URL\}\}/g, appBaseUrl);
  html = html.replace(/\{\{PRODUCT_NAME\}\}/g, productName);
  html = html.replace(/\{\{PLAN_LABEL\}\}/g, planLabel);
  html = html.replace(/\{\{LICENSE_KEY\}\}/g, licenseKey);

  await client.emails.send({
    from: 'MSK Hub <noreply@mskhub.store>',
    to: email,
    subject: `Your MSK Hub License Key - ${productName}`,
    html,
  });
}
