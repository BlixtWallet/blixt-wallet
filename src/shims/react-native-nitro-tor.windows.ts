type StartTorParams = {
  data_dir: string;
  socks_port: number;
  target_port: number;
  timeout_ms: number;
};

export const RnTor = {
  async startTorIfNotRunning(_params: StartTorParams) {
    return {
      is_success: false,
      onion_address: "",
      control: "",
      error_message: "Tor is not available on Windows",
    };
  },
};

export default { RnTor };
