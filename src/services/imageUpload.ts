import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import { useAuthStore } from '../stores/useAuthStore';

async function uploadImage(localUri: string, storagePath: string): Promise<string> {
  const uid = useAuthStore.getState().user?.uid;
  if (!uid) throw new Error('User not authenticated');

  const fullPath = `users/${uid}/${storagePath}`;
  const storageRef = ref(storage, fullPath);

  const response = await fetch(localUri);
  const blob = await response.blob();

  console.log('[ImageUpload] Uploading to:', fullPath);
  await uploadBytes(storageRef, blob);

  const downloadUrl = await getDownloadURL(storageRef);
  console.log('[ImageUpload] Upload complete');

  return downloadUrl;
}

export async function uploadExercisePhoto(
  localUri: string,
  exerciseId: string
): Promise<string> {
  return uploadImage(localUri, `exercises/${exerciseId}.jpg`);
}

export async function uploadMealPhoto(
  localUri: string,
  photoId: string
): Promise<string> {
  return uploadImage(localUri, `meals/${photoId}.jpg`);
}
