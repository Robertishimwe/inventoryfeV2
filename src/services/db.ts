import { openDB } from 'idb';

const dbName = 'inventoryMS';
const dbVersion = 1;

export async function initDB() {
  const db = await openDB(dbName, dbVersion, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
    },
  });
  return db;
}

export async function saveUser(user: any) {
  const db = await initDB();
  await db.put('user', user, 'currentUser');
}

export async function getUser() {
  const db = await initDB();
  return await db.get('user', 'currentUser');
}

export async function clearUser() {
  const db = await initDB();
  await db.delete('user', 'currentUser');
}

export async function saveSettings(settings: any) {
  const db = await initDB();
  await db.put('settings', settings, 'systemSettings');
}

export async function getSettings() {
  const db = await initDB();
  return await db.get('settings', 'systemSettings');
}

export async function clearSettings() {
  const db = await initDB();
  await db.delete('settings', 'systemSettings');
}