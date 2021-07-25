import { celebrate, SchemaOptions, Modes, Segments, Joi } from "celebrate";
import { PWD_RESET_TOKEN_BYTES } from "./config";

export const validate = (schema: SchemaOptions) =>
  celebrate(
    schema,
    {
      abortEarly: false, // validate all fields in the segment
    },
    {
      mode: Modes.FULL, // validate all segments (body, query, etc.)
    }
  );

const email = Joi.string().email().required();

// NOTE instead of prehashing passwords with SHA256, we could limit
// them to 72 bytes (important: not characters) like so: .max(72, 'utf8')
// However, this would likely leak our password algorithm (i.e. bcrypt).
const password = Joi.string().max(256).required(); // TODO password strength

export const loginSchema = {
  [Segments.BODY]: Joi.object().keys({
    email,
    password,
  }),
};

export const registerSchema = {
  [Segments.BODY]: Joi.object().keys({
    email,
    password,
    name: Joi.string().max(256).required(),
  }),
};

// Based on Postgres `serial` type (4 bytes, roughly 2.1B)
// https://www.postgresql.org/docs/9.1/datatype-numeric.html
const id = Joi.number()
  .positive() // can't be zero or negative
  .max(2 ** 31 - 1)
  .required();

export const verifyEmailSchema = {
  [Segments.QUERY]: {
    id,
    expires: Joi.date().timestamp().raw().required(), // `raw` means it's not casted to a Date
    signature: Joi.string().length(64).required(), // 256 / 8 * 2 (hex)
  },
};

export const resendEmailSchema = {
  [Segments.BODY]: Joi.object().keys({
    email,
  }),
};

export const sendResetSchema = {
  [Segments.BODY]: Joi.object().keys({
    email,
  }),
};

export const resetPasswordSchema = {
  [Segments.QUERY]: {
    id,
    token: Joi.string()
      .length(PWD_RESET_TOKEN_BYTES * 2) // hex
      .required(),
  },
  [Segments.BODY]: Joi.object().keys({
    password,
  }),
};

export const confirmPasswordSchema = {
  [Segments.BODY]: Joi.object().keys({
    password,
  }),
};
