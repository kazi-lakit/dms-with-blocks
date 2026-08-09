import { blocksFetch } from "./http";

export interface BlocksRole {
  itemId: string;
  name: string;
  slug: string;
}

export const rolesApi = {
  // POST /iam/v4/iam/roles — roles are addressed by `slug` everywhere in IAM (role
  // hierarchy, user role assignment), so the share dialog uses slug as the principal id.
  list: () =>
    blocksFetch<{ data: BlocksRole[] }>(`/iam/v4/iam/roles`, {
      method: "POST",
      body: JSON.stringify({ page: 0, pageSize: 100 }),
    }).then((r) => r.data),
};
