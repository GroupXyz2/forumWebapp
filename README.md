# Modern Forum Web Application

A modern forum web application with dark mode (default) and light mode, admin management features, language support in German (DE) and English (EN), modern design with blue accents, authentication via Discord, and MongoDB for data storage.

## Features

- **Modern Design**: Clean interface with blue accents
- **Dark/Light Mode**: Default dark mode with light mode option
- **Internationalization**: Full support for German and English languages
- **Authentication**: Secure login via Discord OAuth
- **User Roles**: Admin, moderator, and regular user roles
- **MongoDB Integration**: Persistent data storage
- **Admin Dashboard**: Complete forum management
- **Responsive**: Works on all devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or cloud-hosted)
- Discord Developer application for authentication

### Environment Setup

Create a `.env.local` file with the following variables:

```
# Authentication
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret  
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# Database
MONGODB_URI=your_mongodb_connection_string
```

### Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. In the OAuth2 section, add a redirect URL: `http://localhost:3000/api/auth/callback/discord`
4. Copy the Client ID and Client Secret to your `.env.local` file

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Structure

```
src/
  ├── app/              # Next.js App Router
  │   ├── [locale]/     # Locale-specific routes
  │   ├── api/          # API endpoints
  │   └── globals.css   # Global styles
  ├── components/       # React components
  │   ├── forum/        # Forum components
  │   ├── layout/       # Layout components
  │   ├── providers/    # Context providers
  │   └── ui/           # Reusable UI components
  ├── i18n/             # Internationalization
  │   └── locales/      # Translation files
  ├── lib/              # Utility functions
  │   └── db.ts         # MongoDB connection
  ├── models/           # Mongoose models
  └── types/            # TypeScript type definitions
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SSL Support

This application supports SSL for secure connections. Follow these steps to enable SSL:

### Environment Configuration

Add the following to your `.env.local` file:

```
# SSL Configuration
USE_SSL=true
SSL_KEY_FILE=./certificates/localhost-key.pem
SSL_CERT_FILE=./certificates/localhost.pem

# Development Tools
DISABLE_DEV_TOOLS=false  # Set to 'true' to disable all dev indicators
```

Note: SSL is handled by the custom server.js file and not through next.config.ts.

### Generate SSL Certificates

For local development, we recommend using [mkcert](https://github.com/FiloSottile/mkcert) to generate self-signed certificates:

```bash
# Install mkcert
# Windows: choco install mkcert
# macOS: brew install mkcert

# Set up local CA
mkcert -install

# Generate certificates
mkcert -key-file certificates/localhost-key.pem -cert-file certificates/localhost.pem localhost 127.0.0.1 ::1
```

See the README in the `certificates` directory for more detailed instructions.

### Run with SSL

```bash
# Development with SSL
npm run dev:ssl

# Production with SSL
npm run start:ssl
```

### Production SSL

For production, use proper SSL certificates from a trusted certificate authority and update the `.env.local` file accordingly. With popular hosting services like Vercel, SSL is handled automatically.

## License

This project is licensed under the MIT License.
