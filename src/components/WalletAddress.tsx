import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import './WalletAddress.css';

interface WalletAddressProps {
  address: string;
  full?: boolean;
}

export function WalletAddress({ address, full = false }: WalletAddressProps) {
  const [copied, setCopied] = useState(false);

  const displayAddress = full ? address : address;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="wallet-addr" onClick={handleCopy} title="Cliquer pour copier">
      <span className="wallet-addr-text">{displayAddress}</span>
      {copied ? <Check size={14} className="wallet-addr-icon copied" /> : <Copy size={14} className="wallet-addr-icon" />}
      {copied && <span className="wallet-addr-tooltip">Copié !</span>}
    </span>
  );
}
