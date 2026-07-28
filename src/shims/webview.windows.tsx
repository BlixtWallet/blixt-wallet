import React, { forwardRef, useImperativeHandle } from "react";

export interface IWebViewHandle {
  goBack: () => void;
  injectJavaScript: (_script: string) => void;
  reload: () => void;
}

export const WebView = forwardRef<IWebViewHandle, any>(function WebViewShim(_props, ref) {
  useImperativeHandle(ref, () => ({
    goBack: () => undefined,
    injectJavaScript: () => undefined,
    reload: () => undefined,
  }));

  return null;
});

export default WebView;
