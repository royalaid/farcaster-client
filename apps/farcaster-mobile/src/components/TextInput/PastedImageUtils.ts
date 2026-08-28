import type { PastedFile } from '@mattermost/react-native-paste-input';

const IMAGE_MIME_TYPE = /^image\//i;
const GENERIC_MIME_TYPE = /^application\/octet-stream$/i;
const SUPPORTED_IMAGE_URI = /\.(?:png|jpe?g|gif|webp|heic|heif)(?:[?#]|$)/i;

export const getFirstPastedImage = (
  files: PastedFile[],
): PastedFile | undefined =>
  files.find((file) => {
    const mimeType = file.type?.trim();

    if (mimeType && IMAGE_MIME_TYPE.test(mimeType)) {
      return true;
    }

    if (mimeType && !GENERIC_MIME_TYPE.test(mimeType)) {
      return false;
    }

    return SUPPORTED_IMAGE_URI.test(file.uri);
  });
