import { Router } from 'express'
import { guest, catchAsync } from '../middleware'
import { validate, registerSchema } from '../validation'
import { User } from '../models'
import { BadRequest } from '../errors'
import { logIn } from '../auth'
import { sendMail } from '../mail'

const router = Router()

router.post('/register', guest, catchAsync(async (req, res) => {
  await validate(registerSchema, req.body)

  const { email, name, password } = req.body

  const found = await User.exists({ email })

  if (found) {
    throw new BadRequest('Invalid email')
  }

  const user = await User.create({
    email, name, password
  })

  logIn(req, user.id)

  const link = user.verificationUrl()

  await sendMail({
    to: email,
    subject: 'Verify your email address',
    text: link
  })

  res.json({ message: 'OK' })
}))

export { router as register }
