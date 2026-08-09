import { FileText, FileImage, FileSpreadsheet, FileArchive, Folder, File as FileIcon } from "lucide-react";

const EXT_ICON: Record<string, typeof FileText> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  md: FileText,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  svg: FileImage,
  webp: FileImage,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  zip: FileArchive,
  rar: FileArchive,
  "7z": FileArchive,
};

export function EntryIcon({ isFolder, name, className }: { isFolder: boolean; name: string; className?: string }) {
  if (isFolder) return <Folder className={className} fill="currentColor" fillOpacity={0.12} />;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const Icon = EXT_ICON[ext] ?? FileIcon;
  return <Icon className={className} />;
}
