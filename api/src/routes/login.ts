import { Router } from 'express'
import { catchAsync, guest, auth } from '../middleware'
import { validate, loginSchema } from '../validation'
import { User } from '../models'
import { BadRequest } from '../errors'
import { logIn, logOut } from '../auth'

const router = Router()

router.post('/login', guest, catchAsync(async (req, res) => {
  await validate(loginSchema, req.body)

  const { email, password } = req.body

  const user = await User.findOne({ email })

  if (!user || !(await user.matchesPassword(password))) {
    throw new BadRequest('Incorrect email or password')
  }

  logIn(req, user.id)

  res.json({ message: 'OK' })
}))

router.post('/logout', auth, catchAsync(async (req, res) => {
  await logOut(req, res)

  res.json({ message: 'OK' })
}))

export { router as login }
