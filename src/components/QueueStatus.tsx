// src/components/QueueStatus.tsx
import React, { useState, useEffect } from 'react';
import { Clock, Users, Loader2 } from 'lucide-react';
import '../styles/QueueStatus.css';

interface QueueStatusProps {
    queuePosition: number | null;
    activeRequests: number;
    isProcessing: boolean;
    getTimeUntilNextSlot: () => Promise<number>;
}

const QueueStatus: React.FC<QueueStatusProps> = ({
    queuePosition,
    activeRequests,
    isProcessing,
    getTimeUntilNextSlot
}) => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        const updateTimeLeft = async () => {
            if (queuePosition !== null || isProcessing) {
                const time = await getTimeUntilNextSlot();
                setTimeLeft(time);
            }
        };

        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [queuePosition, isProcessing, getTimeUntilNextSlot]);

    if (!queuePosition && !isProcessing) return null;

    const formatTime = (ms: number) => {
        const seconds = Math.ceil(ms / 1000);
        return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    };

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
                                {activeRequests}/3 requests per minute
                            </span>
                            {timeLeft !== null && timeLeft > 0 && (
                                <span className="queue-time-left">
                                    Next slot in: {formatTime(timeLeft)}
                                </span>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default QueueStatus;