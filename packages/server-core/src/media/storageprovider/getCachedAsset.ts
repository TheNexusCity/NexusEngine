export const getCachedAsset = (path: string, cacheDomain: string) => {
  if (!cacheDomain) throw new Error('No cache domain found - please check the storage provider configuration')
  return new URL(path ?? '', 'https://' + cacheDomain).href
}
