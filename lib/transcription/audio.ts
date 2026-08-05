export const TRANSCRIPTION_UPLOAD_BUCKET = 'transcription-uploads';
export const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024;

export const AUDIO_CONTENT_TYPES = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
} as const;

export type AudioExtension = keyof typeof AUDIO_CONTENT_TYPES;

export function getAudioExtension(fileName: string): AudioExtension | null {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0) return null;

  const extension = fileName.slice(dotIndex).toLowerCase();
  return extension in AUDIO_CONTENT_TYPES ? extension as AudioExtension : null;
}

export function getAudioContentType(extension: AudioExtension): string {
  return AUDIO_CONTENT_TYPES[extension];
}

export function isValidAudioFileSize(fileSize: number): boolean {
  return Number.isInteger(fileSize) && fileSize > 0 && fileSize <= MAX_AUDIO_FILE_SIZE;
}
