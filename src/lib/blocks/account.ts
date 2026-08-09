import { blocksFetch } from "./http";

export interface ActivateInput {
  code: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Invite-and-activate only (blocks-iam-account) — turns a freshly invited, inactive user
 * active by validating the invitation `code` and setting a password. Needs no bearer
 * token (the code is the credential), so this is a direct Blocks call, not routed
 * through the Next.js backend.
 */
export function activate(input: ActivateInput) {
  return blocksFetch<{ isSuccess?: boolean; errors?: unknown }>(`/iam/v4/auth/activate`, {
    method: "POST",
    body: JSON.stringify({
      captchaCode: "",
      mailPurpose: "",
      preventPostEvent: false,
      ...input,
    }),
  });
}
