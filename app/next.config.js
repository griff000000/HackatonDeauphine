const fs = require('fs')
const path = require('path')

function getDeployedAddresses() {
  try {
    const deploymentsPath = path.join(__dirname, '..', 'contracts', 'deployments', '.deployments.devnet.json')
    const data = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'))
    return {
      trustRegistryAddress: data.contracts.TrustRegistry.contractInstance.address,
      trustRegistryId: data.contracts.TrustRegistry.contractInstance.contractId,
    }
  } catch (e) {
    console.warn('⚠️  Could not read deployment file, using fallback addresses')
    return {
      trustRegistryAddress: '',
      trustRegistryId: '',
    }
  }
}

const deployed = getDeployedAddresses()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_TRUST_REGISTRY_ADDRESS: deployed.trustRegistryAddress,
    NEXT_PUBLIC_TRUST_REGISTRY_ID: deployed.trustRegistryId,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false
    }
    config.externals.push('pino-pretty', 'encoding')
    return config
  }
}

module.exports = nextConfig

