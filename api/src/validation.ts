import { celebrate, SchemaOptions, Segments, Joi } from "celebrate";

export const validate = (schema: SchemaOptions) =>
  celebrate(schema, {
    abortEarly: false,
  });

const email = Joi.string().email().required();

// NOTE instead of prehashing passwords with SHA256, we could
// limit them to 72 bytes (important: not characters) like so:
// .max(72, 'utf8'). However, this is likely to leak our password
// algorithm (i.e. bcrypt) and confuse our users.
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
    name: Joi.string().required(),
  }),
};

export const verifyEmailSchema = {
  [Segments.QUERY]: {
    id: Joi.number().positive().required(),
    expires: Joi.date().timestamp().raw().required(),
    signature: Joi.string().length(64).required(),
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
    id: Joi.number().positive().required(),
    token: Joi.string().length(80).required(),
  },
  [Segments.BODY]: Joi.object().keys({
    password,
  }),
};
