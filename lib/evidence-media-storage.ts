const EVIDENCE_MEDIA_DB_NAME = "wstv-evidence-media";
const EVIDENCE_MEDIA_STORE_NAME = "attachments";
const EVIDENCE_MEDIA_DB_VERSION = 1;

type EvidenceMediaBlobRecord = {
  id: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storedAt: string;
};

let openEvidenceMediaDbPromise: Promise<IDBDatabase | null> | null = null;

function openEvidenceMediaDb(): Promise<IDBDatabase | null> {
  if (openEvidenceMediaDbPromise) {
    return openEvidenceMediaDbPromise;
  }

  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return Promise.resolve(null);
  }

  openEvidenceMediaDbPromise = new Promise((resolve) => {
    const request = indexedDB.open(EVIDENCE_MEDIA_DB_NAME, EVIDENCE_MEDIA_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(EVIDENCE_MEDIA_STORE_NAME)) {
        db.createObjectStore(EVIDENCE_MEDIA_STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        openEvidenceMediaDbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return openEvidenceMediaDbPromise;
}

export async function writeEvidenceAttachmentBlob(
  attachmentId: string,
  file: File
): Promise<boolean> {
  const db = await openEvidenceMediaDb();
  if (!db) return false;

  return new Promise((resolve) => {
    const transaction = db.transaction(EVIDENCE_MEDIA_STORE_NAME, "readwrite");
    const store = transaction.objectStore(EVIDENCE_MEDIA_STORE_NAME);
    const record: EvidenceMediaBlobRecord = {
      id: attachmentId,
      blob: file,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storedAt: new Date().toISOString(),
    };

    store.put(record);
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => resolve(false);
    transaction.onabort = () => resolve(false);
  });
}

export async function readEvidenceAttachmentBlob(
  attachmentId: string
): Promise<Blob | undefined> {
  const db = await openEvidenceMediaDb();
  if (!db) return undefined;

  return new Promise((resolve) => {
    const transaction = db.transaction(EVIDENCE_MEDIA_STORE_NAME, "readonly");
    const store = transaction.objectStore(EVIDENCE_MEDIA_STORE_NAME);
    const request = store.get(attachmentId);

    request.onsuccess = () => {
      const record = request.result as EvidenceMediaBlobRecord | undefined;
      resolve(record?.blob instanceof Blob ? record.blob : undefined);
    };

    request.onerror = () => resolve(undefined);
  });
}

export async function deleteEvidenceAttachmentBlob(
  attachmentId: string
): Promise<void> {
  const db = await openEvidenceMediaDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    const transaction = db.transaction(EVIDENCE_MEDIA_STORE_NAME, "readwrite");
    transaction.objectStore(EVIDENCE_MEDIA_STORE_NAME).delete(attachmentId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
    transaction.onabort = () => resolve();
  });
}
