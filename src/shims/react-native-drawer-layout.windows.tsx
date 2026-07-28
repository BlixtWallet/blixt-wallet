import * as React from "react";
import {
  I18nManager,
  Keyboard,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

type DrawerPosition = "left" | "right";
type DrawerType = "front" | "back" | "slide" | "permanent";
type Layout = { width: number; height: number };

type SharedValueLike = {
  _isReanimatedSharedValue: true;
  addListener(id: number, listener: (value: number) => void): void;
  removeListener(id: number): void;
  modify(modifier?: (value: number) => number): void;
  get(): number;
  set(value: number): void;
  value: number;
};

type DrawerProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onGestureStart?: () => void;
  onGestureCancel?: () => void;
  onGestureEnd?: () => void;
  onTransitionStart?: (closing: boolean) => void;
  onTransitionEnd?: (closing: boolean) => void;
  renderDrawerContent: () => React.ReactNode;
  layout?: Layout;
  direction?: "ltr" | "rtl";
  drawerPosition?: DrawerPosition;
  drawerType?: DrawerType;
  drawerStyle?: StyleProp<ViewStyle>;
  overlayStyle?: StyleProp<ViewStyle>;
  overlayAccessibilityLabel?: string;
  keyboardDismissMode?: "none" | "on-drag";
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

const APPROX_APP_BAR_HEIGHT = 56;
const DEFAULT_DRAWER_WIDTH = 360;

class FakeSharedValue implements SharedValueLike {
  _listeners = new Map<number, (value: number) => void>();
  _value: number;
  _isReanimatedSharedValue = true as const;

  constructor(value: number) {
    this._value = value;
  }

  addListener(id: number, listener: (value: number) => void) {
    this._listeners.set(id, listener);
  }

  removeListener(id: number) {
    this._listeners.delete(id);
  }

  modify(modifier?: (value: number) => number) {
    this.value = modifier ? modifier(this.value) : this.value;
  }

  get() {
    return this.value;
  }

  set(value: number) {
    this.value = value;
  }

  set value(value: number) {
    this._value = value;
    for (const listener of this._listeners.values()) {
      listener(value);
    }
  }

  get value() {
    return this._value;
  }
}

function useFakeSharedValue(value: number): SharedValueLike {
  const sharedValue = React.useRef<SharedValueLike | null>(null);

  if (sharedValue.current === null) {
    sharedValue.current = new FakeSharedValue(value);
  }

  return sharedValue.current;
}

export const DrawerGestureContext = React.createContext<unknown>(undefined);
export const DrawerProgressContext = React.createContext<SharedValueLike | undefined>(undefined);

export function useDrawerProgress() {
  const progress = React.useContext(DrawerProgressContext);

  if (progress === undefined) {
    throw new Error("Couldn't find a drawer. Is your component inside a drawer?");
  }

  return progress;
}

function getDrawerWidth({
  layout,
  drawerStyle,
}: {
  layout: Layout;
  drawerStyle?: StyleProp<ViewStyle>;
}) {
  const defaultWidth =
    layout.width - APPROX_APP_BAR_HEIGHT <= DEFAULT_DRAWER_WIDTH
      ? layout.width - APPROX_APP_BAR_HEIGHT
      : DEFAULT_DRAWER_WIDTH;

  const { width = defaultWidth } = StyleSheet.flatten(drawerStyle) || {};

  if (typeof width === "string" && width.endsWith("%")) {
    const percentage = Number(width.replace(/%$/, ""));

    if (Number.isFinite(percentage)) {
      return layout.width * (percentage / 100);
    }
  }

  return typeof width === "number" ? width : defaultWidth;
}

export function Drawer({
  direction = I18nManager.isRTL ? "rtl" : "ltr",
  drawerPosition = direction === "rtl" ? "right" : "left",
  drawerStyle,
  drawerType = "front",
  onClose,
  onTransitionStart,
  onTransitionEnd,
  open,
  overlayStyle,
  overlayAccessibilityLabel = "Close drawer",
  keyboardDismissMode = "on-drag",
  renderDrawerContent,
  children,
  style,
  layout = { width: DEFAULT_DRAWER_WIDTH + APPROX_APP_BAR_HEIGHT, height: 0 },
}: DrawerProps) {
  const progress = useFakeSharedValue(open ? 1 : 0);
  const previousOpen = React.useRef(open);
  const resolvedDrawerType = drawerType === "permanent" ? "permanent" : "front";
  const drawerWidth = getDrawerWidth({ layout, drawerStyle });
  const isRight = drawerPosition === "right";

  React.useEffect(() => {
    progress.value = open ? 1 : 0;

    if (previousOpen.current !== open) {
      const closing = !open;
      onTransitionStart?.(closing);
      onTransitionEnd?.(closing);
      previousOpen.current = open;
    }
  }, [onTransitionEnd, onTransitionStart, open, progress]);

  const handleOverlayPress = React.useCallback(() => {
    if (keyboardDismissMode === "on-drag") {
      Keyboard.dismiss();
    }

    onClose();
  }, [keyboardDismissMode, onClose]);

  const drawerElement = (
    <View
      style={[
        styles.drawer,
        {
          width: drawerWidth,
        },
        drawerStyle,
      ]}
    >
      {renderDrawerContent()}
    </View>
  );

  if (resolvedDrawerType === "permanent") {
    return (
      <DrawerProgressContext.Provider value={progress}>
        <View style={[styles.container, style]}>
          {!isRight && drawerElement}
          <View style={styles.content}>{children}</View>
          {isRight && drawerElement}
        </View>
      </DrawerProgressContext.Provider>
    );
  }

  return (
    <DrawerProgressContext.Provider value={progress}>
      <View style={[styles.container, style]}>
        <View style={styles.content}>{children}</View>
        {open ? (
          <>
            <Pressable
              accessibilityLabel={overlayAccessibilityLabel}
              onPress={handleOverlayPress}
              style={[styles.overlay, overlayStyle]}
            />
            <View
              style={[
                styles.absoluteDrawer,
                isRight ? { right: 0 } : { left: 0 },
                {
                  width: drawerWidth,
                },
              ]}
            >
              {drawerElement}
            </View>
          </>
        ) : null}
      </View>
    </DrawerProgressContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  content: {
    flex: 1,
  },
  drawer: {
    maxWidth: "100%",
    backgroundColor: "white",
  },
  absoluteDrawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
