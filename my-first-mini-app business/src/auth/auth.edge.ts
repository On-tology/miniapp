import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const { auth } = NextAuth({
  providers: [GitHub],
  session: { strategy: 'jwt' }, 
})