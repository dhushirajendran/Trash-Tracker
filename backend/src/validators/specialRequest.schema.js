import Joi from "joi";

export const createSpecialRequestSchema = Joi.object({
  type: Joi.string().valid("bulky", "ewaste").required(),
  description: Joi.string().allow("").max(500),
  preferredDate: Joi.date().iso().required()
});

export const updateSpecialRequestSchema = Joi.object({
  description: Joi.string().allow("").max(500),
  preferredDate: Joi.date().iso(),
  // only allow update while pending/scheduled
  status: Joi.string().valid("canceled")
});
