import { PastedFile } from '@mattermost/react-native-paste-input';

import { getFirstPastedImage } from '../PastedImageUtils';

const createPastedFile = (overrides: Partial<PastedFile> = {}): PastedFile => ({
  fileName: 'pasted-file',
  fileSize: 1,
  type: '',
  uri: 'content://clipboard/item',
  ...overrides,
});

describe('getFirstPastedImage', () => {
  it.each([
    ['image/png', 'content://clipboard/item'],
    ['IMAGE/JPEG', 'file:///tmp/clipboard-item'],
  ])('accepts MIME type %s for an extensionless URI', (type, uri) => {
    const file = createPastedFile({ type, uri });

    expect(getFirstPastedImage([file])).toBe(file);
  });

  it.each([
    'file:///tmp/photo.PNG',
    'content://clipboard/photo.jpg?token=abc',
    'file:///tmp/photo.JPEG#preview',
    'file:///tmp/photo.gif',
    'file:///tmp/photo.webp?size=large#crop',
    'file:///tmp/photo.heic',
    'file:///tmp/photo.HEIF#asset',
  ])('accepts supported URI extension in %s when MIME is empty', (uri) => {
    const file = createPastedFile({ uri });

    expect(getFirstPastedImage([file])).toBe(file);
  });

  it('accepts a supported URI extension when MIME is absent', () => {
    const fileWithoutMime = {
      fileName: 'photo.png',
      fileSize: 1,
      uri: 'content://clipboard/photo.png',
    } as PastedFile;

    expect(getFirstPastedImage([fileWithoutMime])).toBe(fileWithoutMime);
  });

  it('falls back to a supported URI extension for a generic MIME type', () => {
    const file = createPastedFile({
      type: 'application/octet-stream',
      uri: 'content://clipboard/photo.webp',
    });

    expect(getFirstPastedImage([file])).toBe(file);
  });

  it.each([
    ['text/plain', 'file:///tmp/photo.png'],
    ['application/pdf', 'file:///tmp/photo.jpeg'],
    ['application/octet-stream', 'file:///tmp/photo.bmp'],
    ['', 'file:///tmp/photo.png.backup'],
    ['', 'file:///tmp/photo'],
  ])('ignores MIME %s with unsupported URI %s', (type, uri) => {
    expect(
      getFirstPastedImage([createPastedFile({ type, uri })]),
    ).toBeUndefined();
  });

  it('returns the original first matching object only', () => {
    const nonImage = createPastedFile({
      type: 'text/plain',
      uri: 'file:///tmp/readme.txt',
    });
    const firstImage = createPastedFile({
      type: 'image/png',
      uri: 'content://clipboard/first',
    });
    const secondImage = createPastedFile({
      type: 'image/jpeg',
      uri: 'content://clipboard/second',
    });

    const result = getFirstPastedImage([nonImage, firstImage, secondImage]);

    expect(result).toBe(firstImage);
    expect(result).not.toBe(secondImage);
  });

  it('returns undefined for an empty array', () => {
    expect(getFirstPastedImage([])).toBeUndefined();
  });
});
