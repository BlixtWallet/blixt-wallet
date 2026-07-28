type ReadDirItem = {
  ctime: Date | null;
  mtime: Date | null;
  name: string;
  path: string;
  size: number;
  isFile: () => boolean;
  isDirectory: () => boolean;
};

const RNFSFileTypeRegular = 0;
const RNFSFileTypeDirectory = 1;

export const MainBundlePath = "";
export const CachesDirectoryPath = "blixt/cache";
export const DocumentDirectoryPath = "blixt";
export const TemporaryDirectoryPath = "blixt/temp";
export const DownloadDirectoryPath = "blixt/downloads";
export const ExternalCachesDirectoryPath = CachesDirectoryPath;
export const ExternalDirectoryPath = DocumentDirectoryPath;
export const ExternalStorageDirectoryPath = DocumentDirectoryPath;
export const LibraryDirectoryPath = DocumentDirectoryPath;
export const PicturesDirectoryPath = DocumentDirectoryPath;
export const FileProtectionKeys = {};

const virtualDirectories = new Set<string>([
  DocumentDirectoryPath,
  CachesDirectoryPath,
  TemporaryDirectoryPath,
  DownloadDirectoryPath,
]);
const virtualFiles = new Map<string, string>();

const normalizeFilePath = (filepath: string) => filepath.replace(/^file:\/\//, "").replace(/\\/g, "/");

const getParentPath = (filepath: string) => {
  const normalized = normalizeFilePath(filepath).replace(/\/+$/, "");
  const index = normalized.lastIndexOf("/");
  return index > 0 ? normalized.slice(0, index) : "";
};

const makeReadDirItem = (path: string, isFile: boolean, size: number): ReadDirItem => ({
  ctime: null,
  mtime: null,
  name: path.split("/").pop() ?? path,
  path,
  size,
  isFile: () => isFile,
  isDirectory: () => !isFile,
});

export const mkdir = async (filepath: string) => {
  const normalized = normalizeFilePath(filepath).replace(/\/+$/, "");
  if (normalized) {
    virtualDirectories.add(normalized);
  }
};

export const exists = async (filepath: string) => {
  const normalized = normalizeFilePath(filepath).replace(/\/+$/, "");
  return virtualDirectories.has(normalized) || virtualFiles.has(normalized);
};

export const writeFile = async (filepath: string, contents: string) => {
  const normalized = normalizeFilePath(filepath);
  const parent = getParentPath(normalized);
  if (parent) {
    virtualDirectories.add(parent);
  }
  virtualFiles.set(normalized, contents);
};

export const appendFile = async (filepath: string, contents: string) => {
  const normalized = normalizeFilePath(filepath);
  const current = virtualFiles.get(normalized) ?? "";
  await writeFile(normalized, `${current}${contents}`);
};

export const readFile = async (filepath: string) => {
  const normalized = normalizeFilePath(filepath);
  const content = virtualFiles.get(normalized);
  if (typeof content === "string") {
    return content;
  }

  throw new Error("react-native-fs is disabled on Windows for now");
};

export const readDir = async (dirpath: string): Promise<ReadDirItem[]> => {
  const normalized = normalizeFilePath(dirpath).replace(/\/+$/, "");
  const prefix = normalized ? `${normalized}/` : "";
  const items = new Map<string, ReadDirItem>();

  for (const directory of virtualDirectories) {
    if (!directory.startsWith(prefix) || directory === normalized) {
      continue;
    }
    const remainder = directory.slice(prefix.length);
    if (!remainder || remainder.includes("/")) {
      continue;
    }
    items.set(directory, makeReadDirItem(directory, false, 0));
  }

  for (const [filePath, contents] of virtualFiles.entries()) {
    if (!filePath.startsWith(prefix)) {
      continue;
    }
    const remainder = filePath.slice(prefix.length);
    if (!remainder || remainder.includes("/")) {
      continue;
    }
    items.set(filePath, makeReadDirItem(filePath, true, contents.length));
  }

  return [...items.values()];
};

export const unlink = async (filepath: string) => {
  const normalized = normalizeFilePath(filepath).replace(/\/+$/, "");
  const prefix = `${normalized}/`;

  virtualDirectories.delete(normalized);
  virtualFiles.delete(normalized);

  for (const directory of [...virtualDirectories]) {
    if (directory.startsWith(prefix)) {
      virtualDirectories.delete(directory);
    }
  }

  for (const path of [...virtualFiles.keys()]) {
    if (path.startsWith(prefix)) {
      virtualFiles.delete(path);
    }
  }
};

const RNFS = {
  RNFSFileTypeRegular,
  RNFSFileTypeDirectory,
  MainBundlePath,
  CachesDirectoryPath,
  DocumentDirectoryPath,
  TemporaryDirectoryPath,
  DownloadDirectoryPath,
  ExternalCachesDirectoryPath,
  ExternalDirectoryPath,
  ExternalStorageDirectoryPath,
  LibraryDirectoryPath,
  PicturesDirectoryPath,
  FileProtectionKeys,
  mkdir,
  exists,
  writeFile,
  appendFile,
  readFile,
  readDir,
  unlink,
};

export { RNFSFileTypeRegular, RNFSFileTypeDirectory };
export default RNFS;
