'use client'

import React, { useEffect } from 'react'
import { AlephiumWalletProvider } from '@alephium/web3-react'
import { NETWORK, ADDRESS_GROUP, initWeb3 } from '@/utils/alephium'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initWeb3()
  }, [])

  return (
    <AlephiumWalletProvider theme="retro" network={NETWORK} addressGroup={ADDRESS_GROUP}>
      {children}
    </AlephiumWalletProvider>
  )
}
