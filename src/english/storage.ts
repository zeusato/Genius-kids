import type { EnglishSession } from "./model";
import { clearAI } from "./ai";
import { clearLibrary } from './library';
const DB = "genius-english-v1";
const STORE = "sessions";
export class SessionConflict extends Error {
  constructor() {
    super(
      "Bài này vừa thay đổi ở tab khác. Hãy tải lại bài trước khi tiếp tục.",
    );
  }
}
function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, {
        keyPath: ["studentId", "id"],
      });
      store.createIndex("owner", "studentId");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Đóng tab Tiếng Anh cũ rồi thử lưu lại."));
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (
    store: IDBObjectStore,
    set: (value: T) => void,
    fail: (error: Error) => void,
  ) => void,
): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    let value: T;
    let error: Error | undefined;
    tx.oncomplete = () => {
      db.close();
      resolve(value);
    };
    tx.onabort = tx.onerror = () => {
      db.close();
      reject(error || tx.error || new Error("Không thể lưu bài."));
    };
    operation(
      tx.objectStore(STORE),
      (v) => {
        value = v;
      },
      (e) => {
        error = e;
        tx.abort();
      },
    );
  });
}
export const getSession = (owner: string, id: string) =>
  transaction<EnglishSession | undefined>("readonly", (store, set) => {
    const r = store.get([owner, id]);
    r.onsuccess = () => set(r.result);
  });
export const listSessions = (owner: string) =>
  transaction<EnglishSession[]>("readonly", (store, set) => {
    const r = store.index("owner").getAll(owner);
    r.onsuccess = () =>
      set(
        r.result.sort((a: EnglishSession, b: EnglishSession) =>
          b.updatedAt.localeCompare(a.updatedAt),
        ),
      );
  });
export function saveSession(
  session: EnglishSession,
  expectedRevision: number | null,
): Promise<EnglishSession> {
  return transaction("readwrite", (store, set, fail) => {
    const r = store.get([session.studentId, session.id]);
    r.onsuccess = () => {
      const old: EnglishSession | undefined = r.result;
      if (
        (expectedRevision === null && old) ||
        (expectedRevision !== null &&
          (!old || old.revision !== expectedRevision)) ||
        (old?.status === "completed" && session.status !== "completed")
      ) {
        fail(new SessionConflict());
        return;
      }
      const next = {
        ...session,
        revision: (old?.revision ?? -1) + 1,
        updatedAt: new Date().toISOString(),
      };
      store.put(next);
      set(next);
    };
  });
}
export async function clearEnglishData(owner: string): Promise<void> {
  await clearLibrary(owner);
  await clearAI(owner);
  return transaction("readwrite", (store, set) => {
    const r = store.index("owner").openCursor(IDBKeyRange.only(owner));
    r.onsuccess = () => {
      const cursor = r.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else set(undefined);
    };
  });
}
