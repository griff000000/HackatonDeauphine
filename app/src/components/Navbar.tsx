'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@alephium/web3-react'
import { AlephiumConnectButton } from '@alephium/web3-react'
import styles from '@/styles/Navbar.module.css'
import { navbarVariants } from '@/utils/animations'

function truncateAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function Navbar() {
  const { connectionStatus, account } = useWallet()
  const isConnected = connectionStatus === 'connected'
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  useEffect(() => {
    if (showDisconnectDialog) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showDisconnectDialog])

  return (
    <>
      <motion.nav
        className={styles.navbar}
        variants={navbarVariants}
        initial="hidden"
        animate="show"
      >
        <div className={styles.left}>
          <div className={styles.logo}>
            <svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12.5" cy="12.5" r="12.5" fill="url(#logo_gradient)" />
              <path d="M8 8h4v4H8V8zm5 5h4v4h-4v-4zm-5 0h4v4H8v-4z" fill="white" fillOpacity="0.9" />
              <defs>
                <linearGradient id="logo_gradient" x1="0" y1="0" x2="25" y2="25">
                  <stop stopColor="#4AEDC4" />
                  <stop offset="1" stopColor="#2196F3" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>Konvrtr</span>
          </div>
          <div className={styles.navLinks}>
            <span className={styles.navLink}>Overview</span>
            <span className={styles.navLink}>
              Ressources
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className={styles.chevron}>
                <path d="M1 1L4 4L7 1" stroke="#9e9e9e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
        </div>
        <div className={styles.right}>
          {isConnected && account ? (
            <button
              className={`${styles.connectButton} ${styles.connectedButton}`}
              onClick={() => setShowDisconnectDialog(true)}
              title="Click to disconnect"
            >
              <span className={styles.connectedDot} />
              <span>{truncateAddress(account.address)}</span>
            </button>
          ) : (
            <AlephiumConnectButton.Custom>
              {({ show }) => (
                <button className={`${styles.connectButton} gradient-hover-btn`} onClick={show}>
                  <span>Connect Wallet</span>
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0.5L5.5 7L0 13.5" stroke="black" strokeWidth="1.5"/>
                    <path d="M4.5 0.5L10 7L4.5 13.5" stroke="black" strokeWidth="1.5"/>
                  </svg>
                </button>
              )}
            </AlephiumConnectButton.Custom>
          )}
        </div>
      </motion.nav>

      <AnimatePresence>
        {showDisconnectDialog && (
          <AlephiumConnectButton.Custom>
            {({ disconnect }) => (
              <motion.div
                className={styles.dialogOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => setShowDisconnectDialog(false)}
              >
                <motion.div
                  className={styles.dialogContent}
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={styles.dialogHeader}>
                    <h3 className={styles.dialogTitle}>Déconnexion</h3>
                    <p className={styles.dialogDescription}>
                      Veux-tu vraiment te déconnecter ?
                    </p>
                  </div>
                  <div className={styles.dialogFooter}>
                    <button
                      className={styles.dialogBtnCancel}
                      onClick={() => setShowDisconnectDialog(false)}
                    >
                      Annuler
                    </button>
                    <button
                      className={styles.dialogBtnConfirm}
                      onClick={() => {
                        disconnect()
                        setShowDisconnectDialog(false)
                      }}
                    >
                      Se déconnecter
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AlephiumConnectButton.Custom>
        )}
      </AnimatePresence>
    </>
  )
}
