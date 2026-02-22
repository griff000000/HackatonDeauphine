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
            <svg width="87" height="25" viewBox="0 0 1143 330" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_navbar)">
                <path d="M308.973 0.731567H21.0409C9.83267 0.731567 0.731445 9.81816 0.731445 21.0411V308.959C0.731445 320.182 9.83267 329.268 21.0409 329.268H308.973C320.182 329.268 329.283 320.182 329.283 308.959V21.0411C329.283 9.81816 320.182 0.731567 308.973 0.731567ZM289.264 180.547L180.561 289.249C171.972 297.838 158.042 297.838 149.453 289.249L40.7505 180.547C32.1614 171.958 32.1614 158.042 40.7505 149.453L149.453 40.7506C158.042 32.1615 171.972 32.1615 180.561 40.7506L289.264 149.453C297.853 158.042 297.853 171.958 289.264 180.547Z" fill="white" stroke="white" strokeWidth="1.46322" strokeMiterlimit="10"/>
                <path d="M147.99 132.304H182.039C193.086 132.304 202.056 141.274 202.056 152.321V186.37C202.056 197.418 193.086 206.387 182.039 206.387H147.99C136.943 206.387 127.973 197.418 127.973 186.37V152.321C127.973 141.274 136.943 132.304 147.99 132.304Z" fill="white"/>
                <path d="M182.025 133.036C192.662 133.036 201.31 141.684 201.31 152.321V186.37C201.31 197.008 192.662 205.656 182.025 205.656H147.976C137.338 205.656 128.69 197.008 128.69 186.37V152.321C128.69 141.684 137.338 133.036 147.976 133.036H182.025ZM182.025 131.573H147.976C136.518 131.573 127.227 140.864 127.227 152.321V186.37C127.227 197.827 136.518 207.119 147.976 207.119H182.025C193.482 207.119 202.773 197.827 202.773 186.37V152.321C202.773 140.864 193.482 131.573 182.025 131.573Z" fill="white"/>
                <path d="M550.961 87.2956H441.951V65.0254H608.392V87.2956H560.047C545.693 87.2956 538.362 97.2601 538.362 116.604V270.154H511.995V116.604C511.995 99.016 525.179 89.0661 550.975 87.2956H550.961Z" fill="white" stroke="white" strokeWidth="2.92644" strokeMiterlimit="10"/>
                <path d="M628.321 118.945V165.827C630.077 137.689 640.627 115.419 662.019 115.419C668.179 115.419 674.325 116.589 680.485 118.93V142.664C680.485 142.664 673.461 139.152 660.556 139.152C637.408 139.152 628.321 157.033 628.321 174.898V270.139H603.125V118.93H628.321V118.945Z" fill="white" stroke="white" strokeWidth="2.92644" strokeMiterlimit="10"/>
                <path d="M695.117 194.535C695.117 147.361 722.377 115.419 763.976 115.419C805.576 115.419 832.835 147.361 832.835 194.535C832.835 241.709 805.59 273.651 763.976 273.651C722.362 273.651 695.117 241.709 695.117 194.535ZM763.976 251.966C789.173 251.966 807.639 228.525 807.639 194.535C807.639 160.544 789.173 137.103 763.976 137.103C738.78 137.103 720.314 160.544 720.314 194.535C720.314 228.525 738.78 251.966 763.976 251.966Z" fill="white" stroke="white" strokeWidth="2.92644" strokeMiterlimit="10"/>
                <path d="M873.264 118.945L917.805 257.541L962.345 118.945H989.005L936.256 270.154H899.339L846.59 118.945H873.25H873.264Z" fill="white" stroke="white" strokeWidth="2.92644" strokeMiterlimit="10"/>
                <path d="M1072.51 115.419C1115 115.419 1141.37 145.897 1141.37 199.217H1028.85C1030.6 230.574 1048.48 251.966 1072.51 251.966C1090.98 251.966 1105.62 239.661 1112.37 219.732H1138.44C1130.23 252.259 1106.21 273.651 1072.51 273.651C1030.9 273.651 1003.65 241.709 1003.65 194.535C1003.65 147.361 1030.91 115.419 1072.51 115.419ZM1114.71 178.717C1110.03 153.521 1093.61 137.103 1072.51 137.103C1051.41 137.103 1035.01 153.506 1030.31 178.717H1114.71Z" fill="white" stroke="white" strokeWidth="2.92644" strokeMiterlimit="10"/>
              </g>
              <defs>
                <clipPath id="clip0_navbar">
                  <rect width="1142.83" height="330" fill="white"/>
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className={styles.navLinks}>
            <a href="/" className={styles.navLink} style={{ textDecoration: 'none' }}>New escrow</a>
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
                  <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.07603 6.95709C2.07603 6.82033 1.96835 6.7283 1.83573 6.75168L0.240333 7.03295C0.107712 7.05633 3.05176e-05 7.18634 3.05176e-05 7.32308V10.3364C3.05176e-05 10.4731 0.107712 10.5651 0.240333 10.5418L1.83573 10.2605C1.96835 10.2371 2.07603 10.1071 2.07603 9.97035V6.95709Z" fill="black"/>
                    <path d="M6.22789 0.209039C6.22789 0.0722941 6.12021 -0.0197484 5.98757 0.003628L4.39219 0.28491C4.25956 0.308286 4.15189 0.438292 4.15189 0.575048V3.58831C4.15189 3.72507 4.25956 3.8171 4.39219 3.79372L5.98757 3.51245C6.12021 3.48906 6.22789 3.35906 6.22789 3.22231V0.209039Z" fill="black"/>
                    <path d="M2.3354 0.912601C2.2738 0.776942 2.10843 0.68715 1.96633 0.7122L0.256976 1.01357C0.114867 1.03862 0.0495148 1.16909 0.111109 1.30475L3.89162 9.63122C3.95322 9.76688 4.11859 9.85668 4.26069 9.83162L5.97004 9.53026C6.11214 9.50521 6.1775 9.37473 6.11591 9.23907L2.3354 0.912601Z" fill="black"/>
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
