import { Joi } from './joi'
import {
  BCRYPT_MAX_BYTES, EMAIL_VERIFICATION_TOKEN_BYTES, EMAIL_VERIFICATION_SIGNATURE_BYTES, PASSWORD_RESET_BYTES
} from '../config'

const id = Joi.objectId().required()

const email = Joi.string().email().min(8).max(254).lowercase().trim().required()

const name = Joi.string().min(3).max(128).trim().required()

const password = Joi.string().min(8).max(BCRYPT_MAX_BYTES, 'utf8')
  .regex(/^(?=.*?[\p{Lu}])(?=.*?[\p{Ll}])(?=.*?\d).*$/u)
  .message('"{#label}" must contain one uppercase letter, one lowercase letter, and one digit')
  .required()

const passwordConfirmation = Joi.valid(Joi.ref('password')).required()

export const registerSchema = Joi.object({
  email,
  name,
  password,
  passwordConfirmation
})

export const loginSchema = Joi.object({
  email,
  password
})

export const verifyEmailSchema = Joi.object({
  id,
  token: Joi.string().length(EMAIL_VERIFICATION_TOKEN_BYTES).required(),
  expires: Joi.date().timestamp().required(),
  signature: Joi.string().length(EMAIL_VERIFICATION_SIGNATURE_BYTES).required()
})

export const resendEmailSchema = Joi.object({
  email
})

export const forgotPasswordSchema = Joi.object({
  email
})

export const resetPasswordSchema = Joi.object({
  query: Joi.object({
    id,
    token: Joi.string().length(PASSWORD_RESET_BYTES * 2).required()
  }),
  body: Joi.object({
    password,
    passwordConfirmation
  })
})
