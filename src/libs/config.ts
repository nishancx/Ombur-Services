import 'dotenv/config'

function loadFromEnv(key: string) {
  if (typeof process.env[key] !== 'undefined') {
    return process.env[key] as string
  }

  throw new Error(`process.env doesn't have the key ${key}`)
}

const config = {
  mongodbUri: loadFromEnv('MONGODB_URI'),
  port: loadFromEnv('PORT'),
  authSecret: loadFromEnv('AUTH_SECRET'),
  renderGitCommit: loadFromEnv('RENDER_GIT_COMMIT'),
}

export { config as serverConfig }
