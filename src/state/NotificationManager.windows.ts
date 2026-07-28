import { Thunk, thunk } from "easy-peasy";

import { IStoreModel } from "./index";
import { toast } from "../utils";

import logger from "./../utils/log";
const log = logger("NotificationManager");

interface ILocalNotificationPayload {
  message: string;
}

export interface INotificationManagerModel {
  initialize: Thunk<INotificationManagerModel>;
  startPersistentService: Thunk<INotificationManagerModel>;
  stopPersistentService: Thunk<INotificationManagerModel>;
  localNotification: Thunk<INotificationManagerModel, ILocalNotificationPayload, any, IStoreModel>;
}

export const notificationManager: INotificationManagerModel = {
  initialize: thunk(async () => {
    log.i("Notifications are disabled on Windows for now");
  }),

  startPersistentService: thunk(async () => {
    log.i("Persistent notifications are not supported on Windows yet");
  }),

  stopPersistentService: thunk(async () => {
    log.i("stopPersistentService() is a no-op on Windows");
  }),

  localNotification: thunk((_, { message }, { getStoreState }) => {
    if (getStoreState().settings.pushNotificationsEnabled) {
      toast(message);
    }
  }),
};
