'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion'
import {
  Check,
  Copy,
  LinkSimpleHorizontal,
  XCircle,
  ArrowRight,
  LockSimple,
  CaretRight,
  CaretLeft,
  Plus,
  ArrowCircleDown,
  PaperPlaneRight,
  Gavel,
  Warning,
  ArrowCounterClockwise,
  Timer,
  FilePdf,
  CaretDown,
  FileX,
  Clock,
  WarningCircle,
  ChatCenteredDots,
  DotsThreeOutline
} from '@phosphor-icons/react'
import { useWallet } from '@alephium/web3-react'
import { hexToString, ONE_ALPH, DUST_AMOUNT, stringToHex, binToHex, contractIdFromAddress } from '@alephium/web3'
import { Escrow, TrustRegistry, AcceptAndDeposit, Deliver, ReleasePayment, OpenDispute, SubmitEvidence, ResolveDispute, RefundByFreelancer, CancelEscrow, ClaimAfterDeadline } from 'my-contracts'
import { getTrustRegistryAddress } from '@/utils/alephium'
import styles from '@/styles/ContractView.module.css'
import Navbar from './Navbar'
import Link from 'next/link'

interface ContractViewProps {
  contractId: string;
}

const STATUS_LABELS: Record<number, string> = {
  0: 'En attente de caution',
  1: 'Mission active',
  2: 'Travail livré',
  3: 'Litige en cours',
  4: 'Terminé'
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address
  return `${address.slice(0, 10)}...${address.slice(-5)}`
}

function formatAlph(attoAlph: bigint): string {
  const alph = Number(attoAlph) / 1e18
  return alph.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

function formatDate(timestampMs: bigint): string {
  const date = new Date(Number(timestampMs))
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface EscrowState {
  client: string
  freelancer: string
  arbiter: string
  amount: bigint
  collateral: bigint
  deadline: bigint
  cdcHash: string
  deliverableLink: string
  status: bigint
  disputeReason: string
  disputeEvidence: string
  disputeJustification: string
}

export default function ContractView({ contractId }: ContractViewProps) {
  const { connectionStatus, signer, account } = useWallet()
  const isConnected = connectionStatus === 'connected'


  const [isCopied, setIsCopied] = useState(false)
  const [magicLinkUrl, setMagicLinkUrl] = useState('')
  const [escrowState, setEscrowState] = useState<EscrowState | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [trustScore, setTrustScore] = useState<bigint | null>(null)

  const [isDisputeDropdownOpen, setIsDisputeDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const disputeOptions = [
    { label: 'Qualité du travail insuffisante', icon: <FileX size={16} /> },
    { label: 'Retard de livraison important', icon: <Clock size={16} /> },
    { label: 'Cahier des charges non respecté', icon: <WarningCircle size={16} /> },
    { label: 'Communication insuffisante', icon: <ChatCenteredDots size={16} /> },
    { label: 'Autre raison', icon: <DotsThreeOutline size={16} /> },
  ]
  const [deliverLink, setDeliverLink] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [evidenceText, setEvidenceText] = useState('')
  const [resolveJustification, setResolveJustification] = useState('')
  const [showDisputeInput, setShowDisputeInput] = useState(false)

  const constraintsRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)

  useEffect(() => {
    setMagicLinkUrl(typeof window !== 'undefined' ? window.location.href : '')
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDisputeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchContractState = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true)
      setFetchError(null)

      console.log('[ContractView] Fetching contract at address:', contractId)

      const escrow = Escrow.at(contractId)
      let retries = 3
      let state: any = null
      while (retries > 0) {
        try {
          state = await escrow.fetchState()
          break
        } catch (e) {
          retries--
          if (retries === 0) throw e
          await new Promise(r => setTimeout(r, 1000))
        }
      }

      const f = state.fields
      const stripGroup = (addr: string) => addr.includes(':') ? addr.split(':')[0] : addr

      setEscrowState({
        client: stripGroup(f.client as string),
        freelancer: stripGroup(f.freelancer as string),
        arbiter: stripGroup(f.arbiter as string),
        amount: f.amount as bigint,
        collateral: f.collateral as bigint,
        deadline: f.deadline as bigint,
        cdcHash: hexToString(f.cdcHash as string),
        deliverableLink: hexToString(f.deliverableLink as string),
        status: f.status as bigint,
        disputeReason: hexToString(f.disputeReason as string),
        disputeEvidence: hexToString(f.disputeEvidence as string),
        disputeJustification: hexToString(f.disputeJustification as string),
      })

      // Fetch trust score
      try {
        const registryAddress = getTrustRegistryAddress()
        const registry = TrustRegistry.at(registryAddress)
        const scoreResult = await registry.view.getScore({ args: { freelancer: f.freelancer as string } })
        setTrustScore(scoreResult.returns)
      } catch (e) {
        console.warn('Could not fetch trust score:', e)
        setTrustScore(50n)
      }

    } catch (err: any) {
      console.error('Failed to fetch contract state:', err)
      if (err?.message?.includes('not found') || err?.message?.includes('KeyNotFound')) {
        if (!isRefresh) setFetchError('CONTRACT_COMPLETED')
      } else {
        if (!isRefresh) setFetchError('Contrat introuvable ou erreur réseau.')
      }
    } finally {
      if (!isRefresh) setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    fetchContractState()
  }, [fetchContractState])

  const handleCopyLink = async () => {
    if (!magicLinkUrl) return
    try {
      await navigator.clipboard.writeText(magicLinkUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const executeAction = async (action: () => Promise<any>) => {
    if (!signer) return
    setActionLoading(true)
    setActionError(null)
    try {
      const result = await action()
      console.log('Action successful:', result)

      // Polling refresh: try to fetch state multiple times to catch block updates
      let attempts = 0
      const maxAttempts = 5
      const poll = async () => {
        if (attempts >= maxAttempts) return
        attempts++
        await new Promise(r => setTimeout(r, 2000)) // Wait 2s between polls
        console.log(`[ContractView] Polling refresh attempt ${attempts}/${maxAttempts}`)
        await fetchContractState(true)
        poll()
      }
      poll()

    } catch (err: any) {
      console.error('Action failed (full):', JSON.stringify(err, null, 2))
      console.error('Action failed (raw):', err)
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      setActionError(msg)
      setTimeout(() => setActionError(null), 6000)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = () => executeAction(async () => {
    return await CancelEscrow.execute({
      signer: signer!,
      initialFields: { escrow: contractId },
      attoAlphAmount: DUST_AMOUNT
    })
  })

  const handleAcceptDeposit = () => executeAction(async () => {
    if (!escrowState) return
    return await AcceptAndDeposit.execute({
      signer: signer!,
      initialFields: { escrow: contractId, collateral: escrowState.collateral },
      attoAlphAmount: escrowState.collateral + DUST_AMOUNT
    })
  })

  const handleDeliver = () => executeAction(async () => {
    return await Deliver.execute({
      signer: signer!,
      initialFields: { escrow: contractId, link: stringToHex(deliverLink) },
      attoAlphAmount: DUST_AMOUNT
    })
  })

  const handleRelease = () => executeAction(async () => {
    return await ReleasePayment.execute({
      signer: signer!,
      initialFields: { escrow: contractId },
      attoAlphAmount: DUST_AMOUNT
    })
  })

  const handleDispute = () => executeAction(async () => {
    return await OpenDispute.execute({
      signer: signer!,
      initialFields: { escrow: contractId, reason: stringToHex(disputeReason) },
      attoAlphAmount: DUST_AMOUNT
    })
  })

  const handleSubmitEvidence = () => executeAction(async () => {
    return await SubmitEvidence.execute({
      signer: signer!,
      initialFields: { escrow: contractId, evidence: stringToHex(evidenceText) },
      attoAlphAmount: DUST_AMOUNT
    })
  })

  const handleResolve = (freelancerPercent: bigint) => executeAction(async () => {
    return await ResolveDispute.execute({
      signer: signer!,
      initialFields: { escrow: contractId, freelancerPercent, justification: stringToHex(resolveJustification) },
      attoAlphAmount: DUST_AMOUNT
    })
  })

  const handleRefund = () => executeAction(async () => {
    return await RefundByFreelancer.execute({
      signer: signer!,
      initialFields: { escrow: contractId },
      attoAlphAmount: DUST_AMOUNT
    })
  })

  const handleAutoClaim = () => executeAction(async () => {
    return await ClaimAfterDeadline.execute({
      signer: signer!,
      initialFields: { escrow: contractId },
      attoAlphAmount: DUST_AMOUNT
    })
  })

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  }

  const staggerRight = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 120, damping: 20 } },
  }

  const stripGroup = (addr: string) => addr.includes(':') ? addr.split(':')[0] : addr
  const userAddress = account?.address || ''
  const isClient = stripGroup(escrowState?.client || '') === userAddress
  const isFreelancer = stripGroup(escrowState?.freelancer || '') === userAddress
  const isArbiter = stripGroup(escrowState?.arbiter || '') === userAddress
  const statusNum = escrowState ? Number(escrowState.status) : -1

  const computedRole = isClient ? 'client' : isFreelancer ? 'freelancer' : isArbiter ? 'arbitrator' : 'visitor';

  if (escrowState && userAddress) {
    console.log('[Roles] User address:', userAddress)
    console.log('[Roles] Client on-chain:', escrowState.client, '→ isClient:', isClient)
    console.log('[Roles] Freelancer on-chain:', escrowState.freelancer, '→ isFreelancer:', isFreelancer)
    console.log('[Roles] Status:', statusNum)
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: 120 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #888', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </main>
      </div>
    )
  }

  if (fetchError && !escrowState) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'inline-flex', paddingTop: 80 }}>
            <div style={{ paddingTop: 12, paddingBottom: 12, paddingLeft: 12, paddingRight: 24, background: '#1A1A1A', overflow: 'hidden', borderRadius: 56, outline: '1px rgba(255, 255, 255, 0.12) solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'inline-flex' }}>
              <div style={{ padding: 8, position: 'relative', overflow: 'hidden', borderRadius: 48, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 100, display: 'inline-flex' }}>
                <Check size={24} weight="bold" color="white" />
              </div>
              <div style={{ color: '#888888', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', lineHeight: '20px', wordWrap: 'break-word' }}>Contrat terminé !</div>
            </div>
            <div style={{ width: 482, padding: 32, background: '#1A1A1A', overflow: 'hidden', borderRadius: 24, outline: '1px rgba(255, 255, 255, 0.12) solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 24, display: 'flex' }}>
              <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'flex' }}>
                <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 24, display: 'flex' }}>
                  <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, display: 'flex' }}>
                    <div style={{ width: 370, textAlign: 'center', color: '#888888', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', lineHeight: '20px', wordWrap: 'break-word' }}>
                      Ce contrat a été exécuté avec succès. Les fonds ont été libérés et le contrat a été détruit on-chain
                    </div>
                  </div>
                  <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                    <div style={{ color: '#888888', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', lineHeight: '20px', wordWrap: 'break-word' }}>Adresse du contrat</div>
                    <div style={{ alignSelf: 'stretch', padding: 12, background: '#212121', overflow: 'hidden', borderRadius: 16, outline: '1px rgba(255, 255, 255, 0.12) solid', outlineOffset: '-1px', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 100, display: 'flex' }}>
                      <div style={{ color: 'white', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', lineHeight: '20px', wordWrap: 'break-word' }}>{contractId}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 12, display: 'flex' }}>
                <a href="/" style={{ alignSelf: 'stretch', paddingLeft: 8, paddingRight: 16, overflow: 'hidden', borderRadius: 1024, justifyContent: 'center', alignItems: 'center', gap: 8, display: 'inline-flex', textDecoration: 'none' }}>
                  <span style={{ color: '#888888', fontSize: 12, fontFamily: 'Inter', fontWeight: '500', lineHeight: '16px', wordWrap: 'break-word' }}>Retour à l&apos;accueil</span>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!escrowState) return null

  const deadlineDate = new Date(Number(escrowState.deadline))
  const deadlineMonth = deadlineDate.getMonth()
  const deadlineYear = deadlineDate.getFullYear()
  const deadlineDay = deadlineDate.getDate()

  return (
    <div className={styles.page}>
      <Navbar userRole={computedRole} />

      <main className={styles.main}>
        <div className={styles.container}>

          {/* LEFT COLUMN */}
          <motion.div className={styles.leftColumn} variants={staggerContainer} initial="hidden" animate="show">
            {/* Card 1: Main Contract Info */}
            <motion.div className={styles.mainCardDark} variants={itemVariants}>
              {/* Header */}
              <div className={styles.mainCardHeader}>
                <div className={styles.statusPillDark}>
                  {statusNum < 4 && <div className={styles.statusIconSpinner} />}
                  {statusNum === 4 && <Check size={14} weight="bold" color="#4AEDC4" />}
                  <span className={styles.statusTextDark}>{STATUS_LABELS[statusNum] || 'Inconnu'}</span>
                </div>
                <span className={styles.contractIdDark}>#{contractId.slice(0, 8).toUpperCase()}</span>
              </div>

              <div className={styles.mainCardContent}>
                <h1 className={styles.projectTitleDark}>{escrowState.cdcHash || 'Escrow Contract'}</h1>

                {/* Amounts Area */}
                <div className={styles.amountsVerticalContainer}>
                  <div className={styles.amountBlockDark}>
                    <div className={styles.amountHeaderRow}>
                      <span className={styles.amountTitleDark}>Montant contrat + Caution Requise</span>
                      <div className={styles.alphBadgeDark}>
                        <div className={styles.alphIconOrange}>
                           <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M2.07603 6.95709C2.07603 6.82033 1.96835 6.7283 1.83573 6.75168L0.240333 7.03295C0.107712 7.05633 3.05176e-05 7.18634 3.05176e-05 7.32308V10.3364C3.05176e-05 10.4731 0.107712 10.5651 0.240333 10.5418L1.83573 10.2605C1.96835 10.2371 2.07603 10.1071 2.07603 9.97035V6.95709Z" fill="white"/>
                             <path d="M6.22789 0.209039C6.22789 0.0722941 6.12021 -0.0197484 5.98757 0.003628L4.39219 0.28491C4.25956 0.308286 4.15189 0.438292 4.15189 0.575048V3.58831C4.15189 3.72507 4.25956 3.8171 4.39219 3.79372L5.98757 3.51245C6.12021 3.48906 6.22789 3.35906 6.22789 3.22231V0.209039Z" fill="white"/>
                             <path d="M2.3354 0.912601C2.2738 0.776942 2.10843 0.68715 1.96633 0.7122L0.256976 1.01357C0.114867 1.03862 0.0495148 1.16909 0.111109 1.30475L3.89162 9.63122C3.95322 9.76688 4.11859 9.85668 4.26069 9.83162L5.97004 9.53026C6.11214 9.50521 6.1775 9.37473 6.11591 9.23907L2.3354 0.912601Z" fill="white"/>
                           </svg>
                        </div>
                        <span>ALPH</span>
                      </div>
                    </div>
                    <div className={styles.amountValuesColDark}>
                      <div className={styles.amountValuesColInner}>
                        <span className={styles.amountPrimaryDark}>{formatAlph(escrowState.amount)} + {formatAlph(escrowState.collateral)}</span>
                      </div>
                      <div className={styles.amountValuesColInner}>
                        <span className={styles.amountSecondaryDark}>
                          {(Number(escrowState.amount) / 1e18 * 3.5).toFixed(2)} $ + {(Number(escrowState.collateral) / 1e18 * 3.5).toFixed(2)} $
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.amountBlockDark}>
                    <div className={styles.amountHeaderRow}>
                      <span className={styles.amountTitleDark}>Total Coffre</span>
                      <div className={styles.alphBadgeDark}>
                        <div className={styles.alphIconOrange}>
                           <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M2.07603 6.95709C2.07603 6.82033 1.96835 6.7283 1.83573 6.75168L0.240333 7.03295C0.107712 7.05633 3.05176e-05 7.18634 3.05176e-05 7.32308V10.3364C3.05176e-05 10.4731 0.107712 10.5651 0.240333 10.5418L1.83573 10.2605C1.96835 10.2371 2.07603 10.1071 2.07603 9.97035V6.95709Z" fill="white"/>
                             <path d="M6.22789 0.209039C6.22789 0.0722941 6.12021 -0.0197484 5.98757 0.003628L4.39219 0.28491C4.25956 0.308286 4.15189 0.438292 4.15189 0.575048V3.58831C4.15189 3.72507 4.25956 3.8171 4.39219 3.79372L5.98757 3.51245C6.12021 3.48906 6.22789 3.35906 6.22789 3.22231V0.209039Z" fill="white"/>
                             <path d="M2.3354 0.912601C2.2738 0.776942 2.10843 0.68715 1.96633 0.7122L0.256976 1.01357C0.114867 1.03862 0.0495148 1.16909 0.111109 1.30475L3.89162 9.63122C3.95322 9.76688 4.11859 9.85668 4.26069 9.83162L5.97004 9.53026C6.11214 9.50521 6.1775 9.37473 6.11591 9.23907L2.3354 0.912601Z" fill="white"/>
                           </svg>
                        </div>
                        <span>ALPH</span>
                      </div>
                    </div>
                    <div className={styles.amountValuesColDark}>
                      <div className={styles.amountValuesColInner}>
                        <span className={styles.amountPrimaryDark}>{formatAlph(escrowState.amount + escrowState.collateral)}</span>
                      </div>
                      <div className={styles.amountValuesColInner}>
                        <span className={styles.amountSecondaryDark}>
                          {((Number(escrowState.amount) + Number(escrowState.collateral)) / 1e18 * 3.5).toFixed(2)} $
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Absolute Lock */}
                  <div className={styles.lockAbsContainer}>
                    <div className={styles.lockAbsInner}>
                      <LockSimple size={24} color="#1A1A1A" weight="bold" />
                    </div>
                  </div>
                </div>

                {/* Stakeholders */}
                <div className={styles.stakeholdersListDark}>
                  <div className={styles.stakeholderRowDark}>
                    <div className={styles.stakeholderLeftDark}>
                       <div className={styles.stakeholderAvatarPlaceholder} />
                       <span className={styles.stakeholderRoleDark}>Client</span>
                       {isClient && <span className={styles.trustScoreMuted}>(vous)</span>}
                    </div>
                    <span className={styles.stakeholderAddressDark} title={escrowState.client}>
                      {truncateAddress(escrowState.client)}
                    </span>
                  </div>

                  <div className={styles.stakeholderRowDark}>
                    <div className={styles.stakeholderLeftDark}>
                       <div className={styles.stakeholderAvatarFreelance} />
                       <span className={styles.stakeholderRoleDark}>Freelance</span>
                       {isFreelancer && <span className={styles.trustScoreMuted}>(vous)</span>}
                       <span className={styles.trustScoreMuted}>Trust score - {trustScore?.toString() || '50'}</span>
                    </div>
                    <span className={styles.stakeholderAddressDark} title={escrowState.freelancer}>
                      {truncateAddress(escrowState.freelancer)}
                    </span>
                  </div>

                  <div className={styles.stakeholderRowDark}>
                    <div className={styles.stakeholderLeftDark}>
                       <div className={styles.stakeholderAvatarArbitre} />
                       <span className={styles.stakeholderRoleDark}>Arbitre</span>
                       {isArbiter && <span className={styles.trustScoreMuted}>(vous)</span>}
                    </div>
                    <span className={styles.stakeholderAddressDark} title={escrowState.arbiter}>
                      {truncateAddress(escrowState.arbiter)}
                    </span>
                  </div>
                </div>

                {/* Deadline */}
                <div className={styles.deadlineSectionDark}>
                   <span className={styles.deadlineLabelDark}>Deadline</span>
                   <div className={styles.deadlineMonthYear}>
                     <span className={styles.deadlineMonthText}>
                       {deadlineDate.toLocaleDateString('en-US', { month: 'long' })}
                     </span>
                     <span className={styles.deadlineYearText}>{deadlineYear}</span>
                   </div>

                    <div className={styles.datePickerContainer} ref={constraintsRef}>
                     <div className={styles.fadeLeft} />
                     <motion.div
                       className={styles.datePicker}
                       ref={innerRef}
                       style={{ x }}
                       drag="x"
                       dragConstraints={constraintsRef}
                       dragElastic={0.1}
                     >
                        {Array.from({ length: 40 }, (_, index) => {
                          const dateObj = new Date(deadlineYear, deadlineMonth, 1)
                          dateObj.setDate(1 + index)
                          const dayOfMonth = dateObj.getDate()
                          const month = dateObj.getMonth()
                          const year = dateObj.getFullYear()
                          const isSelected = dayOfMonth === deadlineDay && month === deadlineMonth && year === deadlineYear

                          return (
                            <motion.button
                              key={`${year}-${month}-${dayOfMonth}`}
                              data-date={`${year}-${month}-${dayOfMonth}`}
                              type="button"
                              className={`${styles.dateChip} ${isSelected ? styles.dateChipSelected : ''}`}
                              initial={false}
                              animate={{ opacity: 1, scale: 1 }}
                              style={{ cursor: 'default' }}
                            >
                              {dayOfMonth.toString().padStart(2, '0')}
                            </motion.button>
                          )
                        })}
                     </motion.div>
                     <div className={styles.fadeRight} />
                   </div>
                </div>

                {/* Documents / CDC */}
                {escrowState.cdcHash && (
                  <div className={styles.deadlineSectionDark} style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
                    <span className={styles.deadlineLabelDark}>Cahier des Charges</span>
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${escrowState.cdcHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#4AEDC4',
                        fontSize: '13px',
                        textDecoration: 'none',
                        marginTop: '8px',
                        background: 'rgba(74, 237, 196, 0.1)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        width: 'fit-content'
                      }}
                      className="gradient-hover-btn"
                    >
                      <FilePdf size={18} weight="bold" />
                      Voir le document
                    </a>
                  </div>
                )}

                {escrowState.deliverableLink && (
                  <div className={styles.deadlineSectionDark}>
                    <span className={styles.deadlineLabelDark}>Livrable</span>
                    <a href={escrowState.deliverableLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4AEDC4', fontSize: '13px', wordBreak: 'break-all' }}>
                      {escrowState.deliverableLink}
                    </a>
                  </div>
                )}

                {escrowState.disputeReason && (
                  <div className={styles.deadlineSectionDark}>
                    <span className={styles.deadlineLabelDark}>Motif du litige</span>
                    <p style={{ color: '#ef4444', fontSize: '13px' }}>{escrowState.disputeReason}</p>
                  </div>
                )}
                {escrowState.disputeEvidence && (
                  <div className={styles.deadlineSectionDark}>
                    <span className={styles.deadlineLabelDark}>Preuve soumise</span>
                    <p style={{ color: '#888', fontSize: '13px' }}>{escrowState.disputeEvidence}</p>
                  </div>
                )}
                {escrowState.disputeJustification && (
                  <div className={styles.deadlineSectionDark}>
                    <span className={styles.deadlineLabelDark}>Décision de l&apos;arbitre</span>
                    <p style={{ color: '#4AEDC4', fontSize: '13px' }}>{escrowState.disputeJustification}</p>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN */}
          <motion.div className={styles.rightColumn} variants={staggerRight} initial="hidden" animate="show">
            {/* Card 1: Magic Link */}
            <motion.div className={styles.card} variants={itemVariants}>
              <div className={styles.magicLinkWrapper}>
                <div className={styles.magicLinkHeader}>
                  <LinkSimpleHorizontal size={20} color="#888888" />
                  <span className={styles.magicLinkHeaderTitle}>Magic Link</span>
                </div>

                <div className={styles.magicLinkBox}>
                  <span className={styles.magicLinkText} title={magicLinkUrl}>
                    {magicLinkUrl ? (magicLinkUrl.length > 30 ? magicLinkUrl.substring(0, 27) + '...' : magicLinkUrl) : 'Chargement...'}
                  </span>
                  <button className={styles.magicLinkCopyBtn} onClick={handleCopyLink} title="Copier le lien">
                    {isCopied ? (
                      <Check size={16} color="#48AC67" weight="bold" />
                    ) : (
                      <Copy size={16} color="#3C3C3C" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Actions */}
            <motion.div className={styles.card} variants={itemVariants}>
              <div className={styles.actionTopArea}>
                <div className={styles.statusPillDark}>
                  {statusNum < 4 && <div className={styles.statusIconSpinner} />}
                  {statusNum === 4 && <Check size={14} weight="bold" color="#4AEDC4" />}
                  <span className={styles.statusTextDark}>{STATUS_LABELS[statusNum] || 'Inconnu'}</span>
                </div>

                {statusNum === 0 && (
                  <p className={styles.actionSubtitle}>Le freelance doit déposer {formatAlph(escrowState.collateral)} ALPH pour activer le contrat. Le client peut annuler.</p>
                )}
                {statusNum === 1 && (
                  <p className={styles.actionSubtitle}>Le freelance doit soumettre son travail avec un lien.</p>
                )}
                {statusNum === 2 && (
                  <p className={styles.actionSubtitle}>Le client doit vérifier le travail et libérer les fonds.</p>
                )}
                {statusNum === 3 && (
                  <p className={styles.actionSubtitle}>L&apos;arbitre doit évaluer le litige et trancher.</p>
                )}
              </div>

              {actionError && (
                <p style={{ color: '#ef4444', fontSize: '12px', padding: '8px 0' }}>{actionError}</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {statusNum === 0 && isClient && (
                  <button
                    className={`${styles.btnDanger} gradient-hover-btn`}
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <><span className={styles.btnSpinner} style={{borderTopColor: 'currentColor'}} /> Annulation...</> : <><XCircle size={18} weight="bold" color="currentColor" />Annuler & Récupérer</>}
                  </button>
                )}

                {statusNum === 0 && isFreelancer && (
                  <button
                    className={`${styles.btnSuccess} gradient-hover-btn`}
                    onClick={handleAcceptDeposit}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <><span className={styles.btnSpinner} style={{borderTopColor: 'currentColor'}} /> Dépôt...</> : <><Check size={18} weight="bold" color="currentColor" />{`Accepter & Déposer ${formatAlph(escrowState.collateral)} ALPH`}</>}
                  </button>
                )}

                {statusNum === 1 && isFreelancer && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Lien vers le livrable..."
                        value={deliverLink}
                        onChange={(e) => setDeliverLink(e.target.value)}
                        style={{ flex: 1, background: '#212121', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '12px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`${styles.btnDanger} gradient-hover-btn`}
                        onClick={handleRefund}
                        disabled={actionLoading}
                        style={{ flex: 1 }}
                      >
                        {actionLoading ? <><span className={styles.btnSpinner} style={{borderTopColor: 'currentColor'}} /> Abandonner...</> : <><ArrowCounterClockwise size={18} weight="bold" color="currentColor" />Abandonner</>}
                      </button>
                      <button
                        className={`${styles.btnSuccess} gradient-hover-btn`}
                        onClick={handleDeliver}
                        disabled={actionLoading || !deliverLink.trim()}
                        style={{ flex: 2 }}
                      >
                        {actionLoading ? <><span className={styles.btnSpinner} style={{borderTopColor: 'currentColor'}} /> Envoi...</> : <><PaperPlaneRight size={18} weight="bold" color="currentColor" />Soumettre</>}
                      </button>
                    </div>
                  </div>
                )}

                {(statusNum === 1 || statusNum === 2) && (isClient || isFreelancer) && (
                  <div style={{ marginTop: '24px' }}>
                    {!showDisputeInput ? (
                      <button
                        className={styles.btnLinkSubtle}
                        onClick={() => setShowDisputeInput(true)}
                      >
                        Ouvrir un litige
                      </button>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className={styles.dropdownContainer} ref={dropdownRef}>
                          <button
                            className={`${styles.dropdownTrigger} ${isDisputeDropdownOpen ? styles.dropdownTriggerActive : ''}`}
                            onClick={() => setIsDisputeDropdownOpen(!isDisputeDropdownOpen)}
                          >
                            <div className={styles.dropdownValue}>
                              <Warning size={18} weight="bold" color={disputeReason ? "#F6A83B" : "#888"} />
                              {disputeReason ? (
                                <span>{disputeReason}</span>
                              ) : (
                                <span className={styles.dropdownPlaceholder}>Choisir la raison du litige...</span>
                              )}
                            </div>
                            <CaretDown
                              size={16}
                              weight="bold"
                              style={{
                                transform: isDisputeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s ease',
                                color: '#888'
                              }}
                            />
                          </button>

                          <AnimatePresence>
                            {isDisputeDropdownOpen && (
                              <motion.div
                                className={styles.dropdownMenu}
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.15, ease: 'easeOut' }}
                              >
                                {disputeOptions.map((option) => (
                                  <div
                                    key={option.label}
                                    className={`${styles.dropdownItem} ${disputeReason === option.label ? styles.dropdownItemSelected : ''}`}
                                    onClick={() => {
                                      setDisputeReason(option.label)
                                      setIsDisputeDropdownOpen(false)
                                    }}
                                  >
                                    <div className={styles.dropdownItemIcon}>
                                      {option.icon}
                                    </div>
                                    {option.label}
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className={`${styles.btnWarning} gradient-hover-btn`}
                            onClick={handleDispute}
                            disabled={actionLoading || !disputeReason}
                            style={{ flex: 1 }}
                          >
                            {actionLoading ? <><span className={styles.btnSpinner} style={{borderTopColor: 'currentColor'}} /> Envoi...</> : <><Warning size={16} weight="bold" color="currentColor" />Confirmer le litige</>}
                          </button>
                          <button
                            onClick={() => { setShowDisputeInput(false); setDisputeReason(''); setIsDisputeDropdownOpen(false); }}
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              border: '1px solid rgba(255,255,255,0.12)',
                              background: 'rgba(255,255,255,0.06)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <XCircle size={18} weight="bold" color="#888" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {statusNum === 2 && isClient && (
                  <button
                    className={`${styles.btnSuccess} gradient-hover-btn`}
                    onClick={handleRelease}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <><span className={styles.btnSpinner} style={{borderTopColor: 'currentColor'}} /> Validation...</> : <><Check size={18} weight="bold" color="currentColor" />Valider & Libérer les fonds</>}
                  </button>
                )}

                {statusNum === 2 && (
                  <button
                    className={`${styles.btnCancelWhite} gradient-hover-btn`}
                    onClick={handleAutoClaim}
                    disabled={actionLoading}
                    style={{ opacity: 0.7 }}
                  >
                    {actionLoading ? <><span className={styles.btnSpinner} /> Réclamation...</> : <><Timer size={18} weight="bold" color="black" /> Auto-claim (après deadline + 48h)</>}
                  </button>
                )}

                {statusNum === 3 && (isClient || isFreelancer) && !escrowState.disputeEvidence && (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Votre preuve / version des faits..."
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                        style={{ flex: 1, background: '#212121', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '12px' }}
                      />
                    </div>
                    <button
                      className={`${styles.btnCancelWhite} gradient-hover-btn`}
                      onClick={handleSubmitEvidence}
                      disabled={actionLoading || !evidenceText.trim()}
                    >
                      {actionLoading ? <><span className={styles.btnSpinner} /> Envoi...</> : <><PaperPlaneRight size={18} weight="bold" color="black" /> Soumettre la preuve</>}
                    </button>
                  </>
                )}

                {statusNum === 3 && (
                  <Link href={`/contract/${contractId}/arbitration`}>
                    <button
                      className={`${styles.btnCancelWhite} gradient-hover-btn`}
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      <Gavel size={18} weight="bold" color="black" />
                      Voir la page d'arbitrage
                    </button>
                  </Link>
                )}

                {statusNum === 4 && (
                  <p style={{ color: '#4AEDC4', fontSize: '13px', textAlign: 'center' }}>
                    Ce contrat est terminé.
                  </p>
                )}
              </div>
            </motion.div>

            {/* Card 3: Contract Info */}
            <motion.div className={styles.infoCardDark} variants={itemVariants}>
              <div className={styles.infoCardHeader}>
                <span className={styles.infoCardTitle}>Informations du contrat</span>
              </div>

              <div className={styles.infoCardList}>
                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Montant verrouillé</span>
                  </div>
                  <div className={styles.infoValueContainer}>
                    <span className={styles.infoValueDark}>{formatAlph(escrowState.amount)} ALPH</span>
                  </div>
                </div>

                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Client</span>
                  </div>
                  <div className={styles.infoValueContainerWithIcon}>
                    <span className={styles.infoValueMuted}>{truncateAddress(escrowState.client)}{isClient ? ' (vous)' : ''}</span>
                    <Copy size={14} color="#555555" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(escrowState.client)} />
                  </div>
                </div>

                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Freelance</span>
                  </div>
                  <div className={styles.infoValueContainerWithIcon}>
                    <span className={styles.infoValueMuted}>{truncateAddress(escrowState.freelancer)}{isFreelancer ? ' (vous)' : ''}</span>
                    <Copy size={14} color="#555555" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(escrowState.freelancer)} />
                  </div>
                </div>

                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Arbitre</span>
                  </div>
                  <div className={styles.infoValueContainerWithIcon}>
                    <span className={styles.infoValueMuted}>{truncateAddress(escrowState.arbiter)}{isArbiter ? ' (vous)' : ''}</span>
                    <Copy size={14} color="#555555" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(escrowState.arbiter)} />
                  </div>
                </div>

                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Deadline</span>
                  </div>
                  <div className={styles.infoValueContainer}>
                    <span className={styles.infoValueMuted}>{formatDate(escrowState.deadline)}</span>
                  </div>
                </div>

                <div className={styles.infoRowDarkLast}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Caution</span>
                  </div>
                  <div className={styles.infoValueContainer}>
                    <span className={styles.infoValueMuted}>{formatAlph(escrowState.collateral)} ALPH</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </main>
    </div>
  )
}
