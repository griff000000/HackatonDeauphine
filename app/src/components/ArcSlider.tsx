'use client';

import React, { useState, useEffect, useRef, MouseEvent, TouchEvent } from 'react';
import styles from '@/styles/ArcSlider.module.css';
import ParticipantOrb from './ParticipantOrb';

const AlphIcon = () => (
  <div style={{width: 28, height: 28, position: 'relative', background: '#DB5F37', boxShadow: '0 0.3px 0.3px rgba(0, 0, 0, 0.25)', overflow: 'hidden', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center'}}>
    <svg width="12" height="18" viewBox="0 0 7 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.076 6.95712C2.076 6.82036 1.96832 6.72833 1.8357 6.75171L0.240303 7.03298C0.107682 7.05636 0 7.18637 0 7.32311V10.3364C0 10.4731 0.107682 10.5652 0.240303 10.5418L1.8357 10.2605C1.96832 10.2371 2.076 10.1071 2.076 9.97038V6.95712Z" fill="white"/>
      <path d="M6.22786 0.209039C6.22786 0.0722941 6.12018 -0.0197484 5.98754 0.003628L4.39216 0.28491C4.25953 0.308286 4.15186 0.438292 4.15186 0.575048V3.58831C4.15186 3.72507 4.25953 3.8171 4.39216 3.79372L5.98754 3.51245C6.12018 3.48906 6.22786 3.35906 6.22786 3.22231V0.209039Z" fill="white"/>
      <path d="M2.33536 0.912632C2.27377 0.776973 2.1084 0.68718 1.9663 0.712231L0.256945 1.0136C0.114836 1.03865 0.0494843 1.16912 0.111079 1.30478L3.89159 9.63125C3.95319 9.76691 4.11856 9.85671 4.26066 9.83165L5.97001 9.53029C6.11211 9.50524 6.17747 9.37476 6.11588 9.2391L2.33536 0.912632Z" fill="white"/>
    </svg>
  </div>
);

interface ArcSliderProps {
  totalAmount: number;
  initialSplit?: number; // 0 to 1 (0 = 100% freelance, 1 = 100% client, or vice versa)
  onChange: (clientAmount: number, freelanceAmount: number, clientPercent: number, freelancePercent: number) => void;
}

export default function ArcSlider({ totalAmount, initialSplit = 0.5, onChange }: ArcSliderProps) {
  const [percent, setPercent] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // SVG metrics
  const width = 300;
  const height = 150; // half circle
  const strokeWidth = 12;
  const radius = width / 2 - strokeWidth;
  const cx = width / 2;
  const cy = height;

  // Calculate coordinates for the thumb based on percentage (0 to 1)
  // Angle goes from 180deg (PI) to 0deg (0)
  const getCoordinatesForPercent = (p: number) => {
    // p = 0 means left side (Client 100%), p = 1 means right side (Freelance 100%)
    const angle = Math.PI - p * Math.PI;
    const x = cx + radius * Math.cos(angle);
    const y = cy - radius * Math.sin(angle);
    return { x, y };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    // Calculate position relative to svg center
    const x = clientX - rect.left - cx;
    const y = clientY - rect.top - cy;

    // Calculate angle in radians
    let angle = Math.atan2(y, x);

    // Map angle to percentage
    // Atan2 returns angle from -PI to PI
    // For our semi circle, y is always negative
    if (y > 0) return; // Prevent dragging below the arc

    // Angle ranges from -PI (left) to 0 (right)
    // Map -PI -> 0% and 0 -> 100%
    let newPercent = (angle + Math.PI) / Math.PI;

    // Clamping
    newPercent = Math.max(0, Math.min(1, newPercent));
    setPercent(newPercent);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleMove(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleMove(e.clientX, e.clientY);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const clientPercent = Math.round((1 - percent) * 100);
    const freelancePercent = 100 - clientPercent;
    const clientAmount = Math.round(totalAmount * (1 - percent));
    const freelanceAmount = totalAmount - clientAmount;

    onChange(clientAmount, freelanceAmount, clientPercent, freelancePercent);
  }, [percent, totalAmount, onChange]);

  const thumbPos = getCoordinatesForPercent(percent);

  const clientPercentDisplay = Math.round((1 - percent) * 100);
  const freelancePercentDisplay = 100 - clientPercentDisplay;
  const clientAmountDisplay = Math.round(totalAmount * (1 - percent));
  const freelanceAmountDisplay = totalAmount - clientAmountDisplay;

  const gap = 0.20; // Gap angle in radians
  const thumbAngle = Math.PI - percent * Math.PI;

  const describeArc = (startAngle: number, endAngle: number) => {
    if (startAngle - endAngle < 0.01) return "";

    const startX = cx + radius * Math.cos(startAngle);
    const startY = cy - radius * Math.sin(startAngle);
    const endX = cx + radius * Math.cos(endAngle);
    const endY = cy - radius * Math.sin(endAngle);

    return `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  };

  const leftArcPath = describeArc(Math.PI, Math.min(Math.PI, Math.max(0, thumbAngle + gap)));
  const rightArcPath = describeArc(Math.max(0, Math.min(Math.PI, thumbAngle - gap)), 0);

  return (
    <div className={styles.container}>
      <div
        className={styles.svgWrapper}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none' }}
      >
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 -20 ${width} ${height + strokeWidth + 20}`}
          className={styles.svg}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="clientGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF5F4A" />
              <stop offset="100%" stopColor="#F6A83B" />
            </linearGradient>
            <linearGradient id="freelanceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F63BE3" />
              <stop offset="100%" stopColor="#C827ED" />
            </linearGradient>
            <linearGradient id="fadeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1A1A1A" stopOpacity="1" />
              <stop offset="30%" stopColor="#1A1A1A" stopOpacity="1" />
              <stop offset="100%" stopColor="#1A1A1A" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Left Arc (Client) */}
          {leftArcPath && (
            <path
              d={leftArcPath}
              fill="none"
              stroke="url(#freelanceGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Right Arc (Freelance) */}
          {rightArcPath && (
            <path
              d={rightArcPath}
              fill="none"
              stroke="url(#clientGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          )}

          {/* Bottom Fade Mask to make start point blend with the background */}
          <rect x="0" y={height - 60} width={width} height={60 + strokeWidth} fill="url(#fadeGradient)" pointerEvents="none" />

          {/* Thumb */}
          <circle
            cx={thumbPos.x}
            cy={thumbPos.y}
            r={14}
            fill="#FFFFFF"
            style={{ cursor: 'grab' }}
          />
        </svg>

        {/* Text inside the arc */}
        <div className={styles.innerValueContainer}>
          <div className={styles.valueGroup}>
            <span className={styles.valueText}>{clientAmountDisplay}</span>
            <AlphIcon />
          </div>
          <span className={styles.divider}>/</span>
          <div className={styles.valueGroup}>
            <span className={styles.valueText}>{freelanceAmountDisplay}</span>
            <AlphIcon />
          </div>
        </div>
      </div>

      <div className={styles.labelsContainer}>
        <div className={styles.labelGroup}>
          <ParticipantOrb role="client" />
          <span className={styles.labelText}>Client: {clientPercentDisplay}%</span>
        </div>
        <div className={styles.labelGroupRight}>
          <ParticipantOrb role="freelancer" />
          <span className={styles.labelText}>Freelance: {freelancePercentDisplay}%</span>
        </div>
      </div>
    </div>
  );
}
