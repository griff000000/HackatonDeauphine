'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion'
import { UploadSimple, FilePdf, FileImage, FileDoc, File as FileIcon, X, Copy, ArrowRight } from '@phosphor-icons/react'
import { useRouter } from 'next/navigation'
import { useWallet, AlephiumConnectButton } from '@alephium/web3-react'
import { ONE_ALPH, DUST_AMOUNT, stringToHex, addressFromContractId } from '@alephium/web3'
import { Escrow, TrustRegistry } from 'my-contracts'
import { getTrustRegistryAddress, getTrustRegistryId, ARBITER_ADDRESS } from '@/utils/alephium'
import styles from '@/styles/CreateEscrow.module.css'
import { staggerContainer, itemVariants } from '@/utils/animations'
import { style } from 'framer-motion/client'

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate()
}

const getMonthName = (month: number) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return months[month]
}

export default function CreateEscrow() {
  const router = useRouter()
  const { connectionStatus, signer, account } = useWallet()
  const isConnected = connectionStatus === 'connected'

  const [projectName, setProjectName] = useState('')
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')

  // Date states
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    return { month: d.getMonth(), year: d.getFullYear() }
  })
  const TODAY = new Date().getDate()
  const [selectedDay, setSelectedDay] = useState(TODAY)
  const [monthDirection, setMonthDirection] = useState(1)

  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState<'form' | 'loading' | 'success'>('form')
  const [txError, setTxError] = useState<string | null>(null)

  const [deployedContractId, setDeployedContractId] = useState<string>('')
  const [deployedContractAddress, setDeployedContractAddress] = useState<string>('')

  // Ref for the drag container
  const constraintsRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)

  // File Upload State
  type FileState = {
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
  } | null

  const [uploadedFile, setUploadedFile] = useState<FileState>(null)
  const [ipfsHash, setIpfsHash] = useState<string>('')

  const centerSelectedDate = (month: number, year: number, day: number) => {
    setTimeout(() => {
      if (!constraintsRef.current || !innerRef.current) return;
      const targetChip = innerRef.current.querySelector<HTMLButtonElement>(`[data-date="${year}-${month}-${day}"]`);
      if (targetChip) {
        const containerWidth = constraintsRef.current.offsetWidth;
        const innerWidth = innerRef.current.scrollWidth;
        const containerCenter = containerWidth / 2;
        const targetCenter = targetChip.offsetLeft + (targetChip.offsetWidth / 2);

        let targetX = containerCenter - targetCenter;
        const maxDrag = containerWidth - innerWidth;
        targetX = Math.max(maxDrag, Math.min(0, targetX));

        animate(x, targetX, { type: "spring", stiffness: 300, damping: 30 });
      }
    }, 10);
  };

  // File upload handlers
  const isValidFileType = (file: File) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/jpg'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
    return validTypes.includes(file.type) || (extension && validExtensions.includes(extension));
  }

  const performRealUpload = async (file: File) => {
    setUploadedFile({ file, progress: 0, status: 'uploading' })

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use a small trick to simulate progress since fetch doesn't support it directly
      // but for small files it's almost instant anyway.
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setIpfsHash(data.cid)
      setUploadedFile({ file, progress: 100, status: 'success' })
    } catch (error) {
      console.error('IPFS upload error:', error)
      setUploadedFile({ file, progress: 0, status: 'error' })
    }
  }

  const handleDragFile = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        performRealUpload(file);
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFileType(file)) {
        performRealUpload(file);
      }
    }
  }

  const handleDeleteFile = () => {
    setUploadedFile(null)
    setIpfsHash('')
  }

  const handlePrevMonth = () => {
    setMonthDirection(-1)
    setCurrentDate((prev) => {
      let newMonth = prev.month - 1
      let newYear = prev.year
      if (newMonth < 0) {
        newMonth = 11
        newYear -= 1
      }
      centerSelectedDate(newMonth, newYear, 1);
      return { month: newMonth, year: newYear }
    })
    setSelectedDay(1)
  }

  const handleNextMonth = () => {
    setMonthDirection(1)
    setCurrentDate((prev) => {
      let newMonth = prev.month + 1
      let newYear = prev.year
      if (newMonth > 11) {
        newMonth = 0
        newYear += 1
      }
      centerSelectedDate(newMonth, newYear, 1);
      return { month: newMonth, year: newYear }
    })
    setSelectedDay(1)
  }

  const daysInMonth = getDaysInMonth(currentDate.month, currentDate.year)

  // Spring animation transition
  const springConfig = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30
  }

  // Parse amount for display
  const numericAmount = parseFloat(amount) || 0
  const usdValue = (numericAmount * 3.50).toFixed(2)

  // Validate Recipient Address
  const isAddressValid = recipientAddress.length >= 40 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(recipientAddress)
  const showAddressError = recipientAddress.length > 0 && !isAddressValid

  const isFormComplete =
    projectName.trim().length > 0 &&
    numericAmount > 0 &&
    isAddressValid &&
    selectedDay > 0 &&
    uploadedFile?.status === 'success' && ipfsHash !== ''

  const handleConfirm = async () => {
    if (!signer || !account) return

    setStatus('loading')
    setTxError(null)

    try {
      const deadlineDate = new Date(currentDate.year, currentDate.month, selectedDay, 23, 59, 59)
      const deadlineTimestamp = BigInt(deadlineDate.getTime())

      const amountAtto = BigInt(Math.round(numericAmount * 1e18))

      const registryAddress = getTrustRegistryAddress()
      console.log('[1] TrustRegistry address:', registryAddress)
      const registryInstance = TrustRegistry.at(registryAddress)
      console.log('[2] Calling calculateCollateral...')
      const collateralResult = await registryInstance.view.calculateCollateral({
        args: {
          baseCollateral: amountAtto,
          freelancer: recipientAddress
        }
      })
      const collateralAtto = collateralResult.returns
      console.log('[3] Collateral:', collateralAtto.toString())

      const cdcHash = stringToHex(ipfsHash || projectName)

      const arbiterAddress = ARBITER_ADDRESS

      const trustRegistryId = getTrustRegistryId()
      console.log('[4] TrustRegistry ID:', trustRegistryId)

      const deployParams = {
        initialFields: {
          client: account.address,
          freelancer: recipientAddress,
          arbiter: arbiterAddress,
          amount: amountAtto,
          collateral: collateralAtto,
          deadline: deadlineTimestamp,
          cdcHash: cdcHash,
          trustRegistry: trustRegistryId,
          deliverableLink: stringToHex(''),
          status: 0n,
          disputeReason: stringToHex(''),
          disputeEvidence: stringToHex(''),
          disputeJustification: stringToHex('')
        },
        initialAttoAlphAmount: amountAtto + ONE_ALPH
      }
      console.log('[5] Building tx params...')
      const txParams = await Escrow.contract.txParamsForDeployment(signer, deployParams, 0)
      console.log('[6] Tx params built, signing...')
      const deployResult = await signer.signAndSubmitDeployContractTx(txParams)
      console.log('[7] Deploy result:', JSON.stringify(deployResult, null, 2))

      let contractAddress = ''
      let contractId = ''

      if (Array.isArray(deployResult)) {
        // Groupless wallet: array of [{type:"TRANSFER",result:...}, {type:"DEPLOY_CONTRACT",result:{contractAddress, contractId}}]
        const deployEntry = deployResult.find((e: any) => e.type === 'DEPLOY_CONTRACT')
        if (!deployEntry) throw new Error('No DEPLOY_CONTRACT entry in result array')
        contractAddress = deployEntry.result?.contractAddress || ''
        contractId = deployEntry.result?.contractId || ''
      } else {
        // Standard wallet: direct object with contractAddress, contractId
        contractAddress = (deployResult as any).contractAddress || ''
        contractId = (deployResult as any).contractId || ''
      }

      // Fallback: derive address from contractId if needed
      if (!contractAddress && contractId) {
        contractAddress = addressFromContractId(contractId)
      }

      console.log('[8] Contract ID:', contractId)
      console.log('[9] Contract Address:', contractAddress)

      if (!contractAddress) {
        throw new Error('Could not extract contract address from deploy result')
      }

      setDeployedContractId(contractId)
      setDeployedContractAddress(contractAddress)
      setStatus('success')
    } catch (err: any) {
      console.error('Deploy escrow failed:', err)
      setTxError(err?.message || 'Transaction failed')
      setStatus('form')
    }
  }

  const magicLink = deployedContractAddress
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/contract/${deployedContractAddress}`
    : ''

  const handleCopyLink = async () => {
    if (magicLink) {
      await navigator.clipboard.writeText(magicLink)
    }
  }

  return (
    <motion.div layout className={styles.wrapper} variants={staggerContainer} initial="hidden" animate="show">
      {/* Header pill */}
      <motion.div layout transition={{ layout: { duration: 0.6, ease: [0.25, 1, 0.5, 1] } }} className={styles.headerPill} variants={itemVariants}>
        <AnimatePresence>
          <motion.div layout style={{ display: 'grid', alignItems: 'center', justifyItems: 'start' }}>
            {status === 'form' && (
              <motion.div
                key="formPill"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xxsm)', whiteSpace: 'nowrap' }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="16" fill="url(#headerGrad)" />
                  <g transform="translate(4, 4)">
                    <path d="M18 18.75V21" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 18.75V21" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20.25 4.5H3.75C3.33579 4.5 3 4.83579 3 5.25V18C3 18.4142 3.33579 18.75 3.75 18.75H20.25C20.6642 18.75 21 18.4142 21 18V5.25C21 4.83579 20.6642 4.5 20.25 4.5Z" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.875 11.625H21" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.875 14.625C15.5319 14.625 16.875 13.2819 16.875 11.625C16.875 9.96815 15.5319 8.625 13.875 8.625C12.2181 8.625 10.875 9.96815 10.875 11.625C10.875 13.2819 12.2181 14.625 13.875 14.625Z" stroke="white" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <defs>
                    <linearGradient id="headerGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#F97316" />
                      <stop offset="1" stopColor="#EF4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <p className={styles.headerText}>Create Escrow Contract</p>
              </motion.div>
            )}

            {status === 'loading' && (
              <motion.div
                key="loadingPill"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xxsm)', whiteSpace: 'nowrap' }}
              >
                <svg className={styles.spinningLoader} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="url(#loaderBgGrad)" />
                  <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.5" strokeDasharray="30" strokeDashoffset="0" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="loaderBgGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EAB308" />
                      <stop offset="1" stopColor="#84CC16" />
                    </linearGradient>
                  </defs>
                </svg>
                <p className={styles.headerText}>
                  Transaction in progress<span className={styles.loadingDots}></span>
                </p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="successPill"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                style={{ gridArea: '1 / 1', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xxsm)', whiteSpace: 'nowrap' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="url(#successGrad)" />
                  <path d="M7 12.5L10.5 16L17 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="successGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EAB308" />
                      <stop offset="1" stopColor="#84CC16" />
                    </linearGradient>
                  </defs>
                </svg>
                <p className={styles.headerText}>Funds locked!</p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Main card */}
      <AnimatePresence>
        {status === 'form' && (
          <motion.div
            key="formCardWrapper"
            initial={{ height: 'auto' }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
            transition={{ duration: 0.5, delay: 0.25, ease: [0.25, 1, 0.5, 1] }}
          >
            <motion.div
              className={styles.card}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
            >
              <div className={styles.formFields}>
                {/* Project Name */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Project Name</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="e.g.: Mobile App UI/UX Redesign"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                </div>

                {/* ALPH Amount */}
                <div className={styles.amountCard}>
                  <div className={styles.tokenBadge}>
                    <div className={styles.tokenIcon}>
                      <svg width="7" height="11" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M2.07603 6.95709C2.07603 6.82033 1.96835 6.7283 1.83573 6.75168L0.240333 7.03295C0.107712 7.05633 3.05176e-05 7.18634 3.05176e-05 7.32308V10.3364C3.05176e-05 10.4731 0.107712 10.5651 0.240333 10.5418L1.83573 10.2605C1.96835 10.2371 2.07603 10.1071 2.07603 9.97035V6.95709Z" fill="white" />
                        <path d="M6.22789 0.209039C6.22789 0.0722941 6.12021 -0.0197484 5.98757 0.003628L4.39219 0.28491C4.25956 0.308286 4.15189 0.438292 4.15189 0.575048V3.58831C4.15189 3.72507 4.25956 3.8171 4.39219 3.79372L5.98757 3.51245C6.12021 3.48906 6.22789 3.35906 6.22789 3.22231V0.209039Z" fill="white" />
                        <path d="M2.3354 0.912601C2.2738 0.776942 2.10843 0.68715 1.96633 0.7122L0.256976 1.01357C0.114867 1.03862 0.0495148 1.16909 0.111109 1.30475L3.89162 9.63122C3.95322 9.76688 4.11859 9.85668 4.26069 9.83162L5.97004 9.53026C6.11214 9.50521 6.1775 9.37473 6.11591 9.23907L2.3354 0.912601Z" fill="white" />
                      </svg>

                    </div>
                    <span className={styles.tokenName}>ALPH</span>
                  </div>
                  <div className={styles.amountDisplay}>
                    <div className={styles.amountValues}>
                      <input
                        type="text"
                        className={`${styles.amountInput} ${numericAmount > 0 ? styles.amountInputActive : ''}`}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onFocus={() => { if (amount === '0.00' || amount === '0') setAmount('') }}
                        placeholder="0.00"
                      />
                      <span className={styles.usdValue}>{usdValue} $</span>
                    </div>
                    <span className={styles.amountLabel}>Project Amount</span>
                  </div>
                </div>

                {/* Recipient Address */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Recipient Address</label>
                  <div className={`${styles.inputWrapper} ${showAddressError ? styles.inputWrapperError : ''}`}>
                    <input
                      type="text"
                      className={`${styles.input} ${showAddressError ? styles.inputError : ''}`}
                      placeholder="1EbUw......QNSwW"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                    />
                  </div>
                  {showAddressError && (
                    <span className={styles.errorMessage}>Invalid Alephium address format</span>
                  )}
                </div>

                {/* Deadline */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Deadline</label>
                  <div className={styles.dateSection}>
                    <div className={styles.monthHeader}>
                      <div className={styles.monthTextContainer}>
                        <div className={styles.monthText}>
                          <AnimatePresence mode="popLayout" initial={false} custom={monthDirection}>
                            <motion.span
                              key={`month-${currentDate.month}`}
                              className={styles.monthName}
                              custom={monthDirection}
                              variants={{
                                initial: (direction: number) => ({ opacity: 0, y: direction * 20 }),
                                animate: { opacity: 1, y: 0 },
                                exit: (direction: number) => ({ opacity: 0, y: direction * -20 })
                              }}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              transition={springConfig}
                              style={{ display: 'inline-block' }}
                            >
                              {getMonthName(currentDate.month)}
                            </motion.span>
                          </AnimatePresence>
                          {' '}
                          <AnimatePresence mode="popLayout" initial={false} custom={monthDirection}>
                            <motion.span
                              key={`year-${currentDate.year}`}
                              className={styles.yearText}
                              custom={monthDirection}
                              variants={{
                                initial: (direction: number) => ({ opacity: 0, y: direction * 20 }),
                                animate: { opacity: 1, y: 0 },
                                exit: (direction: number) => ({ opacity: 0, y: direction * -20 })
                              }}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              transition={springConfig}
                              style={{ display: 'inline-block' }}
                            >
                              {currentDate.year}
                            </motion.span>
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className={styles.arrowsContainer}>
                        <button className={`${styles.monthArrow} ${styles.monthArrowLeft}`} type="button" onClick={handlePrevMonth}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9 3L5 7L9 11" stroke="#555555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button className={styles.monthArrow} type="button" onClick={handleNextMonth}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M5 3L9 7L5 11" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
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
                        whileTap={{ cursor: "grabbing" }}
                      >
                        {Array.from({ length: 365 }, (_, index) => {
                          const dateObj = new Date()
                          dateObj.setDate(TODAY + index)
                          const dayOfMonth = dateObj.getDate()
                          const month = dateObj.getMonth()
                          const year = dateObj.getFullYear()

                          return (
                            <motion.button
                              key={`${year}-${month}-${dayOfMonth}`}
                              data-date={`${year}-${month}-${dayOfMonth}`}
                              type="button"
                              className={`${styles.dateChip} ${dayOfMonth === selectedDay && month === currentDate.month && year === currentDate.year ? styles.dateChipSelected : ''}`}
                              onClick={() => {
                                setSelectedDay(dayOfMonth)

                                if (year > currentDate.year || (year === currentDate.year && month > currentDate.month)) {
                                  setMonthDirection(1)
                                } else if (year < currentDate.year || (year === currentDate.year && month < currentDate.month)) {
                                  setMonthDirection(-1)
                                }

                                setCurrentDate({ month, year })
                              }}
                              initial={false}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={springConfig}
                              whileHover={{ scale: dayOfMonth === selectedDay && month === currentDate.month && year === currentDate.year ? 1 : 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {dayOfMonth}
                            </motion.button>
                          )
                        })}
                      </motion.div>
                      <div className={styles.fadeRight} />
                    </div>
                  </div>
                </div>

                {/* Mission Scope */}
                <div className={styles.fieldGroup}>
                  <label className={styles.label}>Mission Scope</label>
                  <div className={styles.missionScopeContainer}>
                    {/* Dropzone */}
                    <div
                      className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''}`}
                      onDragEnter={handleDragFile}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragFile}
                      onDrop={handleDropFile}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className={styles.fileInputHidden}
                        accept=".pdf,.doc,.docx,.png,.jpeg,.jpg"
                        onChange={handleFileChange}
                      />
                      <div className={styles.dropzoneContent}>
                        <UploadSimple size={24} weight="regular" color="#555" className={styles.uploadIcon} />
                        <div className={styles.dropzoneTextGroup}>
                          <p className={styles.dropzoneText}>Click to upload or drag and drop</p>
                          <p className={styles.dropzoneSubtext}>PDF, DOC, PNG or JPG (max. 10MB)</p>
                        </div>
                      </div>
                    </div>

                    {/* Uploaded file card */}
                    <AnimatePresence>
                      {uploadedFile && (
                        <motion.div
                          className={styles.uploadedFileCard}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={styles.fileInfoRow}>
                            <div className={styles.fileInfoLeft}>
                              {uploadedFile.file.type === 'application/pdf' || uploadedFile.file.name.endsWith('.pdf') ? <FilePdf size={24} weight="fill" color="#555" /> :
                                uploadedFile.file.type.includes('image') || uploadedFile.file.name.match(/\.(png|jpe?g)$/i) ? <FileImage size={24} weight="fill" color="#555" /> :
                                  uploadedFile.file.type.includes('word') || uploadedFile.file.name.match(/\.(doc|docx)$/i) ? <FileDoc size={24} weight="fill" color="#555" /> :
                                    <FileIcon size={24} weight="fill" color="#555" />}
                              <span className={styles.fileName}>{uploadedFile.file.name}</span>
                            </div>
                            {uploadedFile.status === 'success' && (
                              <button className={styles.deleteFileBtn} onClick={handleDeleteFile} type="button">
                                <X size={14} weight="bold" color="#555" />
                              </button>
                            )}
                          </div>

                          {/* Progress Bar */}
                          {uploadedFile.status === 'uploading' && (
                            <div className={styles.progressBarContainer}>
                              <motion.div
                                className={styles.progressBarFill}
                                initial={{ width: '0%' }}
                                animate={{ width: `${uploadedFile.progress}%` }}
                                transition={{ ease: "linear", duration: 0.15 }}
                              />
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {txError && (
                  <div className={styles.fieldGroup}>
                    <span className={styles.errorMessage}>{txError}</span>
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <motion.div variants={itemVariants}>
                {!isConnected ? (
                  <AlephiumConnectButton.Custom>
                    {({ show }) => (
                      <motion.button
                        className={`${styles.ctaButton} gradient-hover-btn`}
                        type="button"
                        onClick={show}
                      >
                        Connect Wallet
                        <svg width="9" height="15" viewBox="0 0 9 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.85523 9.56569C2.85523 9.37761 2.70713 9.25104 2.52474 9.28319L0.33062 9.67001C0.148228 9.70218 0.000135422 9.88097 0.000135422 10.069V14.2131C0.000135422 14.4012 0.148228 14.5278 0.33062 14.4956L2.52474 14.1088C2.70713 14.0766 2.85523 13.8979 2.85523 13.7098V9.56569Z" fill="black" />
                          <path d="M8.5652 0.287488C8.5652 0.0994248 8.41711 -0.0271596 8.2347 0.00498952L6.0406 0.391831C5.85819 0.423981 5.71011 0.602775 5.71011 0.790853V4.93494C5.71011 5.12302 5.85819 5.24959 6.0406 5.21744L8.2347 4.83061C8.41711 4.79845 8.5652 4.61965 8.5652 4.43159V0.287488Z" fill="black" />
                          <path d="M3.21248 1.25525C3.12777 1.06868 2.90034 0.945191 2.70491 0.979642L0.35407 1.39411C0.15863 1.42856 0.0687529 1.60799 0.153462 1.79456L5.35274 13.2458C5.43744 13.4324 5.66488 13.5559 5.86031 13.5214L8.21115 13.107C8.40657 13.0725 8.49647 12.8931 8.41176 12.7065L3.21248 1.25525Z" fill="black" />
                        </svg>

                      </motion.button>
                    )}
                  </AlephiumConnectButton.Custom>
                ) : (
                  <motion.button
                    className={`${styles.ctaButtonConfirm} gradient-hover-btn`}
                    type="button"
                    disabled={!isFormComplete}
                    initial="initial"
                    whileHover="hover"
                    onClick={handleConfirm}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.5 8.25H4.5C4.08579 8.25 3.75 8.58579 3.75 9V19.5C3.75 19.9142 4.08579 20.25 4.5 20.25H19.5C19.9142 20.25 20.25 19.9142 20.25 19.5V9C20.25 8.58579 19.9142 8.25 19.5 8.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.25 8.25V5.25C8.25 4.25544 8.64509 3.30161 9.34835 2.59835C10.0516 1.89509 11.0054 1.5 12 1.5C12.9946 1.5 13.9484 1.89509 14.6517 2.59835C15.3549 3.30161 15.75 4.25544 15.75 5.25V8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect width="16.5" height="12" transform="translate(3.375 7.875)" fill="currentColor"/>
                    </svg>

                    <div className={styles.rollOverContainer}>
                      <motion.span
                        className={styles.rollOverText}
                        variants={{
                          initial: { y: 0 },
                          hover: { y: "-100%" }
                        }}
                        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                      >
                        Confirm & Lock Funds
                      </motion.span>
                      <motion.span
                        className={styles.rollOverTextHover}
                        variants={{
                          initial: { y: "100%" },
                          hover: { y: 0 }
                        }}
                        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
                      >
                        Confirm & Lock Funds
                      </motion.span>
                    </div>
                  </motion.button>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="successCardWrapper"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
            transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          >
            <motion.div
              className={styles.successCard}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className={styles.successText}>
                Send this link to the freelancer so they can deposit their collateral and activate the contract.
              </div>

              <div className={styles.linkContainer}>
                <span className={styles.linkText}>{magicLink || 'Generating...'}</span>
                <button className={styles.copyButton} title="Copy link" onClick={handleCopyLink}>
                  <Copy size={16} />
                </button>
              </div>

              <div className={styles.successButtons}>
                <button
                  className={`${styles.btnVoirContrat} gradient-hover-btn`}
                  onClick={() => router.push(`/contract/${deployedContractAddress}`)}
                >
                  View contract <ArrowRight size={14} weight="bold" />
                </button>

                <button className={styles.btnCreerUnAutre} onClick={() => {
                  setStatus('form')
                  setDeployedContractId('')
                  setDeployedContractAddress('')
                  setTxError(null)
                }}>
                  Create another
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
