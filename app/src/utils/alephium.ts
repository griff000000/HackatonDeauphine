import { web3, NetworkId } from '@alephium/web3'

export const NETWORK: NetworkId = (process.env.NEXT_PUBLIC_NETWORK as NetworkId) || 'devnet'

const NODE_URLS: Record<NetworkId, string> = {
  devnet: 'http://127.0.0.1:22973',
  testnet: 'https://node.testnet.alephium.org',
  mainnet: 'https://node.mainnet.alephium.org',
}

export const NODE_URL = NODE_URLS[NETWORK]
export const ADDRESS_GROUP = 0

export function initWeb3() {
  web3.setCurrentNodeProvider(NODE_URL)
}

const TRUST_REGISTRY_ADDRESS = process.env.NEXT_PUBLIC_TRUST_REGISTRY_ADDRESS
  || '26c5v6C98dhHGjAzTaUZrJHzK3ZAyaXA1RnCFYoT6a263'

const TRUST_REGISTRY_ID = process.env.NEXT_PUBLIC_TRUST_REGISTRY_ID
  || 'b10d29976879200d6020005c917467b3cf200d3cf533dd41101f3b8f4800e600'

export function getTrustRegistryAddress(): string {
  return TRUST_REGISTRY_ADDRESS
}

export function getTrustRegistryId(): string {
  return TRUST_REGISTRY_ID
}

