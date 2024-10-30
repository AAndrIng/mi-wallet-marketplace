// pages/api/auth/[...nextauth].ts

import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

// Esta sería la función para verificar las credenciales contra la base de datos
// Ahora usaremos una versión simplificada para esta demo
const validateCredentials = async (credentials: any) => {
  // Usuario de prueba
  const testUser = {
    username: 'testuser',
    // Hash de 'testpassword'
    passwordHash: '$2a$10$YourHashedPasswordHere',
    walletAddress: '',
  };

  if (credentials.username === testUser.username) {
    const isValid = await bcrypt.compare(
      credentials.password,
      testUser.passwordHash
    );
    if (isValid) {
      return testUser;
    }
  }
  return null;
};

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials) return null;
        
        const user = await validateCredentials(credentials);
        
        if (user) {
          return {
            id: '1',
            name: user.username,
            email: `${user.username}@example.com`,
            walletAddress: user.walletAddress
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.walletAddress = user.walletAddress;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.walletAddress = token.walletAddress as string;
      }
      return session;
    }
  }
});