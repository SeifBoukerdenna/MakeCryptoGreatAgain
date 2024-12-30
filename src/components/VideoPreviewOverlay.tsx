import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import Switch from 'react-switch';

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
        const mediaRecorder = new MediaRecorder(new MediaStream());
        const mimeType = mediaRecorder.mimeType?.[0] || 'video/mp4';

        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(webmBlob);
            video.onloadedmetadata = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const stream = canvas.captureStream();
                const newMediaRecorder = new MediaRecorder(stream, {
                    mimeType,
                    videoBitsPerSecond: 2500000 // 2.5 Mbps
                });

                const chunks: Blob[] = [];
                newMediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                newMediaRecorder.onstop = () => {
                    const mp4Blob = new Blob(chunks, { type: mimeType });
                    resolve(mp4Blob);
                };

                video.onplay = () => {
                    const drawFrame = () => {
                        if (video.paused || video.ended) {
                            newMediaRecorder.stop();
                            return;
                        }
                        ctx.drawImage(video, 0, 0);
                        requestAnimationFrame(drawFrame);
                    };
                    newMediaRecorder.start();
                    drawFrame();
                };

                video.play();
            };
            video.onerror = () => reject(new Error('Video loading failed'));
        });
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
                a.click();
                URL.revokeObjectURL(url);
            } else {
                const a = document.createElement('a');
                a.href = videoURL;
                a.download = `${videoTitle}.webm`;
                a.click();
            }
        } catch (error) {
            console.error('Download failed:', error);
        } finally {
            setIsConverting(false);
        }
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

                    <div className="format-switch flex items-center justify-center gap-4 mb-4">
                        <span className={`text-sm ${!isMP4 ? 'text-purple-500 font-bold' : ''}`}>WebM</span>
                        <Switch
                            onChange={setIsMP4}
                            checked={isMP4}
                            onColor="#8B5CF6"
                            offColor="#D1D5DB"
                            height={24}
                            width={48}
                            handleDiameter={20}
                        />
                        <span className={`text-sm ${isMP4 ? 'text-purple-500 font-bold' : ''}`}>MP4</span>
                    </div>

                    <button
                        onClick={handleDownload}
                        className="export-button download-button"
                        disabled={isConverting}
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