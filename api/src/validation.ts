import { celebrate, SchemaOptions, Segments, Joi } from "celebrate";

export const validate = (schema: SchemaOptions) =>
  celebrate(schema, {
    abortEarly: false,
  });

export const loginSchema = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().max(256).required(),
  }),
};
