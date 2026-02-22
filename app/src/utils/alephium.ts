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
  return '2BcvcZHNgZWu4CooU727ddUALz3xEJh2Ppq2Y6x8o1KqR'
}

export function getTrustRegistryId(): string {
  return 'fb8ea8e6d93e3386209615e0b7457a6fad21c41a356df240886961e99975a500'
}

// Whitelisted arbiter address — only this address can resolve disputes
export const ARBITER_ADDRESS = '1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH'
