import dotenv from 'dotenv'
import { DataTypes, Sequelize } from 'sequelize'

import appConfig from './appconfig'

dotenv.config()
const db = {
  username: process.env.MYSQL_USER ?? 'server',
  password: process.env.MYSQL_PASSWORD ?? 'password',
  database: process.env.MYSQL_DATABASE ?? 'xrengine',
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: process.env.MYSQL_PORT ?? 3306,
  dialect: 'mysql',
  url: ''
}
const nonFeathersStrategies = ['emailMagicLink', 'smsMagicLink']

db.url = process.env.MYSQL_URL ?? `mysql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}`

//TODO: Environment variables that can be refreshed at runtime
export const refreshAppConfig = async (): Promise<void> => {
  const sequelizeClient = new Sequelize({
    ...(db as any),
    define: {
      freezeTableName: true
    },
    logging: false
  }) as any
  await sequelizeClient.sync()

  const promises: any[] = []

  const serverSetting = sequelizeClient.define('serverSetting', {
    gaTrackingId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gitPem: {
      type: DataTypes.STRING(2048),
      allowNull: true
    }
  })

  const serverSettingPromise = serverSetting
    .findAll()
    .then(([dbServer]) => {
      const dbServerConfig = dbServer && {
        gaTrackingId: dbServer.gaTrackingId,
        gitPem: dbServer.gitPem
      }
      appConfig.server = {
        ...appConfig.server,
        ...dbServerConfig
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read serverSetting')
      console.warn(e)
    })
  promises.push(serverSettingPromise)
  await Promise.all(promises)
}

export const updateAppConfig = async (): Promise<void> => {
  if (appConfig.db.forceRefresh || process.env.APP_ENV === 'development' || process.env.VITE_LOCAL_BUILD) return
  const sequelizeClient = new Sequelize({
    ...(db as any),
    define: {
      freezeTableName: true
    },
    logging: false
  }) as any
  await sequelizeClient.sync()

  const promises: any[] = []

  const analyticsSetting = sequelizeClient.define('analyticsSetting', {
    port: {
      type: DataTypes.STRING,
      allowNull: true
    },
    processInterval: {
      type: DataTypes.STRING,
      allowNull: true
    }
  })
  const analyticsSettingPromise = analyticsSetting
    .findAll()
    .then(([dbAnalytics]) => {
      const dbAnalyticsConfig = dbAnalytics && {
        port: dbAnalytics.port,
        processInterval: dbAnalytics.processInterval
      }
      if (dbAnalyticsConfig) {
        appConfig.analytics = {
          ...appConfig.analytics,
          ...dbAnalyticsConfig
        }
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read analyticsSetting')
      console.warn(e)
    })
  promises.push(analyticsSettingPromise)

  const authenticationSetting = sequelizeClient.define('authentication', {
    service: {
      type: DataTypes.STRING,
      allowNull: true
    },
    entity: {
      type: DataTypes.STRING,
      allowNull: true
    },
    secret: {
      type: DataTypes.STRING,
      allowNull: true
    },
    authStrategies: {
      type: DataTypes.JSON,
      allowNull: true
    },
    local: {
      type: DataTypes.JSON,
      allowNull: true
    },
    jwtOptions: {
      type: DataTypes.JSON,
      allowNull: true
    },
    bearerToken: {
      type: DataTypes.JSON,
      allowNull: true
    },
    callback: {
      type: DataTypes.JSON,
      allowNull: true
    },
    oauth: {
      type: DataTypes.JSON,
      allowNull: true
    }
  })
  const authenticationSettingPromise = authenticationSetting
    .findAll()
    .then(([dbAuthentication]) => {
      const oauth = JSON.parse(JSON.parse(dbAuthentication.oauth))
      const dbAuthenticationConfig = dbAuthentication && {
        service: dbAuthentication.service,
        entity: dbAuthentication.entity,
        secret: dbAuthentication.secret,
        authStrategies: JSON.parse(JSON.parse(dbAuthentication.authStrategies)),
        local: JSON.parse(JSON.parse(dbAuthentication.local)),
        jwtOptions: JSON.parse(JSON.parse(dbAuthentication.jwtOptions)),
        bearerToken: JSON.parse(JSON.parse(dbAuthentication.bearerToken)),
        callback: JSON.parse(JSON.parse(dbAuthentication.callback)),
        oauth: {
          ...JSON.parse(JSON.parse(dbAuthentication.oauth))
        }
      }
      if (dbAuthenticationConfig) {
        if (oauth.defaults) dbAuthenticationConfig.oauth.defaults = JSON.parse(oauth.defaults)
        if (oauth.discord) dbAuthenticationConfig.oauth.discord = JSON.parse(oauth.discord)
        if (oauth.facebook) dbAuthenticationConfig.oauth.facebook = JSON.parse(oauth.facebook)
        if (oauth.github) dbAuthenticationConfig.oauth.github = JSON.parse(oauth.github)
        if (oauth.google) dbAuthenticationConfig.oauth.google = JSON.parse(oauth.google)
        if (oauth.linkedin) dbAuthenticationConfig.oauth.linkedin = JSON.parse(oauth.linkedin)
        if (oauth.twitter) dbAuthenticationConfig.oauth.twitter = JSON.parse(oauth.twitter)
        const authStrategies = ['jwt', 'local']
        for (let authStrategy of dbAuthenticationConfig.authStrategies) {
          const keys = Object.keys(authStrategy)
          for (let key of keys)
            if (nonFeathersStrategies.indexOf(key) < 0 && authStrategies.indexOf(key) < 0) authStrategies.push(key)
        }
        dbAuthenticationConfig.authStrategies = authStrategies
        appConfig.authentication = {
          ...appConfig.authentication,
          ...dbAuthenticationConfig
        }
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read authenticationSetting')
      console.warn(e)
    })
  promises.push(authenticationSettingPromise)

  const awsSetting = sequelizeClient.define('Aws', {
    keys: {
      type: DataTypes.JSON,
      allowNull: true
    },
    route53: {
      type: DataTypes.JSON,
      allowNull: true
    },
    s3: {
      type: DataTypes.JSON,
      allowNull: true
    },
    cloudfront: {
      type: DataTypes.JSON,
      allowNull: true
    },
    sms: {
      type: DataTypes.JSON,
      allowNull: true
    }
  })
  const promisePromise = awsSetting
    .findAll()
    .then(([dbAws]) => {
      const dbAwsConfig = dbAws && {
        keys: JSON.parse(JSON.parse(dbAws.keys)),
        route53: {
          ...JSON.parse(JSON.parse(dbAws.route53)),
          keys: JSON.parse(JSON.parse(JSON.parse(dbAws.route53)).keys)
        },
        s3: JSON.parse(JSON.parse(dbAws.s3)),
        cloudfront: JSON.parse(JSON.parse(dbAws.cloudfront)),
        sms: JSON.parse(JSON.parse(dbAws.sms))
      }
      if (dbAwsConfig) {
        appConfig.aws = {
          ...appConfig.aws,
          ...dbAwsConfig
        }
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read awsSetting')
      console.warn(e)
    })
  promises.push(promisePromise)

  const chargebeeSetting = sequelizeClient.define('chargebeeSetting', {
    url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    apiKey: {
      type: DataTypes.STRING,
      allowNull: true
    }
  })
  const chargebeeSettingPromise = chargebeeSetting
    .findAll()
    .then(([dbChargebee]) => {
      const dbChargebeeConfig = dbChargebee && {
        url: dbChargebee.url,
        apiKey: dbChargebee.apiKey
      }
      if (dbChargebeeConfig) {
        appConfig.chargebee = {
          ...appConfig.chargebee,
          ...dbChargebeeConfig
        }
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read chargebeeSetting')
      console.warn(e)
    })
  promises.push(chargebeeSettingPromise)

  const clientSetting = sequelizeClient.define('clientSetting', {
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    releaseName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    siteDescription: {
      type: DataTypes.STRING,
      allowNull: true
    },
    favicon32px: {
      type: DataTypes.STRING,
      allowNull: true
    },
    favicon16px: {
      type: DataTypes.STRING,
      allowNull: true
    },
    icon192px: {
      type: DataTypes.STRING,
      allowNull: true
    },
    icon512px: {
      type: DataTypes.STRING,
      allowNull: true
    }
  })
  const clientSettingPromise = clientSetting
    .findAll()
    .then(([dbClient]) => {
      const dbClientConfig = dbClient && {
        logo: dbClient.logo,
        title: dbClient.title,
        url: dbClient.url,
        releaseName: dbClient.releaseName,
        siteDescription: dbClient.siteDescription,
        favicon32px: dbClient.favicon32px,
        favicon16px: dbClient.favicon16px,
        icon192px: dbClient.icon192px,
        icon512px: dbClient.icon512px
      }
      if (dbClientConfig) {
        appConfig.client = {
          ...appConfig.client,
          ...dbClientConfig
        }
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read clientSetting')
      console.warn(e)
    })
  promises.push(clientSettingPromise)

  const emailSetting = sequelizeClient.define('emailSetting', {
    smtp: {
      type: DataTypes.JSON,
      allowNull: true
    },
    from: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subject: {
      type: DataTypes.JSON,
      allowNull: true
    },
    smsNameCharacterLimit: {
      type: DataTypes.INTEGER
    }
  })
  const emailSettingPromise = emailSetting
    .findAll()
    .then(([dbEmail]) => {
      const dbEmailConfig = dbEmail && {
        from: dbEmail.from,
        smsNameCharacterLimit: dbEmail.smsNameCharacterLimit,
        smtp: {
          ...JSON.parse(JSON.parse(dbEmail.smtp)),
          auth: JSON.parse(JSON.parse(JSON.parse(dbEmail.smtp)).auth)
        },
        subject: JSON.parse(JSON.parse(dbEmail.subject))
      }
      if (dbEmailConfig) {
        appConfig.email = {
          ...appConfig.email,
          ...dbEmailConfig
        }
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read emailSetting')
      console.warn(e)
    })
  promises.push(emailSettingPromise)

  const gameServerSetting = sequelizeClient.define('gameServerSetting', {
    clientHost: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rtc_start_port: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rtc_end_port: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    rtc_port_block_size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    identifierDigits: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    local: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: true
    },
    releaseName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    port: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    locationName: {
      type: DataTypes.STRING
    }
  })
  const gameServerSettingPromise = gameServerSetting
    .findAll()
    .then(([dbGameServer]) => {
      const dbGameServerConfig = dbGameServer && {
        clientHost: dbGameServer.clientHost,
        rtc_start_port: dbGameServer.rtc_start_port,
        rtc_end_port: dbGameServer.rtc_end_port,
        rtc_port_block_size: dbGameServer.rtc_port_block_size,
        identifierDigits: dbGameServer.identifierDigits,
        local: dbGameServer.local,
        domain: dbGameServer.domain,
        releaseName: dbGameServer.releaseName,
        port: dbGameServer.port,
        mode: dbGameServer.mode,
        locationName: dbGameServer.locationName
      }
      if (dbGameServerConfig) {
        appConfig.gameserver = {
          ...appConfig.gameserver,
          ...dbGameServerConfig
        }
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read gameServerSetting')
      console.warn(e)
    })
  promises.push(gameServerSettingPromise)

  const redisSetting = sequelizeClient.define('redisSetting', {
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    port: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    }
  })
  const redisSettingPromise = redisSetting
    .findAll()
    .then(([dbRedis]) => {
      const dbRedisConfig = dbRedis && {
        enabled: dbRedis.enabled,
        address: dbRedis.address,
        port: dbRedis.port,
        password: dbRedis.password
      }
      if (dbRedisConfig) {
        appConfig.redis = {
          ...appConfig.redis,
          ...dbRedisConfig
        }
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read redisSetting')
      console.warn(e)
    })
  promises.push(redisSettingPromise)

  const serverSetting = sequelizeClient.define('serverSetting', {
    hostname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    port: {
      type: DataTypes.STRING,
      allowNull: true
    },
    clientHost: {
      type: DataTypes.STRING,
      allowNull: true
    },
    rootDir: {
      type: DataTypes.STRING,
      allowNull: true
    },
    publicDir: {
      type: DataTypes.STRING,
      allowNull: true
    },
    nodeModulesDir: {
      type: DataTypes.STRING,
      allowNull: true
    },
    localStorageProvider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    performDryRun: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    storageProvider: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gaTrackingId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    hub: {
      type: DataTypes.JSON,
      allowNull: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    certPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    keyPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    gitPem: {
      type: DataTypes.STRING(2048),
      allowNull: true
    },
    local: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    releaseName: {
      type: DataTypes.STRING,
      allowNull: true
    }
  })
  const serverSettingPromise = serverSetting
    .findAll()
    .then(([dbServer]) => {
      const dbServerConfig = dbServer && {
        hostname: dbServer.hostname,
        mode: dbServer.mode,
        port: dbServer.port,
        clientHost: dbServer.clientHost,
        rootDir: dbServer.rootDir,
        publicDir: dbServer.publicDir,
        nodeModulesDir: dbServer.nodeModulesDir,
        localStorageProvider: dbServer.localStorageProvider,
        performDryRun: dbServer.performDryRun,
        storageProvider: dbServer.storageProvider,
        gaTrackingId: dbServer.gaTrackingId,
        url: dbServer.url,
        certPath: dbServer.certPath,
        keyPath: dbServer.keyPath,
        gitPem: dbServer.gitPem,
        local: dbServer.local,
        releaseName: dbServer.releaseName,
        hub: JSON.parse(JSON.parse(dbServer.hub))
      }
      appConfig.server = {
        ...appConfig.server,
        ...dbServerConfig
      }
    })
    .catch((e) => {
      console.warn('[updateAppConfig]: Failed to read serverSetting')
      console.warn(e)
    })
  promises.push(serverSettingPromise)
  await Promise.all(promises)
}
