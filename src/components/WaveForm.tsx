import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { FaPlay, FaPause } from 'react-icons/fa';

interface WaveformProps {
  audioFile: string;
}

const Waveform: React.FC<WaveformProps> = ({ audioFile }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (waveformRef.current) {
      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#2196f3',
        progressColor: '#0000ff',
        cursorColor: '#333',
        barWidth: 2,
        height: 200,
      });

      ws.load(audioFile);

      ws.on('ready', () => {});

      ws.on('play', () => setIsPlaying(true));
      ws.on('pause', () => setIsPlaying(false));
      ws.on('finish', () => setIsPlaying(false));

      setWavesurfer(ws);

      return () => {
        ws.destroy();
      };
    }
  }, [audioFile]);

  const togglePlay = () => {
    if (wavesurfer) {
      if (wavesurfer.isPlaying()) {
        wavesurfer.pause();
      } else {
        wavesurfer.play();
      }
    }
  };

  return (
    <div className="waveform-wrapper">
      <button className="play-button" onClick={togglePlay}>
        {isPlaying ? <FaPause /> : <FaPlay />}
      </button>
      <div className="waveform-container">
        <div ref={waveformRef}></div>
      </div>
    </div>
  );
};

export default Waveform;
