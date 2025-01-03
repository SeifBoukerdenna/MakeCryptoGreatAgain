// src/components/QueueStatus.tsx
import React from 'react';
import { Clock, Users, Loader2 } from 'lucide-react';
import '../styles/QueueStatus.css';

interface QueueStatusProps {
    queuePosition: number | null;
    activeRequests: number;
    isProcessing: boolean;
}

const QueueStatus: React.FC<QueueStatusProps> = ({
    queuePosition,
    activeRequests,
    isProcessing,
}) => {
    if (!queuePosition && !isProcessing) return null;

    return (
        <div className="queue-status">
            <div className="queue-status-content">
                {isProcessing ? (
                    <>
                        <Loader2 className="queue-status-icon spinning" />
                        <span className="queue-position">Processing your request...</span>
                    </>
                ) : queuePosition ? (
                    <>
                        <Clock className="queue-status-icon" />
                        <div className="queue-info">
                            <span className="queue-position">
                                Queue Position: #{queuePosition}
                            </span>
                            <span className="queue-details">
                                <Users className="queue-details-icon" />
                                {activeRequests}/3 active requests
                            </span>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default QueueStatus;