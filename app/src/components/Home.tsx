'use client'

import React from 'react'
import Navbar from './Navbar'
import CreateEscrow from './CreateEscrow'
import styles from '@/styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.backgroundImage} />
      <Navbar />
      <main className={styles.main}>
        <CreateEscrow />
      </main>
    </div>
  )
}
