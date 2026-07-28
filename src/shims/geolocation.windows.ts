import type {
  GeolocationConfiguration,
  GeolocationError,
  GeolocationOptions,
  GeolocationResponse,
} from "@react-native-community/geolocation";

const positionUnavailable = (): GeolocationError => ({
  code: 2,
  message: "Geolocation is not supported on Windows yet",
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
});

const Geolocation = {
  getCurrentPosition(
    _success: (position: GeolocationResponse) => void,
    error?: (error: GeolocationError) => void,
    _options?: GeolocationOptions,
  ) {
    error?.(positionUnavailable());
  },
  watchPosition(
    _success: (position: GeolocationResponse) => void,
    error?: (error: GeolocationError) => void,
    _options?: GeolocationOptions,
  ) {
    error?.(positionUnavailable());
    return -1;
  },
  clearWatch(_watchId: number) {},
  stopObserving() {},
  requestAuthorization(_success?: () => void, error?: (error: GeolocationError) => void) {
    error?.(positionUnavailable());
  },
  setRNConfiguration(_config: GeolocationConfiguration) {},
};

export default Geolocation;
