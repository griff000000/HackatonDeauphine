'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
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
  FilePdf
} from '@phosphor-icons/react'
import { useWallet } from '@alephium/web3-react'
import { hexToString, ONE_ALPH, DUST_AMOUNT, stringToHex, binToHex, contractIdFromAddress } from '@alephium/web3'
import { Escrow, TrustRegistry, AcceptAndDeposit, Deliver, ReleasePayment, OpenDispute, SubmitEvidence, ResolveDispute, RefundByFreelancer, CancelEscrow, ClaimAfterDeadline } from 'my-contracts'
import { getTrustRegistryAddress } from '@/utils/alephium'
import styles from '@/styles/ContractView.module.css'
import Navbar from './Navbar'

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

  const escrowContractId = binToHex(contractIdFromAddress(contractId))

  const [isCopied, setIsCopied] = useState(false)
  const [magicLinkUrl, setMagicLinkUrl] = useState('')
  const [escrowState, setEscrowState] = useState<EscrowState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [trustScore, setTrustScore] = useState<bigint | null>(null)

  const [deliverLink, setDeliverLink] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [evidenceText, setEvidenceText] = useState('')
  const [resolveJustification, setResolveJustification] = useState('')

  const constraintsRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)

  useEffect(() => {
    setMagicLinkUrl(typeof window !== 'undefined' ? window.location.href : '')
  }, [])

  const fetchContractState = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[ContractView] Fetching contract at address:', contractId)

      let state: any = null
      let lastErr: any = null
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const escrowInstance = Escrow.at(contractId)
          state = await escrowInstance.fetchState()
          break
        } catch (e: any) {
          lastErr = e
          console.warn(`[ContractView] Attempt ${attempt + 1}/5 failed:`, e?.message)
          if (attempt < 4) await new Promise(r => setTimeout(r, 2000))
        }
      }
      if (!state) {
        throw lastErr || new Error('Failed to fetch contract state after retries')
      }

      console.log('[ContractView] Contract state fetched:', state.fields)

      const fields = state.fields
      setEscrowState({
        client: fields.client as string,
        freelancer: fields.freelancer as string,
        arbiter: fields.arbiter as string,
        amount: fields.amount as bigint,
        collateral: fields.collateral as bigint,
        deadline: fields.deadline as bigint,
        cdcHash: hexToString(fields.cdcHash as string),
        deliverableLink: (fields.deliverableLink as string).length > 0 ? hexToString(fields.deliverableLink as string) : '',
        status: fields.status as bigint,
        disputeReason: (fields.disputeReason as string).length > 0 ? hexToString(fields.disputeReason as string) : '',
        disputeEvidence: (fields.disputeEvidence as string).length > 0 ? hexToString(fields.disputeEvidence as string) : '',
        disputeJustification: (fields.disputeJustification as string).length > 0 ? hexToString(fields.disputeJustification as string) : '',
      })

      try {
        const registry = TrustRegistry.at(getTrustRegistryAddress())
        const scoreResult = await registry.view.getScore({ args: { freelancer: fields.freelancer as string } })
        setTrustScore(scoreResult.returns)
      } catch {
        setTrustScore(50n)
      }

    } catch (err: any) {
      console.error('Failed to fetch contract state:', err)
      setError('Contrat introuvable ou erreur réseau.')
    } finally {
      setLoading(false)
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
    setError(null)
    try {
      const result = await action()
      console.log('Action successful:', result)
      if (result && typeof result === 'object' && 'txId' in result) {
        console.log('Transaction ID:', result.txId)
      }
      setError(null)
      setTimeout(fetchContractState, 3000)
    } catch (err: any) {
      console.error('Action failed (full):', JSON.stringify(err, null, 2))
      console.error('Action failed (raw):', err)
      const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))
      setError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const execScript = (script: any, fields: any, alphAmount?: bigint) => {
    return script.execute({
      signer: signer!,
      initialFields: fields,
      attoAlphAmount: alphAmount ?? DUST_AMOUNT,
      group: 0
    } as any)
  }

  const handleCancel = () => executeAction(async () => {
    await execScript(CancelEscrow, { escrow: escrowContractId })
  })

  const handleAcceptDeposit = () => executeAction(async () => {
    if (!escrowState) return
    await execScript(AcceptAndDeposit, { escrow: escrowContractId, collateral: escrowState.collateral }, escrowState.collateral + DUST_AMOUNT)
  })

  const handleDeliver = () => executeAction(async () => {
    await execScript(Deliver, { escrow: escrowContractId, link: stringToHex(deliverLink) })
  })

  const handleRelease = () => executeAction(async () => {
    await execScript(ReleasePayment, { escrow: escrowContractId })
  })

  const handleDispute = () => executeAction(async () => {
    await execScript(OpenDispute, { escrow: escrowContractId, reason: stringToHex(disputeReason) })
  })

  const handleSubmitEvidence = () => executeAction(async () => {
    await execScript(SubmitEvidence, { escrow: escrowContractId, evidence: stringToHex(evidenceText) })
  })

  const handleResolve = (toFreelancer: boolean) => executeAction(async () => {
    await execScript(ResolveDispute, { escrow: escrowContractId, toFreelancer, justification: stringToHex(resolveJustification) })
  })

  const handleRefund = () => executeAction(async () => {
    await execScript(RefundByFreelancer, { escrow: escrowContractId })
  })

  const handleAutoClaim = () => executeAction(async () => {
    await execScript(ClaimAfterDeadline, { escrow: escrowContractId })
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
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
            <p>Chargement du contrat...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error && !escrowState) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: '480px', margin: '0 auto' }}>
            <h2 style={{ color: '#4AEDC4', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
              Contrat terminé
            </h2>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Ce contrat a été exécuté avec succès. Les fonds ont été libérés et le contrat a été détruit on-chain.
            </p>
            <div style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <span style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Adresse du contrat</span>
              <p style={{ color: '#fff', fontSize: '13px', wordBreak: 'break-all', marginTop: '6px', fontFamily: 'monospace' }}>{contractId}</p>
            </div>
            <a href="/" style={{ color: '#4AEDC4', fontSize: '14px', textDecoration: 'none' }}>
              ← Retour à l&apos;accueil
            </a>
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
      <Navbar />

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
                           <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}>⋈</span>
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
                           <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}>⋈</span>
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

              {error && (
                <p style={{ color: '#ef4444', fontSize: '12px', padding: '8px 0' }}>{error}</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                {statusNum === 0 && isClient && (
                  <button
                    className={`${styles.btnCancelWhite} gradient-hover-btn`}
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    <XCircle size={18} weight="bold" color="black" />
                    {actionLoading ? 'En cours...' : 'Annuler & Récupérer'}
                  </button>
                )}

                {statusNum === 0 && isFreelancer && (
                  <button
                    className={`${styles.btnCancelWhite} gradient-hover-btn`}
                    onClick={handleAcceptDeposit}
                    disabled={actionLoading}
                  >
                    <Check size={18} weight="bold" color="black" />
                    {actionLoading ? 'En cours...' : `Accepter & Déposer ${formatAlph(escrowState.collateral)} ALPH`}
                  </button>
                )}

                {statusNum === 1 && isFreelancer && (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Lien vers le livrable..."
                        value={deliverLink}
                        onChange={(e) => setDeliverLink(e.target.value)}
                        style={{ flex: 1, background: '#212121', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '12px' }}
                      />
                    </div>
                    <button
                      className={`${styles.btnCancelWhite} gradient-hover-btn`}
                      onClick={handleDeliver}
                      disabled={actionLoading || !deliverLink.trim()}
                    >
                      <PaperPlaneRight size={18} weight="bold" color="black" />
                      {actionLoading ? 'En cours...' : 'Soumettre le travail'}
                    </button>
                    <button
                      className={`${styles.btnCancelWhite} gradient-hover-btn`}
                      onClick={handleRefund}
                      disabled={actionLoading}
                      style={{ opacity: 0.7 }}
                    >
                      <ArrowCounterClockwise size={18} weight="bold" color="black" />
                      {actionLoading ? 'En cours...' : 'Abandonner la mission'}
                    </button>
                  </>
                )}

                {(statusNum === 1 || statusNum === 2) && (isClient || isFreelancer) && (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Raison du litige..."
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        style={{ flex: 1, background: '#212121', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '12px' }}
                      />
                    </div>
                    <button
                      className={`${styles.btnCancelWhite} gradient-hover-btn`}
                      onClick={handleDispute}
                      disabled={actionLoading || !disputeReason.trim()}
                      style={{ opacity: 0.7 }}
                    >
                      <Warning size={18} weight="bold" color="black" />
                      {actionLoading ? 'En cours...' : 'Ouvrir un litige'}
                    </button>
                  </>
                )}

                {statusNum === 2 && isClient && (
                  <button
                    className={`${styles.btnCancelWhite} gradient-hover-btn`}
                    onClick={handleRelease}
                    disabled={actionLoading}
                  >
                    <Check size={18} weight="bold" color="black" />
                    {actionLoading ? 'En cours...' : 'Valider & Libérer les fonds'}
                  </button>
                )}

                {statusNum === 2 && (
                  <button
                    className={`${styles.btnCancelWhite} gradient-hover-btn`}
                    onClick={handleAutoClaim}
                    disabled={actionLoading}
                    style={{ opacity: 0.7 }}
                  >
                    <Timer size={18} weight="bold" color="black" />
                    {actionLoading ? 'En cours...' : 'Auto-claim (après deadline + 48h)'}
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
                      <PaperPlaneRight size={18} weight="bold" color="black" />
                      {actionLoading ? 'En cours...' : 'Soumettre la preuve'}
                    </button>
                  </>
                )}

                {statusNum === 3 && isArbiter && (
                  <>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Justification de la décision..."
                        value={resolveJustification}
                        onChange={(e) => setResolveJustification(e.target.value)}
                        style={{ flex: 1, background: '#212121', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '12px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`${styles.btnCancelWhite} gradient-hover-btn`}
                        onClick={() => handleResolve(true)}
                        disabled={actionLoading || !resolveJustification.trim()}
                        style={{ flex: 1 }}
                      >
                        <Gavel size={18} weight="bold" color="black" />
                        {actionLoading ? '...' : 'En faveur du freelancer'}
                      </button>
                      <button
                        className={`${styles.btnCancelWhite} gradient-hover-btn`}
                        onClick={() => handleResolve(false)}
                        disabled={actionLoading || !resolveJustification.trim()}
                        style={{ flex: 1 }}
                      >
                        <Gavel size={18} weight="bold" color="black" />
                        {actionLoading ? '...' : 'En faveur du client'}
                      </button>
                    </div>
                  </>
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
