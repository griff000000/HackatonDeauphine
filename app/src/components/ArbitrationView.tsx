"use client";

import React from "react";
import { motion } from "framer-motion";
import { staggerContainer, itemVariants } from "@/utils/animations";
import styles from "@/styles/ArbitrationView.module.css";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import Navbar from "./Navbar";

import ArcSlider from "./ArcSlider";
import { useState } from "react";

interface ArbitrationViewProps {
  contractId: string;
}

export default function ArbitrationView({ contractId }: ArbitrationViewProps) {
  const [splitAmounts, setSplitAmounts] = useState({ client: 536, freelance: 536 });

  const handleSplitChange = (clientAmount: number, freelanceAmount: number) => {
    setSplitAmounts({ client: clientAmount, freelance: freelanceAmount });
  };

  const handleConfirmSplit = () => {
    console.log("Confirming split:", splitAmounts);
    alert(`Split confirmed!\nClient gets: ${splitAmounts.client} ALPH\nFreelance gets: ${splitAmounts.freelance} ALPH`);
  };

  return (
    <div className={styles.pageContainer}>
      <Navbar userRole="arbitrator" />

      <main className={styles.mainContent}>
        <motion.div 
          className={styles.backButtonContainer}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href={`/contract/${contractId}`} className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Contract
          </Link>
        </motion.div>

        <motion.div 
          className={styles.arbitrationColumn}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {/* Card 1: Header */}
          <motion.div variants={itemVariants} className={styles.headerCard}>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Arbitration : 1072 ALPH at Stake</div>
              <div className={styles.headerSubtitleContainer}>
                <div className={styles.headerSubtitle}>Review the arguments and make your decision.</div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Arguments */}
          <motion.div variants={itemVariants} className={styles.argumentsCard}>
            <div className={styles.argumentsContent}>
              <div className={styles.argumentsHeader}>
                <div className={styles.sectionLabelContainer}>
                  <div className={styles.sectionLabel}>Reason</div>
                </div>
                <div className={styles.reasonTitleContainer}>
                  <div className={styles.reasonTitle}>Deadline not met</div>
                </div>
              </div>
              <div className={styles.argumentBlock}>
                <div className={styles.argumentParticipant}>
                  <div className={styles.clientGradientCircle} />
                  <div className={styles.participantName}>Client's argument</div>
                </div>
                <div className={styles.argumentText}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </div>
              </div>
              <div className={styles.argumentBlock}>
                <div className={styles.argumentParticipant}>
                  <div className={styles.freelanceGradientCircle} />
                  <div className={styles.participantName}>Freelance's response</div>
                </div>
                <div className={styles.argumentText}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Decision Slider */}
          <motion.div variants={itemVariants} className={styles.decisionCard}>
            <div className={styles.decisionTitle}>Your Decision</div>
            
            <div className={styles.decisionContent}>
              <div className={styles.arcSliderWrapper}>
                <ArcSlider 
                  totalAmount={1072} 
                  initialSplit={0.5} 
                  onChange={handleSplitChange} 
                />
              </div>

              <button 
                className={`${styles.confirmButton} gradient-hover-btn`}
                onClick={handleConfirmSplit}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.3334 4L6.00008 11.3333L2.66675 8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Confirm split
              </button>
            </div>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}
