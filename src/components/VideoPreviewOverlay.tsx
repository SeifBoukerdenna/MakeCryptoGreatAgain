// src/components/VideoPreviewOverlay.tsx

import React, { useEffect } from 'react';

interface VideoPreviewOverlayProps {
    videoBlob: Blob;
    onClose: () => void;
}

const VideoPreviewOverlay: React.FC<VideoPreviewOverlayProps> = ({
    videoBlob,
    onClose
}) => {
    const videoURL = URL.createObjectURL(videoBlob);

    // Prevent background scrolling when the overlay is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = videoURL;
        a.download = 'avatar_video.webm'; // You can change the filename/extension if needed
        a.click();
        URL.revokeObjectURL(videoURL);
    };

    return (
        <div className="video-overlay">
            <div className="video-popup">
                <button
                    onClick={onClose}
                    className="close-button"
                    aria-label="Close video preview"
                >
                    &times;
                </button>
                <h2 className="popup-title">Video Preview</h2>
                <video src={videoURL} controls className="popup-video" />
                <button
                    onClick={handleDownload}
                    className="download-button"
                >
                    Download Video
                </button>
            </div>
        </div>
    );
};

export default VideoPreviewOverlay;
