import { type NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Normalize email to lowercase for consistent lookup
        const normalizedEmail = credentials.email.toLowerCase().trim()

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "USER"
        token.image = user.image
      }

      // Handle session updates (e.g., after profile update)
      if (trigger === "update" && session) {
        // Update token with new session data
        if (session.name) token.name = session.name
        if (session.image) token.image = session.image
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
        session.user.image = (token.image as string | null) ?? null
      }
      return session
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`)
      } else {
        console.log(`User signed in: ${user.email}`)
      }

      // Update last sign in timestamp
      if (user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { updatedAt: new Date() },
          })
        } catch (error) {
          console.error("Failed to update sign in timestamp:", error)
        }
      }
    },
    async signOut({ token }) {
      console.log(`User signed out: ${(token as any)?.email || "unknown"}`)
    },
  },
  debug: process.env.NODE_ENV === "development",
}

export default authOptions
