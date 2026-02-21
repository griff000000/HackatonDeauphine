'use client'

import React from 'react'
import ContractView from '@/components/ContractView'

export default function ContractPage({ params }: { params: { id: string } }) {
  // In a real app we would fetch the contract data based on params.id
  // For now, we will pass the mocked ID down to the view.
  return <ContractView contractId={params.id} />
}
