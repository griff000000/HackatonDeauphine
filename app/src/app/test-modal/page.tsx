'use client';

import React from 'react';
import MagicLinkModal from '@/components/MagicLinkModal';
import Navbar from '@/components/Navbar';
import styles from '@/styles/Home.module.css';

export default function TestModalPage() {
  return (
    <div className={styles.page}>
      <div className={styles.backgroundImage} />
      <Navbar />
      <main className={styles.main}>
        <MagicLinkModal 
          contractId="MLWAJ7YH" 
          onConnectWallet={() => console.log('Connect Wallet clicked')} 
        />
      </main>
    </div>
  );
}
