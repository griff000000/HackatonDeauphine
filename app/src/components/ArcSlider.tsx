'use client';

import React, { useState, useEffect, useRef, MouseEvent, TouchEvent } from 'react';
import styles from '@/styles/ArcSlider.module.css';

const AlphIcon = () => (
  <div style={{width: 28, height: 28, position: 'relative', background: '#DB5F37', boxShadow: '0 0.3px 0.3px rgba(0, 0, 0, 0.25)', overflow: 'hidden', borderRadius: '50%', flexShrink: 0}}>
    <div style={{width: 18.61, height: 18, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(1.5)'}}>
      <div style={{width: 2.08, height: 3.80, left: 6.15, top: 10.47, position: 'absolute', background: 'white'}} />
      <div style={{width: 2.08, height: 3.80, left: 10.30, top: 3.72, position: 'absolute', background: 'white'}} />
      <div style={{width: 6.05, height: 9.13, left: 6.24, top: 4.43, position: 'absolute', background: 'white'}} />
    </div>
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
          <div className={styles.clientGradientCircle} />
          <span className={styles.labelText}>Client: {clientPercentDisplay}%</span>
        </div>
        <div className={styles.labelGroupRight}>
          <div className={styles.freelanceGradientCircle} />
          <span className={styles.labelText}>Freelance: {freelancePercentDisplay}%</span>
        </div>
      </div>
    </div>
  );
}
