import AsyncStorage from '@react-native-async-storage/async-storage';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
const BACKUP_FILENAME = 'fittracker-backup.json';

const STORE_KEYS = ['profile-storage', 'diary-storage', 'workout-storage'];

interface BackupData {
  version: 1;
  timestamp: string;
  stores: Record<string, unknown>;
}

async function findBackupFile(accessToken: string): Promise<string | null> {
  const response = await fetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'&fields=files(id,name,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Не удалось получить список файлов Google Drive');
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

export async function getBackupInfo(
  accessToken: string
): Promise<{ exists: boolean; modifiedTime?: string }> {
  const response = await fetch(
    `${DRIVE_API}/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'&fields=files(id,modifiedTime)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Не удалось проверить резервную копию');
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return { exists: true, modifiedTime: data.files[0].modifiedTime };
  }
  return { exists: false };
}

export async function backupToGoogleDrive(accessToken: string): Promise<void> {
  const stores: Record<string, unknown> = {};

  for (const key of STORE_KEYS) {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      try {
        stores[key] = JSON.parse(raw);
      } catch {
        // skip corrupted data
      }
    }
  }

  const backupData: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    stores,
  };

  const fileContent = JSON.stringify(backupData);
  const existingFileId = await findBackupFile(accessToken);

  const metadata = {
    name: BACKUP_FILENAME,
    ...(!existingFileId && { parents: ['appDataFolder'] }),
  };

  const boundary = '------fittracker' + Date.now();
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    '\r\n' +
    `--${boundary}--`;

  const url = existingFileId
    ? `${UPLOAD_API}/files/${existingFileId}?uploadType=multipart`
    : `${UPLOAD_API}/files?uploadType=multipart`;

  const method = existingFileId ? 'PATCH' : 'POST';

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Ошибка загрузки: ${response.status} ${error}`);
  }
}

export async function restoreFromGoogleDrive(accessToken: string): Promise<void> {
  const fileId = await findBackupFile(accessToken);
  if (!fileId) {
    throw new Error('Резервная копия не найдена');
  }

  const response = await fetch(
    `${DRIVE_API}/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error('Не удалось скачать резервную копию');
  }

  const backupData: BackupData = await response.json();

  if (!backupData.version || !backupData.stores) {
    throw new Error('Неверный формат резервной копии');
  }

  for (const [key, value] of Object.entries(backupData.stores)) {
    if (STORE_KEYS.includes(key) && value) {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  }
}
