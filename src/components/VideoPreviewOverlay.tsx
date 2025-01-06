import React, { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import Switch from 'react-switch';
import { SwitchColors } from './ThemeToggle';
import { toast } from 'react-toastify';

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
    const [isMP4, setIsMP4] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const videoURL = URL.createObjectURL(videoBlob);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
            URL.revokeObjectURL(videoURL);
        };
    }, [videoURL]);

    const convertToMP4 = async (webmBlob: Blob): Promise<Blob> => {
        // Convert blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
        });
        reader.readAsDataURL(webmBlob);
        const base64Data = await base64Promise;

        // Show toast notification
        const toastId = toast.loading("Converting video to MP4...");

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    videoData: base64Data,
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Failed to convert video');
            }

            const mp4Blob = await response.blob();
            toast.update(toastId, {
                render: "Conversion successful!",
                type: "success",
                isLoading: false,
                autoClose: 2000
            });

            return mp4Blob;
        } catch (error) {
            toast.update(toastId, {
                render: "Failed to convert video. Try downloading as WebM instead.",
                type: "error",
                isLoading: false,
                autoClose: 5000
            });
            throw error;
        }
    };

    const handleDownload = async () => {
        try {
            if (isMP4) {
                setIsConverting(true);
                const mp4Blob = await convertToMP4(videoBlob);
                const url = URL.createObjectURL(mp4Blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${videoTitle}.mp4`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                const a = document.createElement('a');
                a.href = videoURL;
                a.download = `${videoTitle}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setIsConverting(false);
        }
    };

    const switchColors: SwitchColors = {
        offColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--toggle-bg-light')
            .trim() || '#888888',
        onColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--toggle-bg-dark')
            .trim() || '#6366F1',
        offHandleColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--toggle-handle-light')
            .trim() || '#ffffff',
        onHandleColor: getComputedStyle(document.documentElement)
            .getPropertyValue('--toggle-handle-dark')
            .trim() || '#ffffff',
    };

    return (
        <div className="video-overlay">
            <div className="video-popup">
                <button onClick={onClose} className="close-button" aria-label="Close video preview">
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

                    <div className="format-switch">
                        <span className={`format-label ${!isMP4 ? 'active-format' : ''}`}>WebM</span>
                        <Switch
                            onChange={setIsMP4}
                            checked={isMP4}
                            offColor={switchColors.offColor}
                            onColor={switchColors.onColor}
                            offHandleColor={switchColors.offHandleColor}
                            onHandleColor={switchColors.onHandleColor}
                            height={24}
                            width={48}
                            handleDiameter={20}
                            uncheckedIcon={false}
                            checkedIcon={false}
                            className="switch-component"
                        />
                        <span className={`format-label ${isMP4 ? 'active-format' : ''}`}>MP4</span>
                    </div>

                    <button
                        onClick={handleDownload}
                        className={`export-button download-button ${isConverting ? 'disabled-button' : ''}`}
                        disabled={isConverting}
                        aria-label={`Download video as ${isMP4 ? 'MP4' : 'WebM'}`}
                    >
                        <Download className="download-icon" />
                        {isConverting ? 'Converting...' : `Download ${isMP4 ? 'MP4' : 'WebM'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPreviewOverlay;