import { Action, action, Thunk, thunk } from "easy-peasy";

import { IStoreModel } from "../state";

import logger from "./../utils/log";
const log = logger("ICloudBackup");

export interface IICloudBackupModel {
  initialize: Thunk<IICloudBackupModel, void, any, IStoreModel>;
  setupChannelUpdateSubscriptions: Thunk<IICloudBackupModel, void, any, IStoreModel>;
  makeBackup: Thunk<IICloudBackupModel, void, any, IStoreModel>;
  getBackup: Thunk<IICloudBackupModel, void, any, IStoreModel, Promise<string>>;

  setChannelUpdateSubscriptionStarted: Action<IICloudBackupModel, boolean>;
  setICloudActive: Action<IICloudBackupModel, boolean>;

  channelUpdateSubscriptionStarted: boolean;
  iCloudActive: boolean;
}

export const iCloudBackup: IICloudBackupModel = {
  initialize: thunk(async () => {
    log.i("iCloud backup is not supported on Windows");
  }),

  setupChannelUpdateSubscriptions: thunk(async (actions) => {
    actions.setChannelUpdateSubscriptionStarted(false);
  }),

  makeBackup: thunk(async () => {
    throw new Error("iCloud backup is not supported on Windows");
  }),

  getBackup: thunk(async () => {
    throw new Error("iCloud backup is not supported on Windows");
  }),

  setChannelUpdateSubscriptionStarted: action((state, payload) => {
    state.channelUpdateSubscriptionStarted = payload;
  }),
  setICloudActive: action((state, payload) => {
    state.iCloudActive = payload;
  }),

  channelUpdateSubscriptionStarted: false,
  iCloudActive: false,
};
