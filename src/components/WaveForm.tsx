// /src/components/Waveform.tsx

import React from 'react';
import styles from './Waveform.module.css';

const Waveform: React.FC = () => {
  return (
    <div className={styles.waveformContainer} aria-label="Audio waveform">
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
      <div className={styles.bar}></div>
    </div>
  );
};

export default Waveform;
