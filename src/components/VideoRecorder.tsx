import React, { useState, useRef, useCallback } from 'react';
import { X, Download } from 'lucide-react';

interface VideoRecorderProps {
    isPlaying: boolean;
    selectedAvatar: string;
    audioRef: React.RefObject<HTMLAudioElement>;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ isPlaying, audioRef }) => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
    const [showPreview, setShowPreview] = useState<boolean>(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameRef = useRef<number>();
    const tempChunks = useRef<Blob[]>([]);

    const setupMediaRecorder = async () => {
        if (!canvasRef.current || !audioRef.current) return null;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return null;

        // Set up canvas
        canvas.width = 1080;
        canvas.height = 1920;
        const canvasStream = canvas.captureStream(30);

        try {
            // Get the audio stream directly from the audio element
            const audioStream = (audioRef.current as any).captureStream();

            // Combine video and audio streams
            const combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioStream.getAudioTracks()
            ]);

            // Create MediaRecorder
            const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp8,opus',
                videoBitsPerSecond: 3000000
            });

            return mediaRecorder;
        } catch (error) {
            console.error('Error setting up media recorder:', error);
            return null;
        }
    };

    const startRecording = useCallback(async () => {
        console.log('Starting recording setup...');
        tempChunks.current = []; // Clear temporary chunks

        try {
            const mediaRecorder = await setupMediaRecorder();
            if (!mediaRecorder) {
                console.error('Failed to set up media recorder');
                return;
            }

            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event: BlobEvent) => {
                console.log('Received data chunk:', event.data.size);
                if (event.data && event.data.size > 0) {
                    tempChunks.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped, chunks:', tempChunks.current.length);
                if (tempChunks.current.length > 0) {
                    setRecordedChunks(tempChunks.current);
                    setShowPreview(true);
                }
            };

            // Request a keyframe every second
            mediaRecorder.start(1000);
            setIsRecording(true);
            console.log('Recording started successfully');

            // Start animation loop
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            const drawFrame = () => {
                if (!context || !isRecording) return;

                context.fillStyle = '#000000';
                context.fillRect(0, 0, canvas.width, canvas.height);

                const avatar = document.querySelector<HTMLImageElement>('.selected-avatar');
                if (avatar) {
                    const size = Math.min(canvas.width * 0.8, canvas.height * 0.4);
                    const x = (canvas.width - size) / 2;
                    const y = (canvas.height - size) / 2;

                    context.save();
                    context.beginPath();
                    context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
                    context.clip();
                    context.drawImage(avatar, x, y, size, size);
                    context.restore();

                    if (isPlaying) {
                        context.strokeStyle = '#00ff00';
                        context.lineWidth = 10;
                        context.beginPath();
                        context.arc(x + size / 2, y + size / 2, size / 2 + 5, 0, Math.PI * 2);
                        context.stroke();
                    }
                }

                animationFrameRef.current = requestAnimationFrame(drawFrame);
            };

            drawFrame();

        } catch (error) {
            console.error('Error in startRecording:', error);
        }
    }, [isPlaying]);

    const stopRecording = useCallback(() => {
        console.log('Stopping recording...');
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            setIsRecording(false);
        }
    }, []);

    // Start recording when playing starts
    React.useEffect(() => {
        if (isPlaying && !isRecording && audioRef.current?.readyState === 4) {
            startRecording();
        }
    }, [isPlaying, isRecording, startRecording]);

    // Stop recording when playing stops
    React.useEffect(() => {
        if (!isPlaying && isRecording) {
            stopRecording();
        }
    }, [isPlaying, isRecording, stopRecording]);

    const downloadVideo = useCallback(() => {
        if (recordedChunks.length === 0) return;

        const blob = new Blob(recordedChunks, {
            type: 'video/webm'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'avatar-response.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [recordedChunks]);

    return (
        <>
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {showPreview && recordedChunks.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-lg w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Response Video</h3>
                            <button
                                onClick={() => {
                                    console.log('Closing preview');
                                    setShowPreview(false);
                                    setRecordedChunks([]);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <video
                            controls
                            autoPlay
                            playsInline
                            className="w-full aspect-[9/16] mb-4 bg-black"
                            src={URL.createObjectURL(new Blob(recordedChunks, {
                                type: 'video/webm'
                            }))}
                        />

                        <div className="flex justify-end">
                            <button
                                onClick={downloadVideo}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Download Video
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default VideoRecorder;