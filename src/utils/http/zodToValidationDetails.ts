import type { ZodError } from "zod";
import type { ValidationDetail } from "../../types/apiError";

export function zodToValidationDetails(error: ZodError): ValidationDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "_root",
    message: issue.message,
  }));
}
