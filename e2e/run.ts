const axios = require('axios')
import { spawn, spawnSync, ChildProcess } from 'child_process'

const debug = false
const postgresContainerName = 'blockchain-api-db-e2e'

async function main() {
  process.on('SIGINT', () => process.exit(1))
  process.on('SIGTERM', () => process.exit(1))

  setUpDatabase()

  const env = {
    DEPLOY_ENV: 'e2e',
    FIREBASE_PROJECT_ID: 'e2e',
    EXCHANGE_RATES_API: 'https://apilayer.net/api',
    BLOCKSCOUT_API: 'https://alfajores-blockscout.celo-testnet.org',
    FIREBASE_DB: 'https://does.not.matter.com',
    FAUCET_ADDRESS: '0x456f41406B32c45D59E539e4BBA3D7898c3584dA',
    VERIFICATION_REWARDS_ADDRESS: '0xb4fdaf5f3cd313654aa357299ada901b1d2dd3b5',
    WEB3_PROVIDER_URL: 'https://alfajores-forno.celo-testnet.org',
    EXCHANGE_RATES_API_ACCESS_KEY: 'does.not.matter.com',
    BLOCKCHAIN_DB_HOST: 'localhost',
    BLOCKCHAIN_DB_USER: 'postgres',
    BLOCKCHAIN_DB_DATABASE: 'blockchain-api',
    BLOCKCHAIN_DB_PASS: 'pass',
    EXCHANGES_NETWORK_CONFIG: 'alfajores',
    CELO_TOKEN_ADDRESS: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
    STAKED_CELO_TOKEN_ADDRESS: '0xD22E18556E43cb29D6d6172D4b33Fd2Edb629EF2',
    STAKED_CELO_MANAGER_ADDRESS: '0xFfe124dde2b29fA848aD8caAEBE85651F0b5c406',
    ALCHEMY_ETHEREUM_API_KEY: 'does not matter',
  }

  const subprocess: ChildProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
  })

  process.on('exit', () => {
    cleanDatabase()
    subprocess.kill()
  })

  // Ensure server starts.
  let now = Date.now()
  const end = now + 10 * 1000
  while (true) {
    try {
      const result = await axios({
        method: 'GET',
        url: '/.well-known/apollo/server-health',
        baseURL: 'http://localhost:8080',
      })
      if (result.status !== 200) {
        throw new Error(`Unexpected status: ${result.status}`)
      }
      break
    } catch (error) {
      now = Date.now()
      if (now > end) {
        throw error
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })
    }
  }

  // NOTE: if we add more tests we might need to set a valid
  // EXCHANGE_RATES_API_ACCESS_KEY above.
}

function setUpDatabase() {
  docker([
    'run',
    '--name',
    postgresContainerName,
    '--rm',
    '-d',
    '-p',
    '5432:5432',
    '-e',
    `POSTGRES_DB=blockchain-api`,
    '-e',
    `POSTGRES_PASSWORD=pass`,
    'postgres',
  ])
}

function cleanDatabase() {
  docker(['rm', '-f', postgresContainerName])
}

function run(command?: any, args?: any, options?: any) {
  options = options || {}
  if (debug) console.info(`${command} \\\n  ${args.join(' \\\n  ')}`)
  const result = spawnSync(command, args, options)
  if (result.error) {
    throw result.error
  } else if (result.status) {
    throw new Error(`${command} failed: ${result.status}`)
  } else if (result.signal) {
    throw new Error(`${command} exited from signal: ${result.signal}`)
  }
  return result
}

function docker(args?: any, options?: any) {
  options = options || {}
  options = {
    ...options,
    env: {
      ...process.env,
      ...options.env,
    },
  }
  return run('docker', args, options)
}

main()
  .then(() => {
    console.log('success') // eslint-disable-line no-console
    process.exit(0)
  })
  .catch((err) => {
    console.error(err) // eslint-disable-line no-console
    process.exit(1)
  })
