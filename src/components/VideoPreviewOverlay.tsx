import React, { useEffect, useMemo, memo, useState } from 'react';
import { Download, X } from 'lucide-react';

interface VideoPreviewOverlayProps {
    videoBlob: Blob;
    onClose: () => void;
    characterName?: string;
}

// Memoized title input component
const TitleInput = memo(({ value, onChange }: {
    value: string;
    onChange: (value: string) => void;
}) => {
    return (
        <input
            id="video-title"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="title-input"
            placeholder="Enter a title..."
        />
    );
});

// Memoized video component
const VideoPlayer = memo(({ src }: { src: string }) => {
    return (
        <video src={src} controls className="popup-video" />
    );
});

const VideoPreviewOverlay: React.FC<VideoPreviewOverlayProps> = ({
    videoBlob,
    onClose,
    characterName = 'Character'
}) => {
    const [videoTitle, setVideoTitle] = useState(`${characterName}_video`);

    // Memoize the videoURL so it doesn't change on re-renders
    const videoURL = useMemo(() => URL.createObjectURL(videoBlob), [videoBlob]);

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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="video-overlay">
            <div className="video-popup">
                <button onClick={onClose} className="close-button" aria-label="Close video preview">
                    <X />
                </button>

                <h2 className="popup-title">Video Preview</h2>

                <div className="video-container">
                    <VideoPlayer src={videoURL} />
                </div>

                <div className="export-section">
                    <div className="title-input-wrapper">
                        <TitleInput
                            value={videoTitle}
                            onChange={setVideoTitle}
                        />
                    </div>

                    <button
                        onClick={handleDownload}
                        className="export-button download-button"
                        aria-label="Download video as WebM"
                    >
                        <Download className="download-icon" />
                        Download WebM
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPreviewOverlay;