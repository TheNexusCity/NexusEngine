// TODO: Can we format this to be non-nested and not on one line?
export default (mimeType: string): string =>
  mimeType.includes('application/dash+xml')
    ? 'video'
    : mimeType.includes('application/x-mpegURL')
    ? 'video'
    : mimeType.includes('image')
    ? 'image'
    : mimeType.includes('video')
    ? 'video'
    : mimeType.includes('audio')
    ? 'audio'
    : mimeType.includes('text')
    ? 'text'
    : mimeType.includes('model')
    ? 'model'
    : 'application'
