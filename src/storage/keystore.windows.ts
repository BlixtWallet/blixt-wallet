import AsyncStorage from "@react-native-async-storage/async-storage";

// Temporary Windows bring-up shim. This is intentionally isolated so it can be
// replaced with real secure storage once a Windows-native backend exists.
const PREFIX = "@blixt/windows/insecure-keystore/";

const getStorageKey = (key: string) => `${PREFIX}${key}`;

export const setItem = async (key: string, value: string, _accessible?: unknown) => {
  await AsyncStorage.setItem(getStorageKey(key), value);
};

export const getItem = async (key: string): Promise<string | null> => {
  return await AsyncStorage.getItem(getStorageKey(key));
};

export const setItemObject = async <T>(key: string, value: T) =>
  await setItem(key, JSON.stringify(value));
export const getItemObject = async (key: string) => JSON.parse((await getItem(key)) || "null");

export const removeItem = async (key: string) => {
  await AsyncStorage.removeItem(getStorageKey(key));
};

export const setSeed = async (seed: string[]) => setItemObject("seed", seed);
export const getSeed = async (): Promise<string[] | null> => getItemObject("seed");
export const removeSeed = async () => removeItem("seed");

export const setPin = async (seed: string) => setItem("pin", seed);
export const getPin = async () => getItem("pin");
export const removePin = async () => removeItem("pin");

export const setWalletPassword = async (password: string) => setItem("password", password);
export const getWalletPassword = async (): Promise<string | null> => getItem("password");
