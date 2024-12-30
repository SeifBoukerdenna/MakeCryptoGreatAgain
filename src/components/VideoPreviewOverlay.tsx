import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface VideoPreviewOverlayProps {
    videoBlob: Blob;
    onClose: () => void;
    characterName?: string;
}

const VideoPreviewOverlay: React.FC<VideoPreviewOverlayProps> = ({
    videoBlob,
    onClose,
    characterName = 'Character'
}) => {
    const [videoTitle, setVideoTitle] = useState(`${characterName}_video`);
    const videoURL = URL.createObjectURL(videoBlob);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
            URL.revokeObjectURL(videoURL);
        };
    }, [videoURL]);

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = videoURL;
        a.download = `${videoTitle}.webm`;
        a.click();
    };

    return (
        <div className="video-overlay">
            <div className="video-popup">
                <button
                    onClick={onClose}
                    className="close-button"
                    aria-label="Close video preview"
                >
                    <X />
                </button>

                <h2 className="popup-title">Video Preview</h2>

                <div className="video-container">
                    <video src={videoURL} controls className="popup-video" />
                </div>

                <div className="export-section">
                    <div className="title-input-wrapper">
                        <input
                            id="video-title"
                            type="text"
                            value={videoTitle}
                            onChange={(e) => setVideoTitle(e.target.value)}
                            className="title-input"
                            placeholder="Enter a title..."
                        />
                    </div>

                    <button
                        onClick={handleDownload}
                        className="export-button download-button"
                    >
                        <Download className="download-icon" />
                        Download Video
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPreviewOverlay;
