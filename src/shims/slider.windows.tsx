import React, { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

type SliderNativeProps = {
  value?: number;
};

type SliderHandle = {
  setNativeProps: (props: SliderNativeProps) => void;
  updateValue: (value: number) => void;
};

type SliderProps = {
  style?: StyleProp<ViewStyle>;
  value?: number;
  minimumValue?: number;
  maximumValue?: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  onValueChange?: (value: number) => void;
};

const Slider = forwardRef<SliderHandle, SliderProps>(function Slider(
  {
    style,
    value = 0,
    minimumValue = 0,
    maximumValue = 1,
    minimumTrackTintColor = "#999999",
    maximumTrackTintColor = "#555555",
  },
  ref,
) {
  const [currentValue, setCurrentValue] = useState(value);
  const clampedMax = Math.max(maximumValue, minimumValue + 1);
  const progress = useMemo(() => {
    const clamped = Math.min(Math.max(currentValue, minimumValue), clampedMax);
    return ((clamped - minimumValue) / (clampedMax - minimumValue)) * 100;
  }, [clampedMax, currentValue, minimumValue]);

  useImperativeHandle(ref, () => ({
    setNativeProps: (props) => {
      if (typeof props.value === "number") {
        setCurrentValue(props.value);
      }
    },
    updateValue: (nextValue) => {
      setCurrentValue(nextValue);
    },
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]}>
        <View
          style={[
            styles.fill,
            {
              backgroundColor: minimumTrackTintColor,
              width: `${progress}%`,
            },
          ]}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
  track: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: "100%",
  },
});

export default Slider;
