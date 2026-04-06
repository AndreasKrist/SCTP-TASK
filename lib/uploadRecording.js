import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadRecording(blob, fullName) {
  const safeName = (fullName || 'user').replace(/[^a-zA-Z0-9]/g, '_');
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
  const fileName = `recordings/${safeName}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, fileName);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}
