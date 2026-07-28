import TurboSqlite, { Database } from "react-native-turbo-sqlite";
import { DocumentDirectoryPath } from "react-native-fs";

import { getInitialSchema } from "./sqlite-migrations";
import { PLATFORM } from "../../utils/constants";

export const setupInitialSchema = async (db: Database) => {
  console.log("Ensuring initial schema");

  for (const sql of getInitialSchema()) {
    await db.executeSql(sql, []);
  }
};

export const openDatabase = async (): Promise<Database> => {
  const path =
    PLATFORM === "android"
      ? DocumentDirectoryPath + " /../databases/"
      : PLATFORM === "windows"
        ? DocumentDirectoryPath + "/LocalDatabase/"
        : DocumentDirectoryPath + "/../Library/LocalDatabase/";

  const db = await TurboSqlite.openDatabase(path + "Blixt");
  await setupInitialSchema(db);
  return db;
};

export const deleteDatabase = async () => {
  console.error("deleteDatabase() not implemented");
};

export const dropTables = async (db: Database) => {
  await db.executeSql(`DROP TABLE tx`, []);
  await db.executeSql(`DROP TABLE tx_hops`, []);
  await db.executeSql(`DROP TABLE channel_event`, []);
  await db.executeSql(`DROP TABLE contact`, []);
};

export const migrateDatabase = async () => {};
