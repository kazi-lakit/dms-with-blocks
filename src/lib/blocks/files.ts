import { blocksFilesFetch } from "./http";

/**
 * Matches the data-service swagger for this project
 * (https://blocksapi.dev.slsblx.com/data/v4/swagger/v1/swagger.json), not the older
 * `/Files/GetDmsFileAndFolder`-based contract described in the blocks-data-storage
 * skill — this project's data service has moved on to a dedicated `/Directory/*`
 * resource for folders, alongside `/Files/*` for file content.
 *
 * Storage calls run against a separate local instance of that service
 * (`NEXT_PUBLIC_BLOCKS_STORAGE_API_URL`, default `http://localhost:9000`), not the
 * `blocksapi.dev.slsblx.com` gateway used for IAM — and that instance's base path is
 * `/api`, matching the swagger exactly (e.g. `/api/Directory/GetDirectoryChildren`).
 * See `blocksFilesFetch` in `./http`.
 */

export interface PresignResponse {
  isSuccess?: boolean;
  uploadUrl?: string;
  fileId?: string;
}

// DomainService.Storage.FileResponse
export interface FileRecord {
  itemId?: string;
  name?: string;
  url?: string;
  sizeInBytes?: number;
  createDate?: string;
  parentDirectoryID?: string;
}

/**
 * A folder/file row from `/Directory/GetDirectoryChildren`. The live swagger declares
 * this endpoint's response with no schema (just "200 OK"), so the exact field names
 * are unconfirmed — `normalizeDirectoryChildren` below tries the plausible shapes
 * defensively. If the drive UI shows nothing where files are expected, capture the
 * real response from the browser's Network tab and tighten this up.
 */
export interface DirectoryChild {
  id: string;
  name: string;
  isFolder: boolean;
  sizeInBytes?: number;
  createdDate?: string;
}

interface DirectoryChildrenPage {
  entries: DirectoryChild[];
  nextCursor?: string;
}

function providerHeaders(uploadUrl: string, contentType: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": contentType || "application/octet-stream" };
  if (/\.blob\.core\.windows\.net/i.test(uploadUrl)) {
    headers["x-ms-blob-type"] = "BlockBlob";
  }
  return headers;
}

export const filesApi = {
  // POST /Files/GetPreSignedUrlForUpload — DomainService.Storage.GetPreSignedUrlForUploadRequest
  presign: (name: string, parentDirectoryId = "", accessModifier: "Public" | "Private" = "Private") =>
    blocksFilesFetch<PresignResponse>(`/Files/GetPreSignedUrlForUpload`, {
      method: "POST",
      body: JSON.stringify({
        name,
        parentDirectoryId,
        accessModifier,
        configurationName: "Default",
        moduleName: 3,
        tags: "",
        metaData: "{}",
      }),
    }),

  /** Presign, then PUT the raw bytes straight to storage. No `/Files/UploadFile` step. */
  upload: async (file: File, parentDirectoryId = ""): Promise<FileRecord> => {
    const { uploadUrl, fileId } = await filesApi.presign(file.name, parentDirectoryId);
    if (!uploadUrl || !fileId) throw new Error("Presign failed — no uploadUrl/fileId returned");

    const put = await fetch(uploadUrl, {
      method: "PUT",
      headers: providerHeaders(uploadUrl, file.type),
      body: file,
    });
    if (!put.ok) throw new Error(`Storage upload failed: ${put.status}`);

    return filesApi.get(fileId);
  },

  // GET /Files/GetFile?FileId=&ConfigurationName=&Version=
  get: (fileId: string, configurationName = "Default") =>
    blocksFilesFetch<FileRecord>(`/Files/GetFile?FileId=${fileId}&ConfigurationName=${configurationName}`),

  // POST /Files/GetFiles — DomainService.Storage.GetFilesRequest
  getMany: (fileIds: string[], configurationName = "Default") =>
    blocksFilesFetch<FileRecord[]>(`/Files/GetFiles`, {
      method: "POST",
      body: JSON.stringify({ fileIds, configurationName }),
    }),

  // POST /Files/DeleteFile — DomainService.Storage.DeleteFileRequest -> Blocks.Genesis.BaseResponse
  deleteFile: (fileId: string, configurationName = "Default") =>
    blocksFilesFetch<{ isSuccess?: boolean }>(`/Files/DeleteFile`, {
      method: "POST",
      body: JSON.stringify({ fileId, configurationName }),
    }),

  // POST /Files/MoveFile — DomainService.Storage.Dms.MoveFileRequest
  moveFile: (fileId: string, targetDirectoryId: string) =>
    blocksFilesFetch<{ isSuccess?: boolean }>(`/Files/MoveFile`, {
      method: "POST",
      body: JSON.stringify({ fileId, targetDirectoryId }),
    }),

  // POST /Files/CopyFile — DomainService.Storage.Dms.CopyFileRequest
  copyFile: (fileId: string, targetDirectoryId: string, copyAccessPolicies = false) =>
    blocksFilesFetch<{ isSuccess?: boolean }>(`/Files/CopyFile`, {
      method: "POST",
      body: JSON.stringify({ fileId, targetDirectoryId, copyAccessPolicies }),
    }),
};

// The root listing (no directory picked yet) has no DirectoryId to pass, so it
// identifies itself by ModuleName instead — confirmed live for this project. Once
// you're inside a folder, DirectoryId alone is enough and ModuleName is dropped.
const ROOT_MODULE_NAME = 8;

export const directoryApi = {
  // GET /Directory/GetDirectoryChildren?DirectoryId=&Cursor=&Limit=&Type=&Search=&ModuleName=
  getChildren: (directoryId: string, opts: { cursor?: string; limit?: number; search?: string } = {}) => {
    const params = new URLSearchParams();
    if (directoryId) {
      params.set("DirectoryId", directoryId);
    } else {
      params.set("ModuleName", String(ROOT_MODULE_NAME));
    }
    if (opts.cursor) params.set("Cursor", opts.cursor);
    params.set("Limit", String(opts.limit ?? 200));
    if (opts.search) params.set("Search", opts.search);
    return blocksFilesFetch<unknown>(`/Directory/GetDirectoryChildren?${params.toString()}`);
  },

  // POST /Directory/CreateRootDirectory or /Directory/CreateDirectory — DomainService.Storage.Dms.CreateDirectoryRequest
  createDirectory: (name: string, parentDirectoryId = "") =>
    blocksFilesFetch<{ isSuccess?: boolean; errors?: unknown }>(
      parentDirectoryId ? `/Directory/CreateDirectory` : `/Directory/CreateRootDirectory`,
      {
        method: "POST",
        body: JSON.stringify(
          parentDirectoryId ? { name, parentDirectoryId, configurationName: "Default" } : { name, configurationName: "Default" }
        ),
      }
    ),

  // POST /Directory/CreateDirectory — the user's own drive root. No parentDirectoryId;
  // ModuleName=8 identifies it as a drive directory instead, same module id as the root
  // listing above. Confirmed live for this project.
  createDriveRoot: (name: string) =>
    blocksFilesFetch<unknown>(`/Directory/CreateDirectory`, {
      method: "POST",
      body: JSON.stringify({ name, moduleName: ROOT_MODULE_NAME, configurationName: "Default" }),
    }),

  // POST /Directory/DeleteDirectory — DomainService.Storage.Dms.DeleteDirectoryContentRequest
  // `permanent: false` moves it to trash rather than erasing it outright — there's no
  // trash/restore UI in this app yet, but it either disappears from listings either way.
  deleteDirectory: (directoryId: string, permanent = false) =>
    blocksFilesFetch<{ isSuccess?: boolean }>(`/Directory/DeleteDirectory`, {
      method: "POST",
      body: JSON.stringify({ directoryId, permanent }),
    }),

  // POST /Directory/MoveDirectory — DomainService.Storage.Dms.MoveDirectoryRequest
  moveDirectory: (directoryId: string, targetDirectoryId: string) =>
    blocksFilesFetch<{ isSuccess?: boolean }>(`/Directory/MoveDirectory`, {
      method: "POST",
      body: JSON.stringify({ directoryId, targetDirectoryId }),
    }),
};

/**
 * Neither `GetDirectoryChildren` nor `GetSharedContent` (access.ts) declare a response
 * schema — both return the same kind of file/directory row, so this envelope/row
 * parsing is shared between them rather than duplicated.
 */
export function extractEntryList(raw: unknown): unknown[] {
  return Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown })?.data)
      ? (raw as { data: unknown[] }).data
      : Array.isArray((raw as { items?: unknown })?.items)
        ? (raw as { items: unknown[] }).items
        : Array.isArray((raw as { children?: unknown })?.children)
          ? (raw as { children: unknown[] }).children
          : Array.isArray((raw as { result?: unknown })?.result)
            ? (raw as { result: unknown[] }).result
            : [];
}

export function parseDirectoryChildEntry(entry: unknown): DirectoryChild {
  const row = entry as Record<string, unknown>;
  const id = (row.id ?? row.itemId ?? row.directoryId ?? row.fileId ?? "") as string;
  const name = (row.name ?? "") as string;
  // Confirmed live: `type` is a string ("directory" | "file"), not the numeric
  // StructureType enum used elsewhere in this API — check it first.
  const isFolder =
    (typeof row.type === "string" && row.type.toLowerCase() === "directory") ||
    Boolean(row.isFolder ?? row.isDirectory) ||
    row.type === 1 ||
    row.typeString === "Directory" ||
    row.structureType === 1;
  const sizeInBytes = (row.sizeInBytes as number | undefined) ?? undefined;
  const createdDate = (row.createDate ?? row.createdDate) as string | undefined;
  return { id, name, isFolder, sizeInBytes, createdDate };
}

export function extractNextCursor(raw: unknown): string | undefined {
  const envelope = raw && typeof raw === "object" ? (raw as { nextCursor?: string; cursor?: string }) : {};
  return envelope.nextCursor ?? envelope.cursor;
}

/**
 * `GetDirectoryChildren`'s response has no declared schema — try the plausible
 * envelopes and field-name variants rather than assume one. Logs the raw shape once in
 * dev so it's easy to tighten this up against the real response.
 */
export function normalizeDirectoryChildren(raw: unknown): DirectoryChildrenPage {
  const list = extractEntryList(raw);

  if (list.length === 0 && raw && typeof raw === "object" && process.env.NODE_ENV !== "production") {
    console.warn("GetDirectoryChildren: unrecognized response shape", raw);
  }

  return { entries: list.map(parseDirectoryChildEntry), nextCursor: extractNextCursor(raw) };
}

/**
 * `CreateDirectory`/`CreateRootDirectory` also has no declared response schema — pull
 * the new directory's id out of whichever field it actually comes back as.
 */
export function extractCreatedDirectoryId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = row.itemId ?? row.id ?? row.directoryId ?? row.ItemId ?? row.Id ?? row.DirectoryId;
  if (typeof id === "string" && id.length > 0) return id;
  if (process.env.NODE_ENV !== "production") {
    console.warn("CreateDirectory: couldn't find an id in the response", raw);
  }
  return null;
}
