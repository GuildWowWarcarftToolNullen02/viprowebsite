# MSK Hub - Email Templates

Stored here permanently. The API server loads these at startup so changes are live on next restart.

## Files

| File | Used for |
|---|---|
| `verification.html` | Email verification link sent on registration & resend |

## Placeholders

| Placeholder | Replaced with |
|---|---|
| `{{APP_URL}}` | Base URL of the site (e.g. `https://mskhub.store`) |
| `{{USERNAME}}` | The user's display name |
| `{{VERIFY_LINK}}` | Full verification URL with token |

## Adding new templates

1. Create a new `.html` file here with `{{PLACEHOLDER}}` syntax.
2. Add a loader in `artifacts/api-server/src/lib/email.ts`.
3. Call it from the relevant route in `artifacts/api-server/src/routes/auth.ts`.
