import Color from "color";
import {
  CardStyleInterpolators,
  StackNavigationOptions,
  StackCardInterpolationProps,
} from "@react-navigation/stack";

import { useStoreState } from "../state/store";
import { blixtTheme } from "../native-base-theme/variables/commonColor";
import { Chain } from "../utils/build";
import { Platform } from "react-native";

const forFade = ({ current, index }: StackCardInterpolationProps) => {
  const opacity = current.progress.interpolate({
    inputRange: [0, index],
    outputRange: [0, 1],
  });

  return {
    cardStyle: {
      opacity,
    },
  };
};

export function withHorizontalTransition(
  options: StackNavigationOptions = {},
): StackNavigationOptions {
  if (Platform.OS === "windows") {
    return {
      ...options,
      animation: "none",
      cardStyleInterpolator: CardStyleInterpolators.forNoAnimation,
    };
  }

  return {
    gestureEnabled: true,
    ...options,
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  };
}

export const horizontalTransition = withHorizontalTransition();

export default function useStackNavigationOptions(): StackNavigationOptions {
  const screenTransitionsEnabled = useStoreState(
    (store) => store.settings.screenTransitionsEnabled,
  );

  return {
    gestureEnabled: false,
    headerShown: false,

    headerMode: "screen",
    cardStyle: {
      backgroundColor: "transparent",
      ...Platform.select<any>({
        // TODO any?
        web: {
          flex: "auto",
          height: "100vh",
        },
      }),
    },
    headerStyle: {
      backgroundColor:
        Chain === "mainnet" ? blixtTheme.primary : Color(blixtTheme.lightGray).darken(0.3).hex(),
      elevation: 0,
      shadowColor: "transparent",
      borderBottomColor: "transparent", // web
    },
    headerTitleStyle: {
      color: blixtTheme.light,
    },
    headerTintColor: blixtTheme.light,
    headerPressColor: blixtTheme.light,
    headerRightContainerStyle: {
      paddingRight: 20,
    },
    headerBackTestID: "header-back",

    animation: screenTransitionsEnabled ? undefined : "none",
    // cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
    cardStyleInterpolator: forFade,
    cardOverlayEnabled: false,
    animationTypeForReplace: "pop", // TURBOTODO(hsjoberg): can cause issues

    detachPreviousScreen: false,
  };
}
