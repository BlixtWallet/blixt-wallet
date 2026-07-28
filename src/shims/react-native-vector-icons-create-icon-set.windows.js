import createIconSet, {
  DEFAULT_ICON_COLOR,
  DEFAULT_ICON_SIZE,
  NativeIconAPI,
} from "react-native-vector-icons/lib/create-icon-set";

const WINDOWS_FONT_STYLES = {
  "FontAwesome5_Brands.ttf": {
    fontFamily: "Font Awesome 5 Brands",
    fontWeight: "400",
  },
  "FontAwesome5_Regular.ttf": {
    fontFamily: "Font Awesome 5 Free",
    fontWeight: "400",
  },
  "FontAwesome5_Solid.ttf": {
    fontFamily: "Font Awesome 5 Free",
    fontWeight: "900",
  },
  "Fontisto.ttf": {
    fontFamily: "fontisto",
  },
};

export { DEFAULT_ICON_COLOR, DEFAULT_ICON_SIZE, NativeIconAPI };

export default function createWindowsIconSet(glyphMap, fontFamily, fontFile, fontStyle) {
  const windowsFontStyle = WINDOWS_FONT_STYLES[fontFile] || { fontFamily };
  const Icon = createIconSet(glyphMap, fontFamily, fontFile, {
    ...(fontStyle || {}),
    ...windowsFontStyle,
  });

  Icon.getFontFamily = () => windowsFontStyle.fontFamily;
  return Icon;
}
