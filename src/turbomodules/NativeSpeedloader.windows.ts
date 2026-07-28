import type { Spec } from "./NativeSpeedloader";

const NativeSpeedloaderWindows: Spec = {
  gossipSync: async () => "",
  cancelGossipSync() {},
};

export default NativeSpeedloaderWindows;
