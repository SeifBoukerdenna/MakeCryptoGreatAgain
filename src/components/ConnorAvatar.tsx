import React from 'react';
import connorImage from '../assets/connor-memoji.png';

const ConnorAvatar: React.FC = () => {
    return (
        <div className="connor-avatar-container">
            <img src={connorImage} alt="Connor Mcgregor Cartoon" className="connor-avatar" />
        </div>
    );
};

export default ConnorAvatar;
