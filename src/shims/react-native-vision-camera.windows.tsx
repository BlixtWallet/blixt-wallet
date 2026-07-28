import React, { forwardRef } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

export type CameraPosition = "back" | "front" | "external";

type CameraDevice = {
  id: string;
};

type Code = {
  value?: string;
};

type CodeScanner = {
  codeTypes: string[];
  onCodeScanned: (codes: Code[]) => void;
};

type CameraProps = {
  style?: StyleProp<ViewStyle>;
  codeScanner?: CodeScanner;
  device: CameraDevice;
  isActive: boolean;
};

const unavailablePermission = {
  hasPermission: false,
  requestPermission: async () => false,
};

export const Camera = forwardRef<View, CameraProps>(function CameraShim({ style }, ref) {
  return <View ref={ref} style={style} />;
});

export function useCameraDevice(_position: CameraPosition): CameraDevice | undefined {
  return undefined;
}

export function useCameraPermission() {
  return unavailablePermission;
}

export function useCodeScanner(scanner: CodeScanner): CodeScanner {
  return scanner;
}
