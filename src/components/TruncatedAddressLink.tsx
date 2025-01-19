// src/components/TruncatedAddressLink.tsx
import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import { truncateAddress } from '../utils/adress'; // Ensure the path is correct
import '../styles/TruncatedAddressLink.css'; // We'll define this CSS file next
import { NETWORK } from '../configs/test.config';

interface TruncatedAddressLinkProps {
    address: string;
    className?: string; // Optional prop for additional styling
}

const TruncatedAddressLink: React.FC<TruncatedAddressLinkProps> = ({ address, className }) => {
    return (
        <a
            href={`https://solscan.io/address/${address}?cluster=${NETWORK}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`truncated-address-link ${className || ''}`}
            title={address} // Tooltip to show the full address on hover
        >
            {truncateAddress(address)} <LinkIcon className="link-icon" size={14} />
        </a>
    );
};

export default TruncatedAddressLink;
