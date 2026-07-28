const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");
const { resolve } = require("metro-resolver");

const fs = require("fs");
const path = require("node:path");

const rnwPath = fs.realpathSync(
  path.resolve(require.resolve("react-native-windows/package.json"), ".."),
);
const rnviPath = fs.realpathSync(
  path.resolve(require.resolve("react-native-vector-icons/package.json"), ".."),
);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pathToRegExpSource = (absolutePath) =>
  absolutePath
    .split(/[/\\]+/)
    .map(escapeRegExp)
    .join("[\\\\/]");

const windowsPathRegExpSource = pathToRegExpSource(path.resolve(__dirname, "windows"));
const rnwPathRegExpSource = pathToRegExpSource(rnwPath);
const isPathInside = (filePath, directoryPath) => {
  const relativePath = path.relative(directoryPath, filePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
};

//

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const config = {
  //
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (
        platform === "windows" &&
        (moduleName === "./create-icon-set" || moduleName === "./lib/create-icon-set") &&
        context.originModulePath &&
        isPathInside(context.originModulePath, rnviPath)
      ) {
        return {
          filePath: path.resolve(
            __dirname,
            "src/shims/react-native-vector-icons-create-icon-set.windows.js",
          ),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native") {
        return resolve(
          {
            ...context,
            resolveRequest: null,
          },
          "react-native-windows",
          platform,
        );
      }

      if (platform === "windows" && moduleName.startsWith("react-native/")) {
        return resolve(
          {
            ...context,
            resolveRequest: null,
          },
          `react-native-windows/${moduleName.slice("react-native/".length)}`,
          platform,
        );
      }

      if (platform === "windows" && moduleName === "@react-native-clipboard/clipboard") {
        return {
          filePath: path.resolve(__dirname, "src/shims/clipboard.windows.ts"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "@react-native-community/slider") {
        return {
          filePath: path.resolve(__dirname, "src/shims/slider.windows.tsx"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "@react-native-community/geolocation") {
        return {
          filePath: path.resolve(__dirname, "src/shims/geolocation.windows.ts"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "@react-native-documents/picker") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-documents-picker.windows.ts"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-keyboard-controller") {
        return {
          filePath: path.resolve(
            __dirname,
            "src/shims/react-native-keyboard-controller.windows.tsx",
          ),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-vision-camera") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-vision-camera.windows.tsx"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-permissions") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-permissions.windows.ts"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-webview") {
        return {
          filePath: path.resolve(__dirname, "src/shims/webview.windows.tsx"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-turbo-lnd") {
        return resolve(
          {
            ...context,
            resolveRequest: null,
          },
          "react-native-turbo-lnd/mock",
          platform,
        );
      }

      if (platform === "windows" && moduleName === "react-native-drawer-layout") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-drawer-layout.windows.tsx"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-fs") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-fs.windows.ts"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-maps") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-maps.windows.tsx"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-nitro-tor") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-nitro-tor.windows.ts"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-svg") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-svg.windows.tsx"),
          type: "sourceFile",
        };
      }

      if (platform === "windows" && moduleName === "react-native-svg/css") {
        return {
          filePath: path.resolve(__dirname, "src/shims/react-native-svg-css.windows.tsx"),
          type: "sourceFile",
        };
      }

      return resolve(
        {
          ...context,
          resolveRequest: null,
        },
        moduleName,
        platform,
      );
    },
    blockList: [
      // This stops "npx @react-native-community/cli run-windows" from causing the metro server to crash if its already running
      new RegExp(`^${windowsPathRegExpSource}(?:[\\\\/].*)?$`, "i"),
      // This prevents "npx @react-native-community/cli run-windows" from hitting: EBUSY: resource busy or locked, open msbuild.ProjectImports.zip or other files produced by msbuild
      new RegExp(`^${rnwPathRegExpSource}[\\\\/]build(?:[\\\\/].*)?$`, "i"),
      new RegExp(`^${rnwPathRegExpSource}[\\\\/]target(?:[\\\\/].*)?$`, "i"),
      /.*\.ProjectImports\.zip/i,
    ],
    unstable_enablePackageExports: true,
    //
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
