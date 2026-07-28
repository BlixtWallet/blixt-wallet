import { Platform } from "react-native";

type DialogAndroidResult = {
  action: string;
  text?: string;
  selectedItem?: {
    id: string;
    label?: string;
  } | null;
};

type DialogAndroidModule = {
  actionPositive: string;
  actionNegative: string;
  actionDismiss: string;
  listRadio: string;
  alert(
    title: string | null,
    message?: string,
    options?: Record<string, unknown>,
  ): Promise<DialogAndroidResult>;
  prompt(
    title: string | null,
    message?: string,
    options?: Record<string, unknown>,
  ): Promise<DialogAndroidResult>;
  showPicker(
    title: string | null,
    message?: string,
    options?: Record<string, unknown>,
  ): Promise<DialogAndroidResult>;
};

const unsupportedDialogAndroid: DialogAndroidModule = {
  actionPositive: "actionPositive",
  actionNegative: "actionNegative",
  actionDismiss: "actionDismiss",
  listRadio: "listRadio",
  alert: async () => ({ action: "actionNegative" }),
  prompt: async () => ({ action: "actionNegative", text: "" }),
  showPicker: async () => ({ action: "actionNegative", selectedItem: null }),
};

const loadDialogAndroid = () => {
  const dialogModule = require("react-native-dialogs") as DialogAndroidModule & {
    default?: DialogAndroidModule;
  };

  return dialogModule.default ?? dialogModule;
};

const DialogAndroid = Platform.OS === "android" ? loadDialogAndroid() : unsupportedDialogAndroid;

export default DialogAndroid;
