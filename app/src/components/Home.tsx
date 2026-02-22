'use client'

import React from 'react'
import Navbar from './Navbar'
import CreateEscrow from './CreateEscrow'
import styles from '@/styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.page}>
      <video
        className={styles.backgroundVideo}
        src="/video.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <Navbar />
      <main className={styles.main}>
        <CreateEscrow />
      </main>
    </div>
  )
}
