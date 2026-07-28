# Windows Reanimated / Worklets Follow-up

Last verified: 2026-07-28

## Current Conclusion

The current Windows app does not support Reanimated or Worklets. It avoids loading
them.

The installed versions are:

- `react-native`: `0.85.3`
- `react-native-windows`: `0.85.0-preview.1`
- `react-native-reanimated`: `4.3.0`
- `react-native-worklets`: `0.8.1`

Reanimated 4's supported-platform list includes Android, iOS, macOS, tvOS,
visionOS, and Web, but not Windows. Neither Reanimated nor Worklets ships a
Windows native project in the installed packages.

The local drawer shim is therefore an intentional Windows fallback, not a
substitute for native Reanimated support:

- `metro.config.js` maps `react-native-drawer-layout` to
  `src/shims/react-native-drawer-layout.windows.tsx` on Windows.
- The shim provides a static/no-animation drawer and avoids importing
  Reanimated or Worklets.
- The Worklets Babel plugin remains enabled and last in `babel.config.js`
  because the supported Android and Apple targets still require it.

## Historical Windows PR

[Reanimated PR #4917](https://github.com/software-mansion/react-native-reanimated/pull/4917),
merged on 2023-08-11, was titled "Add basic JS implementation support for
react-native-windows".

The PR explicitly states that it did not add native support. It enabled the web
implementation for Windows. Its entire code change was six additions and two
deletions in `src/reanimated2/PlatformChecker.ts`:

- add an `isWindows()` platform check
- include Windows in `shouldBeUseWeb()`
- include Windows in `nativeShouldBeMock()`

That change predates Reanimated 4's extraction of Worklets into the separate
`react-native-worklets` package. It should not be read as evidence that
Reanimated 4 has native React Native Windows support.

## Current Failure

Without the local drawer shim, Windows startup reaches:

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

This diagnosis was established from the local RNW 0.84 bundle. The current RNW
0.85 preview app still avoids the import chain through the drawer shim, so the
failure needs a minimal upstream reproduction before being reported as a
Worklets bug.

## Why The Web Drawer Is Not A Drop-In Fix

The generic `react-native-drawer-layout` implementation is browser-specific. It
uses DOM event listeners, CSS transitions, `calc(...)`, and web transform
strings. Re-exporting that implementation from `Drawer.windows.js` would avoid
Reanimated but would not provide a valid React Native Windows drawer.

The current app-level drawer shim remains the smallest honest workaround.

## Follow-Up Plan

1. Create a minimal RNW 0.85 app with Reanimated 4 and Worklets, first importing
   Worklets directly and then through `react-native-drawer-layout`.
2. Confirm the exact Metro resolution chain without app aliases.
3. Test explicit `*.windows.js` Worklets/Reanimated entrypoints that re-export
   the JavaScript fallback implementations.
4. Report the package-resolution issue upstream with the reproduction. Treat
   any JavaScript fallback as non-native, matching PR #4917.
5. Keep using core React Native animation or explicit no-animation fallbacks in
   Blixt until upstream officially supports Windows.

A real UI-thread implementation would require a native Windows/C++ Worklets and
Reanimated port. Explicit Windows JavaScript entrypoints would only restore the
older web-style fallback behavior.

## References

- Historical JS fallback:
  https://github.com/software-mansion/react-native-reanimated/pull/4917
- Current supported platforms:
  https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting/#native-part-of-reanimated-doesnt-seem-to-be-initialized
- Version compatibility:
  https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/
