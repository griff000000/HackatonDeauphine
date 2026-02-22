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

interface NavbarProps {
  userRole?: 'visitor' | 'arbitrator' | 'freelancer' | 'client'
}

export default function Navbar({ userRole = 'visitor' }: NavbarProps) {
  const { connectionStatus, account } = useWallet()
  const isConnected = connectionStatus === 'connected'
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'arbitrator': return 'linear-gradient(135deg, #F5A524 0%, #FFD166 100%)';
      case 'freelancer': return 'linear-gradient(135deg, #F63BE3 0%, #C827ED 100%)';
      case 'client': return 'linear-gradient(135deg, #FF5F4A 0%, #F6A83B 100%)';
      default: return '#A1A1AA';
    }
  }

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
            <div style={{width: '100%', height: '100%', justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'inline-flex'}}>
                <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex'}}>
                    <div 
                      onClick={() => setShowDisconnectDialog(true)}
                      style={{cursor: 'pointer', paddingTop: 8, paddingBottom: 8, paddingLeft: 12, paddingRight: 16, background: '#1A1A1A', overflow: 'hidden', borderRadius: 1024, outline: '1px rgba(255, 255, 255, 0.12) solid', outlineOffset: '-1px', justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'flex'}}>
                        <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex'}}>
                            <div style={{padding: 2.40, position: 'relative', overflow: 'hidden', borderRadius: 14.40, flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 30, display: 'inline-flex'}}>
                                <div style={{width: 16, height: 16, borderRadius: '50%', background: getRoleGradient(userRole)}} />
                            </div>
                            <div style={{color: '#E4E4E7', fontSize: 12, fontFamily: 'Inter', fontWeight: '500', lineHeight: '16px', wordWrap: 'break-word'}}>{truncateAddress(account.address)}</div>
                        </div>
                        <div style={{color: '#555555', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', lineHeight: '20px', wordWrap: 'break-word'}}>Log out</div>
                    </div>
                </div>
            </div>
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
