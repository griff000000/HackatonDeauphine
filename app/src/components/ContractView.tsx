import React, { useRef, useEffect, useState } from 'react'
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
  ArrowCircleDown
} from '@phosphor-icons/react'
import styles from '@/styles/ContractView.module.css'
import Navbar from './Navbar'

interface ContractViewProps {
  contractId: string;
}

export default function ContractView({ contractId }: ContractViewProps) {
  const [isCopied, setIsCopied] = useState(false)
  const [magicLinkUrl, setMagicLinkUrl] = useState('')
  const constraintsRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)

  useEffect(() => {
    // Set the URL only on the client side to avoid hydration mismatch
    setMagicLinkUrl(typeof window !== 'undefined' ? window.location.href : '')
  }, [])

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

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Timeline appears while main card is still animating (0.15s overlap)
      },
    },
  };

  const staggerRight = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // Faster stagger for right column elements so they overlap each other closely
        delayChildren: 0.15, // Right column starts exactly when the Timeline appears (0.15s)
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, filter: "blur(12px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring" as const,
        stiffness: 120, // Slower, premium elegant entry
        damping: 20, 
      },
    },
  };

  // Wait for render and center the selected date (Feb 17, 2026)
  useEffect(() => {
    setTimeout(() => {
      if (!constraintsRef.current || !innerRef.current) return;
      const targetChip = innerRef.current.querySelector<HTMLButtonElement>(`[data-date="2026-1-17"]`);
      if (targetChip) {
        const containerWidth = constraintsRef.current.offsetWidth;
        const innerWidth = innerRef.current.scrollWidth;
        const containerCenter = containerWidth / 2;
        const targetCenter = targetChip.offsetLeft + (targetChip.offsetWidth / 2);
        
        let targetX = containerCenter - targetCenter;
        const maxDrag = containerWidth - innerWidth;
        // Apply bounds constraints to align precisely
        targetX = Math.max(maxDrag, Math.min(0, targetX));

        animate(x, targetX, { type: "spring", stiffness: 300, damping: 30 });
      }
    }, 100);
  }, [x]);

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
                  <div className={styles.statusIconSpinner} />
                  <span className={styles.statusTextDark}>En attente de caution</span>
                </div>
                <span className={styles.contractIdDark}>#ESC-MLWAJ7YH</span>
              </div>

              <div className={styles.mainCardContent}>
                <h1 className={styles.projectTitleDark}>Refonte UI/UX Dashboard blockflow visualisation</h1>

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
                        <span className={styles.amountPrimaryDark}>45000 + 450</span>
                      </div>
                      <div className={styles.amountValuesColInner}>
                        <span className={styles.amountSecondaryDark}>1248 $ + 12.48 $</span>
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
                        <span className={styles.amountPrimaryDark}>45450</span>
                      </div>
                      <div className={styles.amountValuesColInner}>
                        <span className={styles.amountSecondaryDark}>1260.48 $</span>
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
                    </div>
                    <span className={styles.stakeholderAddressDark}>1Bhp2vSHrT...QNSwW</span>
                  </div>

                  <div className={styles.stakeholderRowDark}>
                    <div className={styles.stakeholderLeftDark}>
                       <div className={styles.stakeholderAvatarFreelance} />
                       <span className={styles.stakeholderRoleDark}>Freelance</span>
                       <span className={styles.trustScoreMuted}>Trust score - 84</span>
                    </div>
                    <span className={styles.stakeholderAddressDark}>1Bhp2vSHrT...DVRxF</span>
                  </div>

                  <div className={styles.stakeholderRowDark}>
                    <div className={styles.stakeholderLeftDark}>
                       <div className={styles.stakeholderAvatarArbitre} />
                       <span className={styles.stakeholderRoleDark}>Arbitre</span>
                    </div>
                    <span className={styles.stakeholderAddressDark}>1Bhp2vSHrT...LNThK</span>
                  </div>
                </div>

                {/* Deadline */}
                <div className={styles.deadlineSectionDark}>
                   <span className={styles.deadlineLabelDark}>Deadline</span>
                   <div className={styles.deadlineMonthYear}>
                     <span className={styles.deadlineMonthText}>February</span>
                     <span className={styles.deadlineYearText}>2026</span>
                     <div style={{marginLeft: 'auto', display: 'flex', gap: '8px', cursor: 'pointer'}}>
                       <CaretLeft size={16} color="#555555" />
                       <CaretRight size={16} color="#555555" />
                     </div>
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
                          const dateObj = new Date(2026, 1, 1) // Base offset to start from array
                          dateObj.setDate(1 + index)
                          const dayOfMonth = dateObj.getDate()
                          const month = dateObj.getMonth()
                          const year = dateObj.getFullYear()
                          const isSelected = dayOfMonth === 17 && month === 1 && year === 2026

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

              </div>
            </motion.div>

            {/* Card 2: Timeline */}
            <motion.div className={styles.card} variants={itemVariants}>
              <h3 className={styles.cardTitle}>Timeline</h3>
              
              <div className={styles.timelineContainerDark}>
                
                {/* Step 1: Created */}
                <div className={styles.timelineItemDark}>
                  <div className={styles.timelineIconContainer}>
                    <div className={styles.timelineIconBlueGradient}>
                      <Plus size={16} color="white" weight="bold" />
                    </div>
                  </div>
                  <div className={styles.timelineContentDark}>
                    <span className={styles.timelineEventTitleDark}>Escrow créé</span>
                    <span className={styles.timelineDateDark}>21 févr. à 15:32</span>
                  </div>
                </div>

                {/* Step 2: Deposited */}
                <div className={styles.timelineItemDark}>
                  <div className={styles.timelineIconContainer}>
                    <div className={styles.timelineIconBlueGradient}>
                      <ArrowCircleDown size={18} color="white" weight="regular" />
                    </div>
                  </div>
                  <div className={styles.timelineContentDark}>
                    <span className={styles.timelineEventTitleDark}>500 ALPH déposés</span>
                    <div className={styles.timelineDateRow}>
                      <span className={styles.timelineDateDark}>21 févr. à 15:32</span>
                      <span className={styles.timelineTxHash}>Tx: 0xa1b2c3d4e5f6...</span>
                    </div>
                  </div>
                </div>

                {/* Step 3: Accepted */}
                <div className={styles.timelineItemDarkLast}>
                  <div className={styles.timelineIconContainerLast}>
                    <div className={styles.timelineIconGreenGradient}>
                      <Check size={14} weight="bold" color="white" />
                    </div>
                  </div>
                  <div className={styles.timelineContentDark}>
                    <span className={styles.timelineEventTitleDark}>Mission acceptée</span>
                    <span className={styles.timelineDateDark}>21 févr. à 16:01</span>
                  </div>
                </div>

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

            {/* Card 2: Status & Cancel */}
            <motion.div className={styles.card} variants={itemVariants}>
              <div className={styles.actionTopArea}>
                <div className={styles.statusPillDark}>
                  <div className={styles.statusIconSpinner} />
                  <span className={styles.statusTextDark}>En attente de caution</span>
                </div>
                <p className={styles.actionSubtitle}>Le freelance doit déposer 450 ALPH pour activer le contrat.</p>
              </div>

              <button className={`${styles.btnCancelWhite} gradient-hover-btn`}>
                <XCircle size={18} weight="bold" color="black" />
                Cancel & Withdraw
              </button>
            </motion.div>

            {/* Card 3: Informations du contrat */}
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
                    <span className={styles.infoValueDark}>45000 ALPH</span>
                  </div>
                </div>

                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Client</span>
                  </div>
                  <div className={styles.infoValueContainerWithIcon}>
                    <span className={styles.infoValueMuted}>1Bhp2vSHrT...QNSwW (vous)</span>
                    <Copy size={14} color="#555555" />
                  </div>
                </div>

                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Freelance</span>
                  </div>
                  <div className={styles.infoValueContainerWithIcon}>
                    <span className={styles.infoValueMuted}>1Bhp2vSHrT...QNSwW</span>
                    <Copy size={14} color="#555555" />
                  </div>
                </div>

                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Arbitre</span>
                  </div>
                  <div className={styles.infoValueContainerWithIcon}>
                    <span className={styles.infoValueMuted}>1Bhp2vSHrT...QNSwW</span>
                    <Copy size={14} color="#555555" />
                  </div>
                </div>

                <div className={styles.infoRowDark}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Deadline</span>
                  </div>
                  <div className={styles.infoValueContainer}>
                    <span className={styles.infoValueMuted}>17/02/2026</span>
                  </div>
                </div>

                <div className={styles.infoRowDarkLast}>
                  <div className={styles.infoLabelContainer}>
                    <span className={styles.infoLabelDark}>Frais</span>
                  </div>
                  <div className={styles.infoValueContainer}>
                    <span className={styles.infoValueMuted}>2.50 ALPH (0.5%)</span>
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
