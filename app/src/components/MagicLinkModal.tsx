import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Info } from '@phosphor-icons/react';
import styles from '@/styles/MagicLinkModal.module.css';
import Image from 'next/image';

interface MagicLinkModalProps {
  contractId: string;
  onConnectWallet: () => void;
}

export default function MagicLinkModal({ contractId, onConnectWallet }: MagicLinkModalProps) {
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 30,
        delay: 0.1
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
    visible: { 
      opacity: 1, 
      backdropFilter: 'blur(8px)',
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className={styles.modalOverlay}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className={styles.modalContainer}
        variants={modalVariants}
      >
        {/* Top Badge */}
        <div className={styles.badgeContainer}>
          <div className={styles.iconWrapper}>
            <div className={styles.glowEffect} />
            <div className={styles.iconInner}>
              {/* Handshake/Contract Icon SVG */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.25 15.75L21.75 11.25L17.25 6.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6.75 8.25L2.25 12.75L6.75 17.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14.25 5.25L9.75 18.75" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <span className={styles.badgeText}>Escrow Contract</span>
        </div>

        {/* Main Card */}
        <div className={styles.mainCard}>
          
          {/* Header */}
          <div className={styles.headerSection}>
            <h2 className={styles.title}>You&apos;ve been invited to an escrow</h2>
            <p className={styles.subtitle}>
              Connect your Alephium wallet to access the contract and interact with this escrow.
            </p>
          </div>

          {/* Contract Details Box */}
          <div className={styles.detailsBox}>
            <span className={styles.contractId}>#ESC-{contractId}</span>
            <h3 className={styles.contractName}>Refonte UI/UX Dashboard blockflow visualisation</h3>
            
            <div className={styles.infoList}>
              {/* Amount Row */}
              <div className={styles.infoRow}>
                <span className={styles.rowLabel}>Amount</span>
                <div className={styles.rowValueContainer}>
                  <span className={styles.rowValue}>500</span>
                  <div className={styles.alphIconContainer}>
                    <Image src="/alephium-icon.svg" alt="ALPH" width={14} height={14} />
                  </div>
                </div>
              </div>

              {/* Client Row */}
              <div className={styles.infoRow}>
                <span className={styles.rowLabel}>Client</span>
                <div className={styles.rowValueContainer}>
                  <span className={styles.rowValue}>1Bhp2vSHrT...QNSwW (vous)</span>
                  <Copy size={14} color="#555555" className={styles.copyIcon} />
                </div>
              </div>

              {/* Deadline Row */}
              <div className={styles.infoRowLast}>
                <span className={styles.rowLabel}>Deadline</span>
                <div className={styles.rowValueContainer}>
                  <span className={styles.rowValue}>17/02/2026</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alert Message */}
          <div className={styles.alertBox}>
            <div className={styles.alertContent}>
              <Info size={20} color="#555555" />
              <p className={styles.alertText}>
                Funds are already locked in the smart contract. Connect your wallet to review the details and accept the mission.
              </p>
            </div>
          </div>

          {/* Action Area */}
          <div className={styles.actionArea}>
            <button className={styles.connectWalletBtn} onClick={onConnectWallet}>
              Connect Wallet
              {/* Alephium Logo Black */}
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 19H22L12 2Z" fill="black"/>
               </svg>
            </button>
            <div className={styles.footerLink}>
              <span className={styles.footerText}>No wallet?&nbsp;</span>
              <a href="https://alephium.org/wallets" target="_blank" rel="noopener noreferrer" className={styles.footerLinkBold}>
                Create an Alephium wallet →
              </a>
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
}
