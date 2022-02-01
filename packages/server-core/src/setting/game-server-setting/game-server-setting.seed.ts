export const gameServerSeed = {
  path: 'game-server-setting',
  templates: [
    {
      clientHost: process.env.APP_HOST,
      rtc_start_port: parseInt(process.env.RTC_START_PORT!),
      rtc_end_port: parseInt(process.env.RTC_END_PORT!),
      rtc_port_block_size: parseInt(process.env.RTC_PORT_BLOCK_SIZE!),
      identifierDigits: 5,
      local: process.env.LOCAL === 'true',
      domain: process.env.GAMESERVER_DOMAIN || 'gameserver.theoverlay.io',
      releaseName: process.env.RELEASE_NAME || null,
      port: process.env.GAMESERVER_PORT || '3031',
      mode: process.env.GAMESERVER_MODE || 'dev',
      locationName: process.env.PRELOAD_LOCATION_NAME || null
    }
  ]
}
