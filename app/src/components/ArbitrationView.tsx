"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { staggerContainer, itemVariants } from "@/utils/animations";
import styles from "@/styles/ArbitrationView.module.css";
import Link from "next/link";
import { ArrowLeft, Gavel, ShieldCheck } from "@phosphor-icons/react";
import { useWallet } from "@alephium/web3-react";
import { AlephiumConnectButton } from "@alephium/web3-react";
import { hexToString, stringToHex, DUST_AMOUNT } from "@alephium/web3";
import { Escrow, ResolveDispute } from "my-contracts";
import { ARBITER_ADDRESS, initWeb3 } from "@/utils/alephium";
import Navbar from "./Navbar";
import ArcSlider from "./ArcSlider";
import ParticipantOrb from "./ParticipantOrb";

interface ArbitrationViewProps {
  contractId: string;
}

interface EscrowData {
  client: string;
  freelancer: string;
  arbiter: string;
  amount: bigint;
  collateral: bigint;
  status: bigint;
  disputeReason: string;
  disputeEvidence: string;
  disputeJustification: string;
}

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 10)}...${address.slice(-5)}`;
}

function formatAlph(attoAlph: bigint): string {
  const alph = Number(attoAlph) / 1e18;
  return alph.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function ArbitrationView({ contractId }: ArbitrationViewProps) {
  const { connectionStatus, signer, account } = useWallet();
  const isConnected = connectionStatus === "connected";
  const userAddress = account?.address || "";

  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [splitAmounts, setSplitAmounts] = useState({ client: 0, freelance: 0, clientPercent: 50, freelancePercent: 50 });

  // Check against both the hardcoded address AND the on-chain arbiter (handles groupless wallet)
  const isArbiter = userAddress === ARBITER_ADDRESS || (escrowData ? escrowData.arbiter === userAddress : false);

  console.log('[Arbitration] isConnected:', isConnected, 'userAddress:', userAddress, 'isArbiter:', isArbiter, 'onChainArbiter:', escrowData?.arbiter);

  const fetchContract = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      initWeb3();

      const escrow = Escrow.at(contractId);
      const state = await escrow.fetchState();
      const f = state.fields;
      const stripGroup = (addr: string) =>
        addr.includes(":") ? addr.split(":")[0] : addr;

      setEscrowData({
        client: stripGroup(f.client as string),
        freelancer: stripGroup(f.freelancer as string),
        arbiter: stripGroup(f.arbiter as string),
        amount: f.amount as bigint,
        collateral: f.collateral as bigint,
        status: f.status as bigint,
        disputeReason: hexToString(f.disputeReason as string),
        disputeEvidence: hexToString(f.disputeEvidence as string),
        disputeJustification: hexToString(f.disputeJustification as string),
      });
    } catch (err: any) {
      console.error("Failed to fetch contract:", err);
      setError("Contract not found or network error.");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  useEffect(() => {
    if (escrowData && userAddress) {
      console.log('[Arbitration] On-chain arbiter:', escrowData.arbiter);
      console.log('[Arbitration] Connected wallet:', userAddress);
      console.log('[Arbitration] Match?', escrowData.arbiter === userAddress);
      console.log('[Arbitration] Contract status:', Number(escrowData.status));
    }
  }, [escrowData, userAddress]);

  const handleSplitChange = useCallback((clientAmount: number, freelanceAmount: number, clientPercent: number, freelancePercent: number) => {
    setSplitAmounts({ client: clientAmount, freelance: freelanceAmount, clientPercent, freelancePercent });
  }, []);

  const handleResolve = async () => {
    if (!signer || !justification.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const freelancerPercent = BigInt(splitAmounts.freelancePercent);
      console.log('[Resolve] Params:', {
        escrow: contractId,
        freelancerPercent: freelancerPercent.toString(),
        justification: justification,
        justificationHex: stringToHex(justification),
      });
      await ResolveDispute.execute({
        signer,
        initialFields: {
          escrow: contractId,
          freelancerPercent,
          justification: stringToHex(justification),
        },
        attoAlphAmount: DUST_AMOUNT,
      });
      setResolved(true);
      setTimeout(() => fetchContract(), 3000);
    } catch (err: any) {
      console.error("Resolve failed:", err);
      console.error("Resolve error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
      const msg = err?.message || err?.detail || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const totalAlph = escrowData
    ? Number(escrowData.amount + escrowData.collateral) / 1e18
    : 0;
  const totalAtStake = escrowData
    ? formatAlph(escrowData.amount + escrowData.collateral)
    : "...";
  const statusNum = escrowData ? Number(escrowData.status) : -1;

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
            Back to contract
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
              {loading ? (
                <div className={styles.headerTitle}>Loading...</div>
              ) : error ? (
                <div className={styles.headerTitle} style={{ color: "#ef4444" }}>
                  {error}
                </div>
              ) : (
                <>
                  <div className={styles.headerTitle}>
                    Arbitration: {totalAtStake} ALPH at stake
                  </div>
                  <div className={styles.headerSubtitleContainer}>
                    <div className={styles.headerSubtitle}>
                      {statusNum === 3
                        ? "Review the arguments and decide on the split."
                        : statusNum === 4
                        ? "This dispute has been resolved."
                        : "This contract is not in dispute."}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {escrowData && statusNum >= 3 && (
            <>
              {/* Card 2: Arguments */}
              <motion.div variants={itemVariants} className={styles.argumentsCard}>
                <div className={styles.argumentsContent}>
                  <div className={styles.argumentsHeader}>
                    <div className={styles.sectionLabelContainer}>
                      <div className={styles.sectionLabel}>Dispute reason</div>
                    </div>
                    <div className={styles.reasonTitleContainer}>
                      <div className={styles.reasonTitle}>
                        {escrowData.disputeReason || "No reason provided"}
                      </div>
                    </div>
                  </div>
                  <div className={styles.argumentBlock}>
                    <div className={styles.argumentParticipant}>
                      <ParticipantOrb role="client" />
                      <div className={styles.participantName}>
                        Client · {truncateAddress(escrowData.client)}
                      </div>
                    </div>
                    <div className={styles.argumentText}>
                      {escrowData.disputeReason || "No argument yet."}
                    </div>
                  </div>
                  <div className={styles.argumentBlock}>
                    <div className={styles.argumentParticipant}>
                      <ParticipantOrb role="freelancer" />
                      <div className={styles.participantName}>
                        Freelancer · {truncateAddress(escrowData.freelancer)}
                      </div>
                    </div>
                    <div className={styles.argumentText}>
                      {escrowData.disputeEvidence || "No response yet."}
                    </div>
                  </div>

                  {escrowData.disputeJustification && (
                    <div className={styles.argumentBlock}>
                      <div className={styles.argumentParticipant}>
                        <Gavel size={16} color="#4AEDC4" />
                        <div className={styles.participantName} style={{ color: "#4AEDC4" }}>
                          Arbiter's decision
                        </div>
                      </div>
                      <div className={styles.argumentText} style={{ color: "#4AEDC4" }}>
                        {escrowData.disputeJustification}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Card 3: Decision with ArcSlider */}
              {statusNum === 3 && (
                <motion.div variants={itemVariants} className={styles.decisionCard}>
                  <div className={styles.decisionTitle}>Your Decision</div>
                  <div className={styles.decisionContent}>
                    {!isConnected ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", width: "100%" }}>
                        <p style={{ color: "#888", fontSize: "13px", textAlign: "center" }}>
                          Connect your wallet via the navbar to arbitrate this dispute.
                        </p>
                      </div>
                    ) : !isArbiter ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px", width: "100%" }}>
                        <ShieldCheck size={32} color="#ef4444" />
                        <p style={{ color: "#ef4444", fontSize: "13px", textAlign: "center" }}>
                          Only the whitelisted arbiter address can make a decision.
                        </p>
                        <p style={{ color: "#555", fontSize: "11px", fontFamily: "monospace" }}>
                          {truncateAddress(ARBITER_ADDRESS)}
                        </p>
                      </div>
                    ) : resolved ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        <Gavel size={32} color="#4AEDC4" />
                        <p style={{ color: "#4AEDC4", fontSize: "14px", fontWeight: 600 }}>
                          Dispute resolved successfully!
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className={styles.arcSliderWrapper}>
                          <ArcSlider
                            totalAmount={Math.round(totalAlph)}
                            initialSplit={0.5}
                            onChange={handleSplitChange}
                          />
                        </div>

                        <textarea
                          placeholder="Justification for your decision..."
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          rows={3}
                          style={{
                            width: "100%",
                            background: "#212121",
                            border: "1px solid rgba(255,255,255,0.12)",
                            borderRadius: "8px",
                            padding: "12px",
                            color: "white",
                            fontSize: "13px",
                            resize: "none",
                            fontFamily: "inherit",
                            marginTop: "12px",
                          }}
                        />

                        {actionError && (
                          <p style={{ color: "#ef4444", fontSize: "12px", textAlign: "center", marginTop: "8px" }}>
                            {actionError}
                          </p>
                        )}

                        <button
                          className={`${styles.confirmButton} gradient-hover-btn`}
                          onClick={handleResolve}
                          disabled={actionLoading || !justification.trim()}
                          style={{ marginTop: "12px" }}
                        >
                          <Gavel size={16} weight="bold" color="black" />
                          {actionLoading
                            ? "Transaction in progress..."
                            : `Confirm split (${splitAmounts.freelancePercent}% freelancer / ${splitAmounts.clientPercent}% client)`}
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
