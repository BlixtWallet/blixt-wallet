import React from "react";
import { View, ViewProps } from "react-native";

type SvgShimProps = React.PropsWithChildren<ViewProps & Record<string, unknown>>;

function createSvgShim(displayName: string) {
  const Component = React.forwardRef<View, SvgShimProps>(
    ({ children, style }, ref) => {
      return (
        <View ref={ref} style={style}>
          {children}
        </View>
      );
    },
  );

  Component.displayName = displayName;

  return Component;
}

const Svg = createSvgShim("Svg");

export const Circle = createSvgShim("Circle");
export const ClipPath = createSvgShim("ClipPath");
export const Defs = createSvgShim("Defs");
export const Ellipse = createSvgShim("Ellipse");
export const G = createSvgShim("G");
export const Image = createSvgShim("Image");
export const Line = createSvgShim("Line");
export const LinearGradient = createSvgShim("LinearGradient");
export const Mask = createSvgShim("Mask");
export const Path = createSvgShim("Path");
export const Pattern = createSvgShim("Pattern");
export const Polygon = createSvgShim("Polygon");
export const Polyline = createSvgShim("Polyline");
export const RadialGradient = createSvgShim("RadialGradient");
export const Rect = createSvgShim("Rect");
export const Stop = createSvgShim("Stop");
export const Symbol = createSvgShim("Symbol");
export const Text = createSvgShim("Text");
export const TextPath = createSvgShim("TextPath");
export const TSpan = createSvgShim("TSpan");
export const Use = createSvgShim("Use");

export const SvgCss = createSvgShim("SvgCss");
export const SvgCssUri = createSvgShim("SvgCssUri");
export const SvgUri = createSvgShim("SvgUri");
export const SvgXml = createSvgShim("SvgXml");
export const ForeignObject = createSvgShim("ForeignObject");

export { Svg };
export default Svg;
