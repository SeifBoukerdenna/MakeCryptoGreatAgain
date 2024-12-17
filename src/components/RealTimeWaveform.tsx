// components/RealTimeWaveform.tsx
import React, { useEffect, useRef } from 'react';

interface RealTimeWaveformProps {
    analyser: AnalyserNode | null;
}

const RealTimeWaveform: React.FC<RealTimeWaveformProps> = ({ analyser }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationIdRef = useRef<number | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const bufferLengthRef = useRef<number>(0);

    useEffect(() => {
        if (!analyser) return;

        const canvas = canvasRef.current;
        const canvasCtx = canvas?.getContext('2d');
        if (!canvasCtx || !canvas) return;

        analyser.fftSize = 2048;
        bufferLengthRef.current = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLengthRef.current);
        dataArrayRef.current = dataArray;

        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        const draw = () => {
            animationIdRef.current = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArrayRef.current!);

            canvasCtx.fillStyle = '#f0f0f0';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#2196f3';

            canvasCtx.beginPath();

            const sliceWidth = WIDTH * 1.0 / bufferLengthRef.current;
            let x = 0;

            for (let i = 0; i < bufferLengthRef.current; i++) {
                const v = dataArrayRef.current![i] / 128.0;
                const y = v * HEIGHT / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(WIDTH, HEIGHT / 2);
            canvasCtx.stroke();
        };

        draw();

        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
        };
    }, [analyser]);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={200}
            style={{ width: '100%', height: '200px', backgroundColor: '#f0f0f0' }}
        ></canvas>
    );
};

export default RealTimeWaveform;
