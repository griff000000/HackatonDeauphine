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

export function getTrustRegistryAddress(): string {
  // Mock for frontend demo
  return "1MockTrustRegistryAddress"
}

export function getTrustRegistryId(): string {
  // Mock for frontend demo
  return "mock-trust-registry-id"
}
