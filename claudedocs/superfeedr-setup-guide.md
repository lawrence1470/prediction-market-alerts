# Superfeedr Setup Guide

Complete guide for setting up Superfeedr Track API for real-time news alerts.

---

## Prerequisites

- Node.js 18+
- PostgreSQL database
- A Superfeedr **Tracker** account (not regular Superfeedr)

---

## Step 1: Create Superfeedr Tracker Account

**Important:** You need a **Tracker** account, not a regular Superfeedr account.

1. Go to https://superfeedr.com/tracker
2. Sign up for the Tracker product (has a free tier with 200 feeds)
3. After signup, go to your dashboard
4. Find your API credentials:
   - **Login/Username**: Your Superfeedr username
   - **Token/Password**: Your API token

---

## Step 2: Environment Variables

Add the following to your `.env` file:

```bash
# Superfeedr Tracker API credentials
SUPERFEEDR_LOGIN="your_tracker_username"
SUPERFEEDR_TOKEN="your_tracker_token"
SUPERFEEDR_TIMEOUT_MS=10000

# For local development with ngrok (see Step 3)
NEXT_PUBLIC_APP_URL="https://your-ngrok-url.ngrok.io"

# Email notifications via Resend
RESEND_API_KEY="re_xxxxx"
RESEND_TIMEOUT_MS=5000
EMAIL_FROM="alerts@yourdomain.com"
```

---

## Step 3: Local Development with ngrok

Superfeedr needs to send webhooks to your app. In development, your localhost isn't publicly accessible, so you need **ngrok** to create a tunnel.

### Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

### Create ngrok Account (Free)

1. Go to https://ngrok.com
2. Sign up for free
3. Copy your auth token from the dashboard
4. Run: `ngrok config add-authtoken YOUR_TOKEN`

### Start ngrok Tunnel

```bash
# In a separate terminal, run:
ngrok http 4000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:4000
```

### Update Your .env

Copy the `https://xxx.ngrok.io` URL and add it to `.env`:

```bash
NEXT_PUBLIC_APP_URL="https://abc123.ngrok.io"
```

**Important:** Every time you restart ngrok, you get a new URL. Update your `.env` accordingly (paid ngrok accounts can have static URLs).

---

## Step 4: Restart Your App

After updating environment variables:

```bash
# Kill existing server
lsof -ti:4000 | xargs kill -9

# Start fresh
npm run dev
```

---

## Step 5: Test the Integration

1. Go to http://localhost:4000/dashboard
2. Add an alert for any Kalshi event
3. Check the server logs - you should see:
   - `[Superfeedr] Successfully subscribed to topic: ...`
   - The alert should show **"Active"** status (not "Setting up...")

---

## Troubleshooting

### Error: "You need a tracker account"
- You have a regular Superfeedr account, not Tracker
- Sign up at https://superfeedr.com/tracker

### Error: "Please provide a hub.callback URL"
- Your callback URL is `localhost`, which Superfeedr can't reach
- Set up ngrok (Step 3) and add `NEXT_PUBLIC_APP_URL` to `.env`

### Error: 401 Unauthorized
- Check your `SUPERFEEDR_LOGIN` and `SUPERFEEDR_TOKEN` are correct
- Make sure you're using Tracker credentials, not regular Superfeedr credentials

### Alert stuck on "Setting up..."
1. Check server logs for Superfeedr errors
2. Clear old webhooks:
   ```bash
   psql "postgresql://user@localhost:5432/news-alerts" -c "DELETE FROM user_alert; DELETE FROM event_webhook;"
   ```
3. Restart the app and try again

### ngrok URL changed
- Free ngrok gives new URLs each session
- Update `NEXT_PUBLIC_APP_URL` in `.env`
- Restart your app
- Old subscriptions will fail; delete them and create new alerts

---

## Production Setup

In production (e.g., Vercel), you don't need ngrok:

1. Your app has a real URL like `https://myapp.vercel.app`
2. Set `VERCEL_URL` environment variable (Vercel does this automatically)
3. The callback URL will be `https://${VERCEL_URL}/api/webhooks/superfeedr`

---

## Architecture Overview

```
User adds alert
    ↓
App generates search query for the Kalshi event
    ↓
App subscribes to Superfeedr Track with:
  - topic: http://track.superfeedr.com/?query=...
  - callback: https://your-app.com/api/webhooks/superfeedr
  - secret: randomly generated HMAC secret
    ↓
Superfeedr confirms subscription (200 OK)
    ↓
When news matches the query:
    ↓
Superfeedr POSTs to your webhook
    ↓
App verifies signature, extracts articles
    ↓
App sends email via Resend to subscribed users
```

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPERFEEDR_LOGIN` | Yes | Superfeedr Tracker username |
| `SUPERFEEDR_TOKEN` | Yes | Superfeedr Tracker API token |
| `SUPERFEEDR_TIMEOUT_MS` | No | API timeout (default: 10000ms) |
| `NEXT_PUBLIC_APP_URL` | Dev only | ngrok URL for local development |
| `VERCEL_URL` | Prod only | Auto-set by Vercel |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `RESEND_TIMEOUT_MS` | No | Email timeout (default: 5000ms) |
| `EMAIL_FROM` | Yes | Sender email address |
| `OPENAI_API_KEY` | Optional | For AI-generated search queries |

---

## Quick Start Checklist

- [ ] Signed up for Superfeedr Tracker (not regular Superfeedr)
- [ ] Added `SUPERFEEDR_LOGIN` and `SUPERFEEDR_TOKEN` to `.env`
- [ ] Installed ngrok: `brew install ngrok`
- [ ] Started ngrok: `ngrok http 4000`
- [ ] Added `NEXT_PUBLIC_APP_URL` with ngrok URL to `.env`
- [ ] Restarted the app: `npm run dev`
- [ ] Tested adding an alert - shows "Active" status
