/**
 * Contrat des erreurs de validation API.
 * Garder en sync avec site-herve_front/src/types/api.ts (ValidationDetail).
 */
export interface ValidationDetail {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  success: false;
  code: string;
  message: string;
  details?: ValidationDetail[];
}
