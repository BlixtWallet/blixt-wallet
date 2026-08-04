# Windows Reanimated / Worklets Follow-up

Last verified: 2026-08-03

## Current Conclusion

The current Blixt Windows app runs Reanimated and Worklets through their
JavaScript fallback. This path has been verified in a development build and is
not native animation support. Default React Native Windows Metro resolution
still selects unsupported `*.native` files, so Blixt retains a package-scoped
resolver override until the upstream fix is released.

The installed versions are:

- `react-native`: `0.85.3`
- `react-native-windows`: `0.85.0-preview.1`
- `react-native-reanimated`: `4.3.0`
- `react-native-worklets`: `0.8.1`

Reanimated 4's supported-platform list includes Android, iOS, macOS, tvOS,
visionOS, and Web, but not Windows. Neither Reanimated nor Worklets ships a
Windows native project in the installed packages.

The original audit also tested:

- then-current stable Reanimated `4.5.3` with Worklets `0.11.3`
- upstream `main` at `97f1f7b` (`4.6.0-main` / `0.12.0-main`)

Without the resolver fix, both select native Worklets files on React Native
Windows and embed the native-initialization exception in the bundle.

The Blixt workaround bypasses the default resolution problem:

- `metro.config.js` disables `.native` preference only for internal imports
  originating in Reanimated or Worklets on Windows.
- `react-native-drawer-layout` therefore uses its packaged native drawer while
  Reanimated and Worklets use their generic JavaScript paths.
- The Worklets Babel plugin remains enabled and last in `babel.config.js`
  because the supported Android and Apple targets still require it.

## Regression History

[Reanimated PR #4917](https://github.com/software-mansion/react-native-reanimated/pull/4917),
merged on 2023-08-11, was titled "Add basic JS implementation support for
react-native-windows".

The PR explicitly states that it did not add native support. It enabled the web
implementation for Windows. Before the Reanimated 4 package split,
`IS_WINDOWS` was included in `SHOULD_BE_USE_WEB`, causing Windows to construct
`JSWorklets`. Its code change was in `src/reanimated2/PlatformChecker.ts`:

- add an `isWindows()` platform check
- include Windows in `shouldBeUseWeb()`
- include Windows in `nativeShouldBeMock()`

That change predates Reanimated 4's extraction of Worklets into the separate
`react-native-worklets` package.

[PR #8371](https://github.com/software-mansion/react-native-reanimated/pull/8371)
later moved the Worklets native implementation to `*.native.ts` files. Metro
considers Windows a native platform and resolves those files before the
unsuffixed modules containing the `IS_WINDOWS` runtime check. Windows therefore
loads `NativeWorklets.native.ts`, which expects a native Worklets module that
RNW does not provide.

[PR #9893](https://github.com/software-mansion/react-native-reanimated/pull/9893)
introduced the same generic/native split inside Reanimated. Restoring only the
old `PlatformChecker.ts` condition cannot fix either resolution path because
Metro chooses the module before its runtime checks can execute.

This regression should not be read as evidence that Reanimated previously had
native React Native Windows support. PR #4917 provided only the JavaScript
fallback.

## Failure Without The Workaround

With normal RNW Metro resolution, Windows startup reaches:

```text
[Worklets] Native part of Worklets doesn't seem to be initialized.
```

The observed import chain is:

```text
@react-navigation/drawer
  -> react-native-drawer-layout/lib/module/views/Drawer.native.js
  -> react-native-reanimated
  -> react-native-worklets
  -> WorkletsModule/NativeWorklets.native.js
```

`Drawer.native.js` imports Reanimated at module scope even though the drawer
already disables swipe gestures for Windows.

The installed Worklets package contains generic JavaScript fallback files that
treat Windows like Web, but it also contains matching `*.native.js` files.
React Native Windows Metro resolution selects those native siblings when no
`*.windows.js` file exists. That bypasses the generic Windows-as-Web check and
eventually reaches the native Worklets implementation, for which no Windows
native module is registered.

This diagnosis has now been reproduced with the Blixt RNW 0.85 app using the
packaged drawer. Metro source-map results were:

- Reanimated `4.5.3` / Worklets `0.11.3`: normal RNW resolution selected 23
  package `*.native` modules, including `NativeWorklets.native.ts`.
- Upstream `main`: normal RNW resolution selected 58 package `*.native`
  modules: 36 from Reanimated and 22 from Worklets.
- Both control bundles contain the native-initialization exceptions. Bundle
  generation succeeds because the exceptions occur when the modules execute.

The upstream "Windows hosted app" workflow is not an RNW test. It builds an
Android APK on a `windows-latest` GitHub Actions runner.

## Validated JavaScript Fallback

A package-scoped Metro resolver restores the intended behavior:

- only on platform `windows`
- only for relative imports originating inside `react-native-reanimated` or
  `react-native-worklets`
- keep platform `windows`, retaining `*.windows` precedence
- set `preferNativePlatform: false`, skipping `*.native` siblings and then
  selecting the generic JavaScript implementations

This must not be applied globally because RNW and other dependencies rely on
their native implementations.

The candidate upstream implementation is committed and pushed as
[`19f756c0f7`](https://github.com/hsjoberg/react-native-reanimated/commit/19f756c0f7adb01909e17a25db45ac221d9a066c).
It extends Reanimated's existing `wrapWithReanimatedMetroConfig`, delegates to
either the application's custom resolver or Metro's default resolver, and does
not mutate the original resolver context.

Focused tests cover:

- relative imports originating inside Reanimated and Worklets on Windows
- non-Windows platforms and package imports
- Windows imports originating outside the two packages
- delegation to custom and default Metro resolvers

Bundle validation produced:

- stable fallback bundle: zero Reanimated/Worklets `*.native` modules
- upstream-main fallback bundle: 295 package modules and zero `*.native`
  modules
- native Worklets and Reanimated initialization paths are not executed
- unchanged resolution for Android, bare-package imports, and application-local
  imports

This restores only the JavaScript-driven behavior introduced by PR #4917. It
does not add a Windows UI-thread runtime, native Worklets, or native Reanimated
support.

The same resolver behavior remains directly in Blixt's `metro.config.js`
because installed Reanimated `4.3.0` does not include the candidate upstream
change. A development Windows bundle succeeds with:

- 330 Reanimated/Worklets source modules
- zero Reanimated/Worklets `*.native` modules
- the packaged `react-native-drawer-layout` `Drawer.native.js`
- generic `NativeWorklets.ts`, whose fallback does not construct the native
  Worklets implementation

The app was also built and exercised on RNW with the packaged native drawer.
Startup and navigation work through the JavaScript fallback. No app-level
Reanimated, Worklets, or drawer shim is retained.

Reanimated's generic module statically imports `NativeReanimated.ts`, so its
native-initialization error text remains in this development bundle. It is a
dormant branch on Windows: `SHOULD_BE_USE_WEB` includes Windows and constructs
`JSReanimated` instead.

The tradeoff is that the Metro wrapper is opt-in. Automatic package resolution
would require maintaining explicit Windows variants for the growing set of
generic/native pairs. The wrapper is the smaller and more maintainable
proposal.

## Why The Web Drawer Is Not A Drop-In Fix

The generic `react-native-drawer-layout` implementation is browser-specific. It
uses DOM event listeners, CSS transitions, `calc(...)`, and web transform
strings. Re-exporting that implementation from `Drawer.windows.js` would avoid
Reanimated but would not provide a valid React Native Windows drawer.

The packaged native drawer plus the package-scoped JavaScript fallback is the
current Windows path. No app-level drawer shim is retained.

## Follow-Up Plan

1. Submit the pushed `fix-windows-js` branch upstream with the prepared
   regression explanation and test plan.
2. Add a minimal RNW reproduction or upstream bundle coverage if requested
   during review.
3. Keep the Blixt resolver narrowly scoped until an upstream release contains
   the verified fallback; do not treat it as native Windows support.
4. After upgrading to that release, configure
   `wrapWithReanimatedMetroConfig` and remove Blixt's duplicate resolver block.

A real UI-thread implementation would require a native Windows/C++ Worklets and
Reanimated port. Explicit Windows JavaScript entrypoints would only restore the
older web-style fallback behavior.

## References

- Historical JS fallback:
  https://github.com/software-mansion/react-native-reanimated/pull/4917
- Worklets native file split:
  https://github.com/software-mansion/react-native-reanimated/pull/8371
- Reanimated native file split:
  https://github.com/software-mansion/react-native-reanimated/pull/9893
- Candidate Windows fallback fix:
  https://github.com/hsjoberg/react-native-reanimated/commit/19f756c0f7adb01909e17a25db45ac221d9a066c
- Current supported platforms:
  https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting/#native-part-of-reanimated-doesnt-seem-to-be-initialized
- Version compatibility:
  https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/
