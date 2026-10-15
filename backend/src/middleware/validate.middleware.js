
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      if (!schema || typeof schema !== "object") {
        return res.status(500).json({
          success: false,
          message: "Validation schema is not configured correctly.",
        });
      }

      const data = req[source];

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${source} data.`,
        });
      }

      const errors = [];

      for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];

        if (rules.required && (
          value === undefined ||
          value === null ||
          (typeof value === "string" && value.trim() === "")
        )) {
          errors.push(`${field} is required.`);
          continue;
        }

        if (value === undefined || value === null) {
          continue;
        }

        if (rules.type === "string" && typeof value !== "string") {
          errors.push(`${field} must be a string.`);
          continue;
        }

        if (rules.type === "number" &&
            (typeof value !== "number" || !Number.isFinite(value))) {
          errors.push(`${field} must be a valid number.`);
          continue;
        }

        if (rules.type === "boolean" && typeof value !== "boolean") {
          errors.push(`${field} must be a boolean.`);
          continue;
        }

        if (rules.type === "array" && !Array.isArray(value)) {
          errors.push(`${field} must be an array.`);
          continue;
        }

        if (typeof value === "string") {
          if (rules.minLength !== undefined &&
              value.trim().length < rules.minLength) {
            errors.push(`${field} must contain at least ${rules.minLength} characters.`);
          }

          if (rules.maxLength !== undefined &&
              value.length > rules.maxLength) {
            errors.push(`${field} must not exceed ${rules.maxLength} characters.`);
          }

          if (rules.enum && !rules.enum.includes(value)) {
            errors.push(`${field} must be one of: ${rules.enum.join(", ")}.`);
          }
        }

        if (typeof value === "number") {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`${field} must be at least ${rules.min}.`);
          }

          if (rules.max !== undefined && value > rules.max) {
            errors.push(`${field} must not exceed ${rules.max}.`);
          }
        }
      }

      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed.",
          errors,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;
