const DB_NAME = "unhinged-db";
const DB_VERSION = 2;

// Store names
const UPLOADED_IMAGES_STORE = "uploadedImages";
const GENERATED_PHOTOS_STORE = "generatedPhotos";

export interface StoredUploadedImage {
  id: string;
  blob: Blob;
  name: string;
  type: string;
  createdAt: number;
}

export interface StoredGeneratedPhoto {
  id: string;
  slot: number;
  url: string;
  mediaType: string;
  createdAt: number;
}

// Convert base64 to Blob
export function base64ToBlob(base64: string, mediaType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mediaType });
}

// Convert base64 to blob URL for display
export function base64ToBlobUrl(base64: string, mediaType: string): string {
  const blob = base64ToBlob(base64, mediaType);
  return URL.createObjectURL(blob);
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create store for uploaded source images
      if (!db.objectStoreNames.contains(UPLOADED_IMAGES_STORE)) {
        db.createObjectStore(UPLOADED_IMAGES_STORE, { keyPath: "id" });
      }

      // Create store for generated photos
      if (!db.objectStoreNames.contains(GENERATED_PHOTOS_STORE)) {
        const store = db.createObjectStore(GENERATED_PHOTOS_STORE, { keyPath: "id" });
        store.createIndex("slot", "slot", { unique: true });
      }
    };
  });
}

// Uploaded Images functions
export async function saveUploadedImage(file: File): Promise<StoredUploadedImage> {
  const db = await openDB();
  const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const storedImage: StoredUploadedImage = {
    id,
    blob: file,
    name: file.name,
    type: file.type,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADED_IMAGES_STORE, "readwrite");
    const store = transaction.objectStore(UPLOADED_IMAGES_STORE);
    const request = store.add(storedImage);

    request.onsuccess = () => resolve(storedImage);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllUploadedImages(): Promise<StoredUploadedImage[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADED_IMAGES_STORE, "readonly");
    const store = transaction.objectStore(UPLOADED_IMAGES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteUploadedImage(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADED_IMAGES_STORE, "readwrite");
    const store = transaction.objectStore(UPLOADED_IMAGES_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearUploadedImages(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(UPLOADED_IMAGES_STORE, "readwrite");
    const store = transaction.objectStore(UPLOADED_IMAGES_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Generated Photos functions
export async function saveGeneratedPhoto(photo: Omit<StoredGeneratedPhoto, "id" | "createdAt">): Promise<StoredGeneratedPhoto> {
  const db = await openDB();
  const id = `generated-${Date.now()}-${photo.slot}`;

  const storedPhoto: StoredGeneratedPhoto = {
    ...photo,
    id,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GENERATED_PHOTOS_STORE, "readwrite");
    const store = transaction.objectStore(GENERATED_PHOTOS_STORE);
    
    // First, delete any existing photo in this slot
    const index = store.index("slot");
    const getRequest = index.getKey(photo.slot);
    
    getRequest.onsuccess = () => {
      if (getRequest.result) {
        store.delete(getRequest.result);
      }
      const addRequest = store.add(storedPhoto);
      addRequest.onsuccess = () => resolve(storedPhoto);
      addRequest.onerror = () => reject(addRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function saveGeneratedPhotos(photos: Omit<StoredGeneratedPhoto, "id" | "createdAt">[]): Promise<StoredGeneratedPhoto[]> {
  const results: StoredGeneratedPhoto[] = [];
  for (const photo of photos) {
    const saved = await saveGeneratedPhoto(photo);
    results.push(saved);
  }
  return results;
}

export async function getAllGeneratedPhotos(): Promise<StoredGeneratedPhoto[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GENERATED_PHOTOS_STORE, "readonly");
    const store = transaction.objectStore(GENERATED_PHOTOS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteGeneratedPhoto(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GENERATED_PHOTOS_STORE, "readwrite");
    const store = transaction.objectStore(GENERATED_PHOTOS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteGeneratedPhotoBySlot(slot: number): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GENERATED_PHOTOS_STORE, "readwrite");
    const store = transaction.objectStore(GENERATED_PHOTOS_STORE);
    const index = store.index("slot");
    const getRequest = index.getKey(slot);

    getRequest.onsuccess = () => {
      if (getRequest.result) {
        const deleteRequest = store.delete(getRequest.result);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function clearGeneratedPhotos(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GENERATED_PHOTOS_STORE, "readwrite");
    const store = transaction.objectStore(GENERATED_PHOTOS_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function swapGeneratedPhotoSlots(slotA: number, slotB: number): Promise<void> {
  const db = await openDB();
  const allPhotos = await getAllGeneratedPhotos();
  
  const photoA = allPhotos.find((p) => p.slot === slotA);
  const photoB = allPhotos.find((p) => p.slot === slotB);

  // If neither slot has a photo, nothing to do
  if (!photoA && !photoB) return;

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GENERATED_PHOTOS_STORE, "readwrite");
    const store = transaction.objectStore(GENERATED_PHOTOS_STORE);

    // Delete both photos first (if they exist)
    const deletePromises: Promise<void>[] = [];
    
    if (photoA) {
      deletePromises.push(new Promise<void>((res, rej) => {
        const req = store.delete(photoA.id);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      }));
    }
    
    if (photoB) {
      deletePromises.push(new Promise<void>((res, rej) => {
        const req = store.delete(photoB.id);
        req.onsuccess = () => res();
        req.onerror = () => rej(req.error);
      }));
    }

    transaction.oncomplete = async () => {
      try {
        // Re-add with swapped slots
        if (photoA) {
          await saveGeneratedPhoto({ slot: slotB, url: photoA.url, mediaType: photoA.mediaType });
        }
        if (photoB) {
          await saveGeneratedPhoto({ slot: slotA, url: photoB.url, mediaType: photoB.mediaType });
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    transaction.onerror = () => reject(transaction.error);
  });
}

// Helper to create object URL from stored blob
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
