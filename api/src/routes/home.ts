import { Router } from 'express'
import { auth, catchAsync } from '../middleware'
import { User } from '../models'

const router = Router()

router.get('/home', auth, catchAsync(async (req, res) => {
  const user = await User.findById(req.session!.userId)
  res.json(user)
}))

export { router as home }
