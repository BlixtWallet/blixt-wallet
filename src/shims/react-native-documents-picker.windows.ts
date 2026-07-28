const unsupported = async (): Promise<never> => {
  throw new Error("Document picking is not supported on Windows yet");
};

export const types = {
  allFiles: "*/*",
};

export const pick = unsupported;
export const keepLocalCopy = unsupported;
