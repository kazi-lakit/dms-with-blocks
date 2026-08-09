"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  accessApi,
  normalizeAccessPolicies,
  normalizeSharedContent,
  type ContentPermission,
  type ContentPrincipalType,
  type ContentResourceType,
} from "./access";
import { directoryApi, filesApi, normalizeDirectoryChildren, type DirectoryChild } from "./files";
import { rolesApi } from "./roles";
import { usersApi } from "./users";

export function useDirectoryChildren(directoryId: string, search: string, enabled = true) {
  return useQuery({
    queryKey: ["directory", directoryId, search],
    queryFn: () => directoryApi.getChildren(directoryId, { search }).then(normalizeDirectoryChildren),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useSharedContent(type?: ContentResourceType, enabled = true) {
  return useQuery({
    queryKey: ["shared-content", type ?? "all"],
    queryFn: () => accessApi.getSharedContent({ type }).then(normalizeSharedContent),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useUploadFile(directoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => filesApi.upload(file, directoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["directory", directoryId] }),
  });
}

export function useCreateDirectory(directoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => directoryApi.createDirectory(name, directoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["directory", directoryId] }),
  });
}

export function useDeleteEntry(directoryId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: DirectoryChild) =>
      entry.isFolder ? directoryApi.deleteDirectory(entry.id) : filesApi.deleteFile(entry.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["directory", directoryId] }),
  });
}

export function useAccessPolicies(resourceId: string) {
  return useQuery({
    queryKey: ["access", resourceId],
    queryFn: () => accessApi.list(resourceId).then(normalizeAccessPolicies),
    enabled: Boolean(resourceId),
  });
}

export function useRoles() {
  return useQuery({ queryKey: ["roles"], queryFn: () => rolesApi.list(), staleTime: 60_000 });
}

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: () => usersApi.list(), staleTime: 60_000 });
}

export function useShareEntry(resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      resourceType: "Directory" | "File";
      principalType: ContentPrincipalType;
      principalId: string;
      permission: ContentPermission;
    }) => accessApi.share({ resourceId, ...params }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access", resourceId] }),
  });
}

export function useUpdateAccess(resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      policyItemId: string;
      resourceType: "Directory" | "File";
      principalType: ContentPrincipalType;
      principalId: string;
      permission: ContentPermission;
    }) => accessApi.update({ resourceId, ...params }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access", resourceId] }),
  });
}

export function useRevokeAccess(resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyItemId: string) => accessApi.revoke(resourceId, policyItemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["access", resourceId] }),
  });
}
