import "next-auth"

type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN"

declare module "next-auth" {
  interface User {
    id: string
    role: UserRole
  }

  interface Session {
    user: {
      id: string
      email: string | null
      name: string | null
      image: string | null
      role: UserRole
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    image?: string | null
  }
}
