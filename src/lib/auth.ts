import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { supabase } from './supabase'
import crypto from 'crypto'

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

          const { data: users, error } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', credentials.email)
            .limit(1)

          if (error || !users || users.length === 0) {
            console.log('User not found:', error)
            return null
          }

          const user = users[0]

          if (!user.is_active) {
            console.log('User is inactive')
            return null
          }

          // Hash password with MD5 (same as registration)
          const hashedPassword = crypto.createHash('md5').update(credentials.password).digest('hex')

          if (user.password !== hashedPassword) {
            console.log('Password mismatch')
            return null
          }

          await supabase
            .from('app_users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            position: user.position,
            restaurant_id: user.restaurant_id
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
        token.restaurantId = (user as any).restaurant_id
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
