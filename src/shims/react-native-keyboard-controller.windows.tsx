import React, { ReactNode } from "react";
import { KeyboardAvoidingView as RNKeyboardAvoidingView } from "react-native";

interface KeyboardProviderProps {
  children?: ReactNode;
}

export function KeyboardProvider({ children }: KeyboardProviderProps) {
  return <>{children}</>;
}

export const KeyboardAvoidingView = RNKeyboardAvoidingView;
