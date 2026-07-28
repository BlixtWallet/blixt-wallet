import type { CodegenTypes } from "react-native";
import { DevSettings } from "react-native";
import * as base64 from "base64-js";

import type { BuildChain, Spec } from "./NativeBlixtTools";

const runtimeGlobals = globalThis as Record<string, unknown>;

const chain = ((runtimeGlobals.CHAIN ?? "mainnet") as BuildChain) ?? "mainnet";
const debug = Boolean(runtimeGlobals.DEBUG ?? __DEV__);
const flavor = String(runtimeGlobals.FLAVOR ?? "fakelnd");
const applicationId = String(runtimeGlobals.APPLICATION_ID ?? "com.blixtwallet.windows");
const versionName = String(runtimeGlobals.VERSION_NAME ?? "0.9.0-windows");
const versionCode = Number(runtimeGlobals.VERSION_CODE ?? 0);
const buildType = String(runtimeGlobals.BUILD_TYPE ?? (debug ? "debug" : "release"));

const APP_FOLDER_PATH = "blixt/";
const LND_FOLDER_PATH = `${APP_FOLDER_PATH}lnd/`;
const CACHE_FOLDER_PATH = `${APP_FOLDER_PATH}cache/`;
const LOG_FILE_PATH = `${APP_FOLDER_PATH}blixt.log`;
const SPEEDLOADER_LOG_FILE_PATH = `${CACHE_FOLDER_PATH}speedloader.log`;
const SPEEDLOADER_LASTRUN_PATH = `${APP_FOLDER_PATH}speedloader-lastrun`;
const SPEEDLOADER_DGRAPH_PATH = `${CACHE_FOLDER_PATH}dgraph`;
const virtualFiles = new Map<string, string>();

const emptyLndLogEmitter = ((_: (payload: string) => void) => ({
  remove() {},
})) as Spec["onLndLog"];

const ensureBaseDirectories = async () => {
  return;
};

const appendLogLine = async (line: string) => {
  const current = virtualFiles.get(LOG_FILE_PATH) ?? "";
  virtualFiles.set(LOG_FILE_PATH, `${current}${line}\n`);
};

const tailFile = async (path: string, numberOfLines: number) => {
  const content = virtualFiles.get(path);
  if (!content) {
    return "";
  }

  return content.split(/\r?\n/).slice(-numberOfLines).join("\n");
};

const deleteIfExists = async (path: string) => {
  const normalizedPath = path.endsWith("/") ? path : `${path}/`;
  for (const key of [...virtualFiles.keys()]) {
    if (key === path || key.startsWith(normalizedPath)) {
      virtualFiles.delete(key);
    }
  }
  return true;
};

const unsupportedOperation = async (operation: string): Promise<never> => {
  throw new Error(`${operation} is not supported on Windows yet`);
};

const getRandomBytes = (length: number) => {
  const bytes = new Uint8Array(length);
  const cryptoObject = runtimeGlobals.crypto as
    | {
        getRandomValues?: (array: Uint8Array) => Uint8Array;
      }
    | undefined;

  if (cryptoObject?.getRandomValues) {
    cryptoObject.getRandomValues(bytes);
    return bytes;
  }

  // Temporary fallback until this shim is replaced by a native Windows module.
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  return bytes;
};

const NativeBlixtToolsWindows: Spec = {
  getFlavor: () => flavor,
  getDebug: () => debug,
  getVersionCode: () => versionCode,
  getBuildType: () => buildType,
  getApplicationId: () => applicationId,
  getVersionName: () => versionName,
  getAppleTeamId: () => "",
  getChain: () => chain,

  writeConfig: async (config) => {
    await ensureBaseDirectories();
    const configPath = `${LND_FOLDER_PATH}lnd.conf`;
    virtualFiles.set(configPath, config);
    return configPath;
  },
  generateSecureRandomAsBase64: async (length) => {
    return base64.fromByteArray(getRandomBytes(length));
  },
  log: (level, tag, message) => {
    const line = `[${new Date().toISOString()}] ${level.toUpperCase()}/${tag}: ${message}`;

    switch (level) {
      case "e":
        console.error(line);
        break;
      case "w":
        console.warn(line);
        break;
      default:
        console.log(line);
        break;
    }

    void appendLogLine(line);
  },
  saveLogs: async () => {
    await ensureBaseDirectories();
    return LOG_FILE_PATH;
  },
  copyLndLog: async () => false,
  copySpeedloaderLog: async () => false,
  tailLog: async (numberOfLines) => await tailFile(LOG_FILE_PATH, numberOfLines),
  observeLndLogFile: async () => false,
  tailSpeedloaderLog: async (numberOfLines) =>
    await tailFile(SPEEDLOADER_LOG_FILE_PATH, numberOfLines),
  saveChannelsBackup: async () => false,
  saveChannelBackupFile: async () => false,
  getTorEnabled: async () => false,
  DEBUG_deleteSpeedloaderLastrunFile: async () => await deleteIfExists(SPEEDLOADER_LASTRUN_PATH),
  DEBUG_deleteSpeedloaderDgraphDirectory: async () => await deleteIfExists(SPEEDLOADER_DGRAPH_PATH),
  DEBUG_deleteNeutrinoFiles: async () => true,
  getInternalFiles: async () => {
    return [...virtualFiles.entries()].reduce<{ [filePath: string]: number }>((files, [path, data]) => {
      if (!path.startsWith(APP_FOLDER_PATH)) {
        return files;
      }
      files[path] = data.length;
      return files;
    }, {});
  },
  getCacheDir: async () => {
    return CACHE_FOLDER_PATH;
  },
  getFilesDir: async () => {
    return APP_FOLDER_PATH;
  },
  getAppFolderPath: async () => {
    return APP_FOLDER_PATH;
  },
  saveChannelDbFile: async () => await unsupportedOperation("channel.db export"),
  importChannelDbFile: async () => await unsupportedOperation("channel.db import"),
  getIntentStringData: async () => null,
  getIntentNfcData: async () => null,
  DEBUG_deleteWallet: async () => await deleteIfExists(LND_FOLDER_PATH),
  DEBUG_deleteDatafolder: async () => await deleteIfExists(APP_FOLDER_PATH),
  restartApp: () => {
    if (typeof DevSettings.reload === "function") {
      DevSettings.reload();
      return;
    }

    console.warn("restartApp() is not supported on Windows yet");
  },
  checkICloudEnabled: async () => false,
  checkApplicationSupportExists: async () => {
    await ensureBaseDirectories();
    return true;
  },
  createIOSApplicationSupportAndLndDirectories: async () => true,
  excludeLndICloudBackup: async () => true,
  macosOpenFileDialog: async () => null,
  onLndLog: emptyLndLogEmitter as CodegenTypes.EventEmitter<string>,
};

export default NativeBlixtToolsWindows;
