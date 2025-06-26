import NextAuth from 'next-auth';
import DiscordProvider from "next-auth/providers/discord";
import { NextAuthOptions } from 'next-auth';
import User from '@/models/User';
import connectToDatabase from '@/lib/db';

// Check for required environment variables
if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('Missing Discord OAuth credentials. Please add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET to your .env.local file');
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('Missing NEXTAUTH_SECRET. Please generate a random string for NEXTAUTH_SECRET in your .env.local file');
}

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      authorization: {
        params: { 
          scope: 'identify email' 
        }
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, user, account }) {
      try {
        // Initial sign in
        if (account && user) {
          await connectToDatabase();
          
          console.log('Discord auth successful:', { 
            user: { name: user.name, email: user.email },
            providerId: account.providerAccountId
          });
          
          // Check if user exists in database
          let dbUser = await User.findOne({ discordId: account.providerAccountId });
          
          // If not, create user
          if (!dbUser) {
            console.log('Creating new user from Discord login');
            dbUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              discordId: account.providerAccountId,
              role: 'user',
            });
            console.log('New user created:', dbUser._id);
          } else {
            console.log('Existing user found:', dbUser._id);
          }
          
          // Add user role to token
          token.role = dbUser.role;
          token.id = dbUser._id.toString();
          token.discordId = dbUser.discordId;
        }
      } catch (error) {
        console.error('JWT callback error:', error);
        // Don't throw here to prevent login failures, but log the error
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add role to client-side session
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.discordId = token.discordId as string;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error('Auth error:', { code, metadata });
    },
    warn(code) {
      console.warn('Auth warning:', code);
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
