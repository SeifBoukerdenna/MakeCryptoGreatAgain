export interface RecordingSetup {
  mediaRecorder: MediaRecorder;
  recordedChunks: Blob[];
  stopRecording: () => void;
}

export interface SubtitleStyle {
  fontSize: {
    normal: number;
    current: number;
  };
  fontFamily: string;
  color: string;
  shadowColor: string;
  shadowBlur: number;
}

export interface VideoRecordingOptions {
  width?: number;
  height?: number;
  frameRate?: number;
  subtitleStyle?: SubtitleStyle;
}
