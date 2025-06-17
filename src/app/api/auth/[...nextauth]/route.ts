import NextAuth from 'next-auth';
import { NextAuthOptions } from '../auth-options';

const handler = NextAuth(NextAuthOptions);

export { handler as GET, handler as POST };
