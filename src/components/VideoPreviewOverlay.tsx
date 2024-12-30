import React, { useEffect } from 'react';
import { Download } from 'lucide-react';

interface VideoPreviewOverlayProps {
    videoBlob: Blob;
    onClose: () => void;
    characterName?: string;
}

const VideoPreviewOverlay: React.FC<VideoPreviewOverlayProps> = ({
    videoBlob,
    onClose,
    characterName
}) => {
    const videoURL = URL.createObjectURL(videoBlob);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = videoURL;
        a.download = `${characterName || 'avatar'}_video.webm`;
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

                <div className="video-container relative">
                    <video src={videoURL} controls className="popup-video" />
                    {characterName && (
                        <div className="character-name-overlay">
                            {characterName}
                        </div>
                    )}
                </div>

                {/* Updated button container with equal spacing */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <button
                        onClick={handleDownload}
                        className="export-button download-button"
                    >
                        <Download className="w-5 h-5" />
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPreviewOverlay;