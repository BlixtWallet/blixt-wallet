# Windows Bring-Up

This file tracks the current React Native Windows bring-up state for `blixt-wallet`.

For the separate upstream-facing note about the Reanimated / Worklets Windows JavaScript fallback, see:

- [WINDOWS_REANIMATED_WORKLETS_UPSTREAM.md](WINDOWS_REANIMATED_WORKLETS_UPSTREAM.md)

## Current Goal

Get a Windows MVP booting with:

- app startup
- navigation
- TurboLnd Windows build integration, with the JS mock used for the current runtime
- TurboSqlite
- temporary JS/native shims where required

Feature parity is explicitly deferred.

## Build Status

The Windows project now uses `react-native 0.85.3`, `react-native-windows 0.85.0-preview.1`, and React `19.2.3`. A Debug x64 build, MSIX package, deployment, and launch completed successfully on 2026-07-28 with Visual Studio 2026 `18.7` and the generated `v145` toolset defaults. The app starts and reaches the main UI. The normal `bun run windows` command was also confirmed working without `--singleproc` on 2026-07-27.

The main class of native-package failures seen during bring-up was:

- `Microsoft.WindowsAppSDK.targets(19,9): error : No references were found for these Windows App SDK transitive dependencies`

This has shown up in third-party Windows projects that appear older than the current RNW/WinAppSDK expectations. The current app works around those packages by disabling Windows autolinking, using Metro shims, or temporarily suppressing the WinAppSDK verifier where noted below.

### RNW 0.85 preview on Visual Studio 2026

RNW 0.85's CLI requires Visual Studio `18.6.1+`, and its generated C++ app template declares `PlatformToolset=v145`. The current environment uses Visual Studio 2026 `18.7` with the C++ WinUI app development tools and `v145` toolset installed.

The `windows` package script intentionally leaves toolchain selection and MSBuild process concurrency at RNW's defaults:

- `bun run windows`

On the current x64 host, RNW defaults to an x64 build. The successful 2026-07-16 build included AsyncStorage, TurboLnd, TurboSqlite, app linking, and MSIX packaging. No `MinimumVisualStudioVersion`, `PlatformToolset`, or `--singleproc` compatibility override is currently needed.

### Disabled Windows autolinking

These packages are currently disabled for Windows in `react-native.config.js`:

- `react-native-linear-gradient`
  Reason: Windows native project failed the WinAppSDK transitive dependency check.
  App handling: `src/components/BlixtHeader.tsx` no longer imports it at module scope on Windows and uses the non-native gradient path instead.

- `react-native-permissions`
  Reason: Windows native project was generated against RNW `0.76.7` and failed the same WinAppSDK transitive dependency check.
  App handling: Windows autolinking is disabled and Metro resolves imports to `src/shims/react-native-permissions.windows.ts`, because the package's Windows JS entry still calls the native `RNPermissions` TurboModule at runtime. In this repo, Android uses `PermissionsAndroid` and `react-native-permissions` is only used for iOS-specific location permission flows.

- `@react-native-community/slider`
  Reason: Windows native project is an older UWP-style project and still fails the WinAppSDK transitive dependency verifier.
  App handling: Windows Metro resolves imports to `src/shims/slider.windows.tsx`. This keeps fee-rate entry working through the existing numeric text inputs while using a lightweight visual placeholder instead of the native slider.

- `react-native-screens`
  Reason: the package's Windows project was incompatible with the new-architecture bring-up under RNW `0.82.x`; it has not yet been revalidated against the current RNW 0.85 preview.
  App handling: Windows autolinking is disabled and `index.js` calls `enableScreens(Platform.OS !== "windows")` so React Navigation falls back to non-native screen containers on Windows.

- `react-native-webview`
  Reason: Windows native project still imports `Microsoft.ReactNative.Uwp.*` property sheets and explicitly requires `RnwNewArch=false`.
  App handling: Windows autolinking is disabled, Metro resolves imports to `src/shims/webview.windows.tsx`, and the WebLN browser menu item is hidden on Windows. The shim keeps static route imports safe without pretending to provide an embedded browser.

- `react-native-fs`
  Reason: the current package does not provide a working Windows new-arch native module in this app, and its JS entry crashes immediately when `RNFSManager` is missing.
  App handling: Windows autolinking is disabled, Metro resolves imports to `src/shims/react-native-fs.windows.ts`, and Windows backup/restore file flows are hidden where they still require real filesystem access. The shared SQLite module currently consumes the shim's process-relative `DocumentDirectoryPath`.

- `react-native-svg`
  Reason: the Windows native project and app-consumption path were too brittle during bring-up, and packaging/projection hacks still led to unstable startup behavior.
  App handling: Windows autolinking is disabled and Metro resolves imports to `src/shims/react-native-svg.windows.tsx` and `src/shims/react-native-svg-css.windows.tsx`.

- `@react-native-clipboard/clipboard`
  Reason: Windows native project was created with RNW `0.75.10` and failed the same WinAppSDK transitive dependency check.
  App handling: Windows Metro resolves package imports to `src/shims/clipboard.windows.ts`, because the upstream package hard-fails at import time when `RNCClipboard` is missing. The shim delegates reads and writes to React Native core's `Clipboard`, which RNW implements with the native Windows system clipboard.

### JavaScript-only dependency shims

Screen modules and navigation routes remain statically imported and registered on every platform. Unsupported dependencies are replaced at the Metro boundary instead of conditionally removing whole screens:

- `react-native-keyboard-controller` resolves to `src/shims/react-native-keyboard-controller.windows.tsx`, which provides a pass-through provider and React Native's standard `KeyboardAvoidingView`.
- `@react-native-documents/picker` resolves to `src/shims/react-native-documents-picker.windows.ts`. Its methods reject with an explicit unsupported error; the file-picker controls remain hidden until a real Windows picker is available.
- `@react-native-community/geolocation` and `react-native-maps` resolve to explicit Windows fallbacks. Geolocation reports `POSITION_UNAVAILABLE`, and map UI remains hidden until a Windows map implementation exists.
- `react-native-vision-camera` resolves to `src/shims/react-native-vision-camera.windows.tsx`. Camera routes remain statically registered, but the shim reports no camera device or permission and the scan/Send entry points are hidden on Windows.
- `react-native-drawer-layout` uses its packaged native drawer on Windows. Metro disables `.native` preference only for internal Reanimated and Worklets imports on Windows, restoring their JavaScript fallback while preserving `.windows` precedence.
- `index.js` imports the platform-resolved `src/shims/gesture-handler` bootstrap. The Windows variant is empty because Gesture Handler's root module probes a bridgeless `UIManager` API that RNW rejects even though the package includes a Windows no-op native-module file. React Navigation's stack resolves its own generic no-gesture adapter on Windows.
- `react-native-nitro-tor` resolves to `src/shims/react-native-nitro-tor.windows.ts`, which returns an explicit unsupported result if Tor is enabled on Windows.
- `react-native-turbo-lnd` root imports resolve to `react-native-turbo-lnd/mock`, and the Windows `NativeBlixtTools` adapter defaults `Flavor` to `fakelnd`. The package's native Windows project remains autolinked and builds against the fetched x64 DLL, but the current JS runtime does not start native `lnd`.
- `src/utils/push-notification.windows.ts` prevents developer-command screens from eagerly loading Notifee on Windows.

This keeps the shared ESM import graph valid for Vite and prevents navigation links from targeting routes that were omitted only to avoid evaluating an unsupported package.

### Icon fonts

The Windows app project links the existing `assets/fonts/*.ttf` files into the package as `Assets/*.ttf`. `BlixtWallet.cpp` registers those packaged fonts with `AddFontResourceW` before RNW initializes so Fabric can resolve them through the process font collection. The NativeBase theme uses the registered `IBM Plex Sans` family and Windows font weights.

Metro also redirects `react-native-vector-icons`' internal `create-icon-set` import to `src/shims/react-native-vector-icons-create-icon-set.windows.js`. This maps Font Awesome 5 and Fontisto file names to the family/weight names Windows actually registers. The 2026-07-25 Debug x64 MSIX was inspected and contains all 18 linked font files.

### Solution file cleanup

`windows/BlixtWallet.sln` retained stale project entries for disabled packages even after autolink no longer referenced them.

Removed stale solution projects:

- `Clipboard`
- `BVLinearGradient`
- `RNPermissions`
- `RNScreens`
- `ReactNativeWebView`
- `RNSVG`

This means Windows bring-up currently requires checking both:

- `windows/BlixtWallet/AutolinkedNativeModules.g.targets`
- `windows/BlixtWallet.sln`

Autolink being clean is not sufficient on its own.

### Solution line endings

`windows/BlixtWallet.sln` must stay on consistent `CRLF` line endings.

Reason:

- the RNW CLI solution updater in `@react-native-windows/cli` detects either `CRLF` or `LF` once, then splits the whole file on only that newline style
- a mixed-ending `.sln` makes the updater fail to see existing project/config lines
- when that happens it starts reinserting project blocks and config lines, which corrupts the solution and can move the UTF-8 BOM off the header line
- the visible failure from that corruption is `MSB5010: No file format header found`

Practical rule:

- do not leave `windows/BlixtWallet.sln` with mixed line endings after manual edits
- if the file is touched manually, normalize it back to `CRLF` before running `run-windows`

Current repo safeguard:

- `.gitattributes` forces `CRLF` for Visual Studio solution/project files
- `.editorconfig` mirrors that rule for local editor behavior
- the previous `postinstall` patch for `@react-native-windows/cli` was removed because patching `node_modules` is too dirty for a commit-ready state
- mixed-ending `.sln` files can still make autolink reinsert `ReactNativeTurboSqlite` blocks, move the BOM off the header line, and trigger `MSB5010`, so avoid manual LF edits to `windows/BlixtWallet.sln`

### Temporary verifier suppression

`windows/ExperimentalFeatures.props` now sets:

- `WindowsAppSDKVerifyTransitiveDependencies=false`

Reason:

- the enabled `@react-native-async-storage/async-storage` Windows project still trips the verifier under RNW `0.84.0` and Windows App SDK `1.8.260508005`
- retested with the verifier enabled on 2026-07-14; the build fails on `@react-native-async-storage/async-storage/windows/ReactNativeAsyncStorage/ReactNativeAsyncStorage.vcxproj`
- other incompatible Windows projects remain disabled through `react-native.config.js`, so this global suppression should be revisited when AsyncStorage's Windows project is updated

This is a bring-up shortcut, not a final correctness statement about those projects.

### MSVC PCH heap workaround

`Directory.Build.props` at the repo root now applies conservative C++ build settings to all `vcxproj` builds:

- `MultiProcessorCompilation=false`
- `MinimalRebuild=false`
- `TrackFileAccess=false`
- `PreferredToolArchitecture=x64`

Reason:

- during the earlier RNW 0.82 bring-up, the Windows build progressed into `Microsoft.ReactNative.vcxproj`
- local builds then hit `C3859` and `C1076` in Fabric/Composition sources because MSVC failed while creating/using PCH-backed compiler heap or mapped virtual memory
- this was not evidence of low physical RAM; this machine has plenty of RAM, so the likely issue is MSVC/PCH mapping behavior, commit/heap limits, or too much compiler concurrency around a very large PCH
- Microsoft's recommended mitigations for this class of PCH failures are x64 hosted tools and reducing the combined MSBuild `/m` plus compiler `/MP` concurrency
- `--singleproc` only reduces MSBuild project concurrency; it does not help if `cl.exe` still uses `/MP`
- the earlier CI-style `/MP` setting was still too aggressive for this build, so compiler-level parallelism is now disabled
- the RNW 0.85 preview NuGet-based build also succeeds with these conservative compiler settings and without `--singleproc`; their necessity should be re-evaluated separately before removing them

### Microsoft.ReactNative PCH fallback

`Directory.Build.targets` keeps a fallback switch for disabling precompiled headers specifically for `Microsoft.ReactNative`, but it is off by default:

- `BlixtDisableMicrosoftReactNativePch=false`

To re-enable the fallback for troubleshooting, build with:

- `/p:BlixtDisableMicrosoftReactNativePch=true`

Reason:

- the original bring-up disabled PCH because early builds still hit `C3859` / `C1076`
- after checking Microsoft's guidance, the build was retested with PCH enabled, x64 hosted tools, `/MP` disabled, and `run-windows --singleproc`
- that build succeeded on 2026-07-04, so PCH should stay enabled by default
- the opt-in fallback remains as an escape hatch if the MSVC PCH failure returns

### Microsoft.ReactNative warning suppression

`Directory.Build.targets` also suppresses warning `C4459` for `Microsoft.ReactNative`.

Reason:

- after the PCH fallback, the build progressed into `Microsoft.ReactNative` and then failed on a Folly header warning
- `Microsoft.ReactNative.vcxproj` treats warnings as errors
- the warning is from `node_modules/.folly/.../FBString.h`, not app code

### Windows App SDK bootstrap lib path

`Directory.Build.props` now defaults `Platform=x64` for `vcxproj` evaluation when `$(Platform)` is blank.

Reason:

- the Windows App SDK native props build the bootstrap lib path from `$(Platform)`
- in this bring-up, some imports evaluate before the vcxproj configuration has populated that property
- the resulting bad path looked like `lib\native\\Microsoft.WindowsAppRuntime.Bootstrap.lib` instead of `lib\native\x64\...`

## Current Runtime Status

The earlier `react-native 0.85.x` vs `react-native-windows 0.82.x` `ReactCommon` mismatch is gone. The current aligned framework set is:

- `react-native 0.85.3`
- `react-native-windows 0.85.0-preview.1`
- React `19.2.3`

The packaged 0.82 app started and reached JS. The 0.85 Debug x64 app now builds, packages, deploys, starts, and reaches the main UI with VS 2026/v145.

The current JS-side issue that showed up after startup was a Metro resolver recursion:

- `metro.config.js` overrides `resolver.resolveRequest` for Windows package shims
- the fallback path originally called Metro's `resolve(...)` with the unchanged `context`
- Metro then immediately called `context.resolveRequest` again, creating an infinite recursion and `Maximum call stack size exceeded`

The fix is to call the default Metro resolver with `resolveRequest: null` in the fallback context.

### TouchableWithoutFeedback child refs

React Native Windows' `TouchableWithoutFeedback.windows.js` forwards its own
ref by cloning the child with `{...elementProps, ref}`. When no ref is supplied
to the touchable, React receives `ref: null` and replaces any ref already set on
the child. Core React Native clones the child without supplying a replacement
ref, so this is a Windows behavior difference that is still present on RNW
`main` and `0.85-stable`.

This caused the `react-native-animatable` ref in
`src/components/BlixtWallet.tsx` to remain null, making the logo animation
handler return before calling `rubberBand`. Blixt now uses `Pressable`, which
wraps the animated image and preserves its ref.

The animation remains disabled on Windows because RNW Fabric does not reliably
apply JS-driven scale transforms around the center of the view. The native
Animated path centers the transform but is still visually unstable for this
multi-keyframe animation.

The upstream RNW fix should merge the child's existing ref and the touchable's
forwarded ref with `useMergeRefs`, with a regression test covering both refs:

- https://github.com/microsoft/react-native-windows/blob/main/vnext/src-win/Libraries/Components/Touchable/TouchableWithoutFeedback.windows.js
- https://github.com/microsoft/react-native-windows/blob/0.85-stable/vnext/src-win/Libraries/Components/Touchable/TouchableWithoutFeedback.windows.js

## Known Release Blockers and Deferrals

The current Windows target is suitable for bring-up and UI work, not for a funded production wallet. These items are intentionally deferred:

- **Only x64 is supported.** The generated solution still advertises x86 and ARM64 configurations, but `ReactNativeTurboLnd` and the fetched `liblnd.dll` support only x64. The current host defaults to x64; an ARM64 host must explicitly request `--arch x64` until the solution/package metadata is restricted or matching LND artifacts are provided.

- **QR rendering is non-functional.** The current `react-native-svg` shim renders container views but not SVG geometry, so `react-native-qrcode-svg` produces blank QR codes. Receiving flows must not rely on a displayed QR until either native SVG support is restored or the QR component gets a real Windows renderer.

- **The SQLite path is process-relative.** The Windows branch in `src/storage/database/sqlite.ts` opens `blixt/LocalDatabase/Blixt`, which resolves relative to the app's working directory because the RNFS shim supplies `DocumentDirectoryPath = "blixt"`. This is not a stable or appropriate packaged-app data location. Before release, the path must come from a Windows app-local directory, for example `ApplicationData.Current.LocalFolder` exposed through `NativeBlixtTools` or TurboSqlite.

- **Sensitive storage is plaintext.** `src/storage/keystore.windows.ts` stores the seed, PIN, and wallet password in AsyncStorage. This is only a temporary API-compatible shim. It must be replaced with a Windows protected-storage implementation such as DPAPI or PasswordVault before real funds are supported.

- **Secure randomness is not guaranteed.** `src/turbomodules/NativeBlixtTools.windows.ts` uses `crypto.getRandomValues` when present but falls back to `Math.random()`. That fallback can feed wallet-password generation and is not cryptographically secure. A native CSPRNG, or a hard failure when a verified CSPRNG is unavailable, is required before release.

- **Windows JavaScript tests are not configured.** The repo has no top-level Jest runner, and the earlier nonfunctional `test:windows` command and config were removed. React Native 0.85 now satisfies `@rnx-kit/jest-preset`'s React Native preset requirement, but a working runner and Windows-specific configuration still need to be added and validated.

Manual 24-word recovery-phrase restore is enabled on Windows. Channel-backup files and `channel.db` import remain hidden because those paths still require the deferred document picker and filesystem work.

### react-native-turbo-lnd runtime copy path

Current `react-native-turbo-lnd` supports fetching the Windows `liblnd.dll` artifact through its package helper:

- `node_modules/react-native-turbo-lnd/fetch-lnd.js --targets=windows`

This repo's `postinstall` wrapper now asks for the Windows target when running on Windows:

- Windows: `ios,android,windows`
- other platforms: `ios,android`

`Directory.Build.props` sets `LndDllPath` for the `ReactNativeTurboLnd` project to `node_modules/react-native-turbo-lnd/windows/liblnd.dll` when that fetched artifact exists. TurboLnd `0.0.19` otherwise prefers a `liblnd.dll` found beside or above the solution, which made local builds accidentally consume an ignored root-level copy. The package-owned path was verified in MSBuild and in a full solution build on 2026-07-14.

Root-level `liblnd.dll` / `liblnd.h` files may exist as local bring-up artifacts, but they are not ignored and must not be staged. The intended source of the Windows DLL is the TurboLnd package helper, not checked-in root binaries.

## Windows-Specific Shims

These Windows-specific files are currently intentional:

- `src/storage/keystore.windows.ts`
- `src/state/ICloudBackup.windows.ts`
- `src/state/NotificationManager.windows.ts`
- `src/state/Security.windows.ts`
- `src/turbomodules/NativeBlixtTools.windows.ts`
- `src/turbomodules/NativeLndmobileTools.windows.ts`
- `src/turbomodules/NativeScheduledSyncTurbo.windows.ts`
- `src/turbomodules/NativeSpeedloader.windows.ts`
- `src/shims/clipboard.windows.ts`
- `src/shims/react-native-permissions.windows.ts`
- `src/shims/react-native-svg.windows.tsx`
- `src/shims/react-native-svg-css.windows.tsx`
- `src/shims/slider.windows.tsx`
- `src/shims/webview.windows.tsx`
- `src/shims/react-native-fs.windows.ts`
- `src/shims/gesture-handler.windows.ts`
- `src/shims/react-native-documents-picker.windows.ts`
- `src/shims/react-native-keyboard-controller.windows.tsx`
- `src/shims/react-native-vector-icons-create-icon-set.windows.js`
- `src/shims/react-native-vision-camera.windows.tsx`
- `src/shims/geolocation.windows.ts`
- `src/shims/react-native-maps.windows.tsx`
- `src/shims/react-native-nitro-tor.windows.ts`
- `src/utils/push-notification.windows.ts`

Windows stack transitions also use the helpers in `src/hooks/useStackNavigationOptions.ts` to replace `forHorizontalIOS` with `forNoAnimation` on Windows for now, because iOS-style horizontal card pushes were updating navigation state without correctly presenting the pushed card.

The rule is:

- keep shared files shared when possible
- only keep `.windows` files when the shared module would eagerly import unsupported native code or when a platform-specific fallback is materially simpler

`NativeSpeedloader.windows.ts` is required even while Speedloader is disabled
for Windows. `src/state/index.ts` imports the module eagerly, and the shared
`NativeSpeedloader.ts` calls
`TurboModuleRegistry.getEnforcing<Spec>("NativeSpeedloader")` during module
evaluation. Windows has no registered implementation, so removing the platform
adapter would crash startup. The adapter also makes a configured startup gossip
sync a no-op on Windows. It can be removed only after Windows gains a native
implementation or all shared imports are made lazy.

## Windows MVP Feature Cuts

Currently expected to stay disabled or degraded on Windows:

- Tor
- speedloader
- scheduled sync background worker
- notifications
- biometrics
- camera QR scanning; the scan/Send controls are hidden
- embedded WebLN browser; its menu item is hidden
- maps and geolocation map UI
- document-picker channel-backup and `channel.db` restore/import flows; manual seed restore is enabled
- iCloud backup
- Google Drive backup
- channel.db import/export native flows until `NativeBlixtTools` grows the needed support

## Notes

- `react-native-windows init-windows` succeeded. Its `postInstall()` only failed on dependency refresh.
- The RNW template tries `yarn` when `yarn.lock` exists, otherwise `npm i`.
- This repo currently has no `yarn.lock`, so the template fell back to `npm i`.
