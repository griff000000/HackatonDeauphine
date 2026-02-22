import React from 'react'

interface ParticipantOrbProps {
  role: 'client' | 'freelancer' | 'arbitrator';
  className?: string;
}

export default function ParticipantOrb({ role, className }: ParticipantOrbProps) {
  const src = role === 'client'
    ? '/clientorb.svg'
    : role === 'freelancer'
      ? '/freelanceorb.svg'
      : '/arbitre.svg';

  return (
    <img
      src={src}
      alt={`${role} orb`}
      width={20}
      height={20}
      className={className}
      style={{ display: 'block', borderRadius: '50%' }}
    />
  )
}
