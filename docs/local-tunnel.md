# Sharing the local preview through ngrok

The current tunnel hostname is explicitly listed in `allowedDevOrigins` in `next.config.mjs`. If it changes, replace that hostname. Additional exact trusted hostnames can be supplied through `NEXT_DEV_ALLOWED_ORIGINS` in `.env.local`, without `https://` or a path, separated by commas.

After changing the hostname, stop the existing Next.js dev server with Ctrl+C and restart with `npm run dev`. Keep ngrok forwarding to the same port (normally `ngrok http 3000`). Reload the public HTTPS URL. If ngrok shows its visitor warning, continue to the site first.

Next.js development-origin checks can reject JavaScript requests with 403 even when the page HTML loads. Dashboard components then remain on their initial loading message. Allowing the specific tunnel hostname and restarting resolves that origin rejection; avoid allowing every origin.

This setting does not alter payment API origin validation, production canonical URLs, or real authentication. Demo login/storage is separate for each hostname and browser. A tester must log in on the ngrok URL; their demo edits do not sync with your localhost browser.

Reference: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
