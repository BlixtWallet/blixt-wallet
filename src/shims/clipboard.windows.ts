import { useEffect, useState } from "react";
import { Clipboard as NativeClipboard } from "react-native";

type ClipboardListener = (content: string) => void;

const listeners = new Set<ClipboardListener>();

const Clipboard = {
  async getString() {
    return await NativeClipboard.getString();
  },
  setString(content: string) {
    NativeClipboard.setString(content);
    listeners.forEach((listener) => listener(content));
  },
  async hasString() {
    return (await NativeClipboard.getString()).length > 0;
  },
  addListener(listener: ClipboardListener) {
    listeners.add(listener);

    return {
      remove() {
        listeners.delete(listener);
      },
    };
  },
  removeAllListeners() {
    listeners.clear();
  },
};

export const useClipboard = () => {
  const [content, setContent] = useState("");

  useEffect(() => {
    Clipboard.getString().then(setContent, () => setContent(""));

    const subscription = Clipboard.addListener(setContent);
    return () => {
      subscription.remove();
    };
  }, []);

  return [content, Clipboard.setString] as const;
};

export default Clipboard;
