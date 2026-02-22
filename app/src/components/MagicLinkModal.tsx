'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, Check, Copy, CurrencyDollar, ArrowRight, User } from '@phosphor-icons/react'
import { useWallet } from '@alephium/web3-react'
import { AlephiumConnectButton } from '@alephium/web3-react'
import { hexToString } from '@alephium/web3'
import { Escrow } from 'my-contracts'
import styles from '@/styles/MagicLinkModal.module.css'

interface MagicLinkModalProps {
  contractId: string
  onClose: () => void
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address
  return `${address.slice(0, 10)}...${address.slice(-5)}`
}

function formatAlph(attoAlph: bigint): string {
  const alph = Number(attoAlph) / 1e18
  return alph.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const STATUS_LABELS: Record<number, string> = {
  0: 'Waiting for deposit',
  1: 'Mission active',
  2: 'Work delivered',
  3: 'Dispute open',
  4: 'Completed'
}

export default function MagicLinkModal({ contractId, onClose }: MagicLinkModalProps) {
  const { connectionStatus, account } = useWallet()
  const isConnected = connectionStatus === 'connected'
  const [isCopied, setIsCopied] = useState(false)
  const [contractData, setContractData] = useState<{
    projectName: string
    amount: string
    collateral: string
    client: string
    freelancer: string
    status: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true)
      const escrow = Escrow.at(contractId)
      const state = await escrow.fetchState()
      const f = state.fields
      setContractData({
        projectName: hexToString(f.cdcHash as string),
        amount: formatAlph(f.amount as bigint),
        collateral: formatAlph(f.collateral as bigint),
        client: f.client as string,
        freelancer: f.freelancer as string,
        status: Number(f.status as bigint),
      })
    } catch (err) {
      console.error('Failed to fetch contract for modal:', err)
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    fetchContract()
  }, [fetchContract])

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(contractId)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2, delay: 0.1 } }
  }

  const contentVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
    exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.15 } }
  }

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        <motion.div
          className={styles.modal}
          variants={contentVariants}
          onClick={e => e.stopPropagation()}
        >
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} weight="bold" />
          </button>

          <div className={styles.header}>
            <div className={styles.headerIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.5 8.25H4.5C4.08579 8.25 3.75 8.58579 3.75 9V19.5C3.75 19.9142 4.08579 20.25 4.5 20.25H19.5C19.9142 20.25 20.25 19.9142 20.25 19.5V9C20.25 8.58579 19.9142 8.25 19.5 8.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8.25 8.25V5.25C8.25 4.25544 8.64509 3.30161 9.34835 2.59835C10.0516 1.89509 11.0054 1.5 12 1.5C12.9946 1.5 13.9484 1.89509 14.6517 2.59835C15.3549 3.30161 15.75 4.25544 15.75 5.25V8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect width="16.5" height="12" transform="translate(3.375 7.875)" fill="currentColor"/>
                </svg>
            </div>
            <h2 className={styles.title}>Escrow Contract</h2>
          </div>

          {/* Contract ID */}
          <div className={styles.idRow}>
            <Hash size={16} color="#555" />
            <span className={styles.idText}>{contractId.slice(0, 12)}...{contractId.slice(-6)}</span>
            <button className={styles.copyIdBtn} onClick={handleCopyId}>
              {isCopied ? <Check size={14} color="#4AEDC4" /> : <Copy size={14} color="#555" />}
            </button>
          </div>

          {/* Contract details */}
          {loading ? (
            <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
              Loading...
            </p>
          ) : contractData ? (
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Project</span>
                <span className={styles.detailValue}>{contractData.projectName}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Amount</span>
                <span className={styles.detailValue}>{contractData.amount} ALPH</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Collateral</span>
                <span className={styles.detailValue}>{contractData.collateral} ALPH</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>{STATUS_LABELS[contractData.status] || 'Unknown'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Client</span>
                <span className={styles.detailValue}>{truncateAddress(contractData.client)}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Freelancer</span>
                <span className={styles.detailValue}>{truncateAddress(contractData.freelancer)}</span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#ef4444', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
              Contract not found.
            </p>
          )}

          <div className={styles.actionArea}>
            {!isConnected ? (
              <AlephiumConnectButton.Custom>
                {({ show }) => (
                  <button className={`${styles.connectWalletBtn} gradient-hover-btn`} onClick={show}>
                    Connect Wallet
                    <ArrowRight size={16} weight="bold" />
                  </button>
                )}
              </AlephiumConnectButton.Custom>
            ) : (
              <div className={styles.connectedInfo}>
                <div className={styles.connectedDot} />
                <span className={styles.connectedText}>
                  Connected: {account?.address ? truncateAddress(account.address) : ''}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
