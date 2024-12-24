// src/components/VideoPreviewOverlay.tsx

import React from 'react';

interface VideoPreviewOverlayProps {
    videoBlob: Blob;
    onClose: () => void;
}

const VideoPreviewOverlay: React.FC<VideoPreviewOverlayProps> = ({ videoBlob, onClose }) => {
    const videoURL = URL.createObjectURL(videoBlob);

    const handleDownload = () => {
        const a = document.createElement('a');
        a.href = videoURL;
        a.download = 'avatar_video.webm'; // You can change the extension if needed
        a.click();
        URL.revokeObjectURL(videoURL);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg relative max-w-md w-full">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-2xl"
                >
                    &times;
                </button>
                <h2 className="text-xl mb-4">Video Preview</h2>
                <video src={videoURL} controls className="w-full h-auto mb-4" />
                <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors duration-300"
                >
                    Download Video
                </button>
            </div>
        </div>
    );
};

export default VideoPreviewOverlay;
