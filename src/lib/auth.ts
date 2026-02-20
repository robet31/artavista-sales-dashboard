import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      authorize: async (credentials) => {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user || !user.isActive) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

          if (!isPasswordValid) {
            return null
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            position: user.position,
            restaurantId: user.restaurantId
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = `${user.id}`
        token.role = (user as any).role
        token.position = (user as any).position
        token.restaurantId = (user as any).restaurantId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as any
        user.id = `${token.id}`
        user.role = token.role
        user.position = token.position
        user.restaurantId = token.restaurantId
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  }
}
