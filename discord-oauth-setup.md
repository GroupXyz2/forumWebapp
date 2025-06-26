# Discord OAuth Setup Guide

To fix the "invalid OAuth redirect URL" error when logging in with Discord, follow these steps:

## 1. Update Discord Developer Portal Settings

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Log in with your Discord account
3. Select your application (the one with Client ID: `1387688445832466564`)
4. Click on "OAuth2" in the left sidebar
5. In the "Redirects" section, add the following URL:
   ```
   http://localhost:3000/api/auth/callback/discord
   ```
6. Click "Save Changes"

## 2. Development vs. Production Settings

### For Development:
- Redirect URL: `http://localhost:3000/api/auth/callback/discord`
- NEXTAUTH_URL in .env.local: `http://localhost:3000`

### For Production:
- When you deploy your application, add your production URL to Discord redirects:
  ```
  https://your-production-domain.com/api/auth/callback/discord
  ```
- Update NEXTAUTH_URL in .env.local: `https://your-production-domain.com`

## 3. Common Discord OAuth Issues

If you continue to have issues:

1. **Check scopes**: Make sure the Discord application has the `identify` and `email` scopes
2. **Check credentials**: Verify your DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are correct
3. **Clear cookies/cache**: Try in a private/incognito browser window
4. **Check Discord Developer Portal**: Make sure your application is not disabled
5. **Check Next.js logs**: Run your app in development mode to see detailed error messages
