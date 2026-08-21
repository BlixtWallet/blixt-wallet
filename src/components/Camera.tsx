import React, { ReactNode, useEffect } from "react";
import { StyleProp, ViewStyle, InteractionManager, StyleSheet } from "react-native";
import {
  Camera,
  type TargetCameraPosition,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import {
  type TargetBarcodeFormat,
  useBarcodeScannerOutput,
} from "react-native-vision-camera-barcode-scanner";
import Container from "./Container";

const QR_CODE_FORMATS: TargetBarcodeFormat[] = ["qr-code"];

export interface ICamera {
  active?: boolean;
  children?: ReactNode;
  cameraType?: TargetCameraPosition;
  onRead?: (text: string) => void;
  onNotAuthorized?: () => void; // TODO(hsjoberg):
  style?: StyleProp<ViewStyle>;
}
export default function CameraComponent({
  children,
  onNotAuthorized,
  onRead,
  active,
  cameraType = "back",
}: ICamera) {
  const device = useCameraDevice(cameraType);
  const { hasPermission, requestPermission } = useCameraPermission();
  const barcodeScannerOutput = useBarcodeScannerOutput({
    barcodeFormats: QR_CODE_FORMATS,
    onBarcodeScanned: (barcodes) => {
      const value = barcodes[0]?.rawValue;
      if (value !== undefined) {
        onRead?.(value);
      }
    },
    onError: (error) => console.error("Failed to scan QR code", error),
  });
  active = active ?? true;

  useEffect(() => {
    (async () => {
      if (hasPermission === false) {
        setTimeout(async () => {
          console.log("Does not have camera permission");
          if (await !requestPermission()) {
            // TODO fix await
            onNotAuthorized?.();
          }
        }, 600);
      }
    })();
  }, [requestPermission, hasPermission]);

  if (!active || !hasPermission || !device) {
    return <Container style={{ backgroundColor: "black" }}>{children ?? <></>}</Container>;
  }

  return (
    <>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={active}
        outputs={[barcodeScannerOutput]}
      />
      {children}
    </>
  );
}
