import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { blixtTheme } from "../native-base-theme/variables/commonColor";
import { Chain } from "../utils/build";
import Color from "color";
import { PLATFORM } from "../utils/constants";
import { useStoreState } from "../state/store";

export default function BlixtHeader(props: any) {
  const useLegacyHeaderGradient = useStoreState((store) => store.settings.useLegacyHeaderGradient);

  const gradientColors =
    Chain === "mainnet"
      ? [blixtTheme.secondary, blixtTheme.primary]
      : [blixtTheme.lightGray, Color(blixtTheme.lightGray).darken(0.3).hex()];

  const containerStyle = {
    position: "absolute" as const,
    backgroundColor: blixtTheme.primary,
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    width: "100%",
    height: "100%",
  } as StyleProp<ViewStyle>;

  const windowsGradientSteps = Array.from({ length: 48 }, (_, index) => {
    const ratio = index / 47;
    return Color(gradientColors[0]).mix(Color(gradientColors[1]), ratio).hex();
  });

  if (useLegacyHeaderGradient && PLATFORM !== "web" && PLATFORM !== "windows") {
    const LinearGradient = require("react-native-linear-gradient")
      .default as typeof import("react-native-linear-gradient").default;
    return (
      <LinearGradient style={containerStyle} colors={gradientColors}>
        {props?.children}
      </LinearGradient>
    );
  }

  if (PLATFORM === "windows") {
    return (
      <View style={containerStyle}>
        <View pointerEvents="none" style={styles.windowsGradientOverlay}>
          {windowsGradientSteps.map((color, index) => (
            <View key={index} style={[styles.windowsGradientRow, { backgroundColor: color }]} />
          ))}
        </View>
        {props?.children}
      </View>
    );
  }

  const gradientCss = `linear-gradient(to bottom, ${gradientColors[0]}, ${gradientColors[1]})`;

  const gradientStyle: any =
    PLATFORM === "web"
      ? { backgroundImage: gradientCss }
      : { experimental_backgroundImage: gradientCss };

  return <View style={[{ ...containerStyle, ...gradientStyle }]}>{props?.children}</View>;
}

const styles = StyleSheet.create({
  windowsGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  windowsGradientRow: {
    flex: 1,
  },
});
