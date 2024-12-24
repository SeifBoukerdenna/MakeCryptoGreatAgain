// src/components/Tooltip.tsx

import React from 'react';

interface TooltipProps {
    message: string;
    children: React.ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ message, children }) => {
    return (
        <div className="tooltip-container">
            {children}
            <span className="tooltiptext">{message}</span>
        </div>
    );
};

export default Tooltip;
