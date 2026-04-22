/** Codes métier renvoyés par l’API (champ `code` dans le JSON d’erreur). */
export const ApiErrorCodes = {
  SINGLE_PUBLIC_ALBUM_ONLY: "SINGLE_PUBLIC_ALBUM_ONLY",
  CANNOT_DELETE_DEFAULT_PUBLIC_ALBUM: "CANNOT_DELETE_DEFAULT_PUBLIC_ALBUM",
  GUEST_UPLOAD_DISABLED: "GUEST_UPLOAD_DISABLED",
} as const;

export type ApiErrorCode = (typeof ApiErrorCodes)[keyof typeof ApiErrorCodes];

export function getApiErrorPayload(err: unknown): { detail?: string; code?: string } | null {
  const ax = err as { response?: { data?: { detail?: string; code?: string } } };
  const data = ax?.response?.data;
  if (data && typeof data === "object") {
    return {
      detail: typeof data.detail === "string" ? data.detail : undefined,
      code: typeof data.code === "string" ? data.code : undefined,
    };
  }
  return null;
}
