// types/next-auth.d.ts

import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      walletAddress: string;
    }
  }

  interface User {
    walletAddress?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    walletAddress?: string;
  }
}