import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      discordId: string;
      isBanned?: boolean;
      bannedUntil?: Date | string | null;
      banReason?: string;
      isMuted?: boolean;
      mutedUntil?: Date | string | null;
      warningCount?: number;
    };
  }

  interface User {
    id: string;
    role: string;
    discordId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    discordId: string;
  }
}
