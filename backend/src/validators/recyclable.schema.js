import Joi from "joi";

export const createRecyclableSubmissionSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        category: Joi.string().valid("plastic", "paper", "glass", "metal", "ewaste").required(),
        weightKG: Joi.number().min(0.01).required()
      })
    )
    .min(1)
    .required()
});

export const updateRecyclableSubmissionSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        category: Joi.string().valid("plastic", "paper", "glass", "metal", "ewaste").required(),
        weightKG: Joi.number().min(0.01).required()
      })
    )
    .min(1),
  status: Joi.string().valid("canceled")
});
