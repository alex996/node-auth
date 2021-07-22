export const db: Db = {
  users: [
    {
      id: 1,
      email: "test@gmail.com",
      password: "$2b$12$j5V3RyLko4Gpx.IStt8ux.WN95F3n3fULUyhBINe4zbME.L7C1h7C", // 'test'
      name: "Test",
      verifiedAt: null,
    },
  ],
  passwordResets: [],
};

interface Db {
  users: User[];
  passwordResets: PasswordReset[];
}

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  verifiedAt: string | null;
}

export interface PasswordReset {
  id: number;
  userId: number;
  token: string;
  expiresAt: string;
}
