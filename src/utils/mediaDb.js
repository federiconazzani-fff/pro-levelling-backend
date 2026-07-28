const DB_NAME = 'EliteProMediaDB';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

/**
 * Initializes the IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

/**
 * Saves a file (Blob/File) to IndexedDB
 * @param {string} id - Unique identifier
 * @param {Blob|File} file - The video file
 */
export const saveVideo = async (id, file) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, id);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Retrieves a file from IndexedDB
 * @param {string} id - The identifier
 * @returns {Promise<Blob|null>}
 */
export const getVideo = async (id) => {
  if (!id) return null;
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Deletes a video from IndexedDB
 */
export const deleteVideo = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
/**
 * Retrieves a file from IndexedDB and creates a temporary URL
 * @param {string} id - The identifier
 * @returns {Promise<string|null>}
 */
export const getPersistentVideoUrl = async (id) => {
  const blob = await getVideo(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
};
