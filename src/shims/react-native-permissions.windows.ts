const { PERMISSIONS } = require("react-native-permissions/dist/commonjs/permissions.js");
const { RESULTS } = require("react-native-permissions/dist/commonjs/results.js");
const unsupportedMethods = require("react-native-permissions/dist/commonjs/unsupportedMethods.js");

type Permission = string;
type PermissionStatus = string;

const check = async (_permission: Permission): Promise<PermissionStatus> => RESULTS.UNAVAILABLE;

const request = async (_permission: Permission): Promise<PermissionStatus> => RESULTS.UNAVAILABLE;

const checkMultiple = async (permissions: Permission[]): Promise<Record<string, PermissionStatus>> => {
  return Object.fromEntries(permissions.map((permission) => [permission, RESULTS.UNAVAILABLE]));
};

const requestMultiple = async (
  permissions: Permission[],
): Promise<Record<string, PermissionStatus>> => {
  return Object.fromEntries(permissions.map((permission) => [permission, RESULTS.UNAVAILABLE]));
};

const checkNotifications = async () => ({
  status: RESULTS.UNAVAILABLE,
  settings: {},
});

const requestNotifications = async () => ({
  status: RESULTS.UNAVAILABLE,
  settings: {},
});

const openSettings = async () => {};

export {
  PERMISSIONS,
  RESULTS,
  check,
  request,
  checkMultiple,
  requestMultiple,
  checkNotifications,
  requestNotifications,
  openSettings,
};

export const canScheduleExactAlarms = unsupportedMethods.canScheduleExactAlarms;
export const canUseFullScreenIntent = unsupportedMethods.canUseFullScreenIntent;
export const checkLocationAccuracy = unsupportedMethods.checkLocationAccuracy;
export const requestLocationAccuracy = unsupportedMethods.requestLocationAccuracy;
export const openPhotoPicker = unsupportedMethods.openPhotoPicker;

export default {
  PERMISSIONS,
  RESULTS,
  canScheduleExactAlarms,
  canUseFullScreenIntent,
  check,
  checkLocationAccuracy,
  checkMultiple,
  checkNotifications,
  openPhotoPicker,
  openSettings,
  request,
  requestLocationAccuracy,
  requestMultiple,
  requestNotifications,
};
