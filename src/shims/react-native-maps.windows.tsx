import React, { PropsWithChildren, forwardRef } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

type MapViewShimProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

const MapView = forwardRef<View, MapViewShimProps>(function MapViewShim({ children, style }, ref) {
  return (
    <View ref={ref} style={style}>
      {children}
    </View>
  );
});

export function Marker(_props: PropsWithChildren<Record<string, unknown>>) {
  return null;
}

export const PROVIDER_DEFAULT = undefined;
export const PROVIDER_GOOGLE = "google";

export default MapView;
