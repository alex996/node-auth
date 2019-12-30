import { Request, Response } from 'express'
import { SESSION_NAME } from './config'
import { UserDocument } from './models'

export const isLoggedIn = (req: Request) => !!req.session!.userId

export const logIn = (req: Request, userId: string) => {
  req.session!.userId = userId
  req.session!.createdAt = Date.now()
}

export const logOut = (req: Request, res: Response) =>
  new Promise((resolve, reject) => {
    req.session!.destroy((err: Error) => {
      if (err) reject(err)

      res.clearCookie(SESSION_NAME)

      resolve()
    })
  })

export const markAsVerified = async (user: UserDocument) => {
  user.verifiedAt = new Date()
  await user.save()
}

export const resetPassword = async (user: UserDocument, password: string) => {
  user.password = password
  await user.save()
}
