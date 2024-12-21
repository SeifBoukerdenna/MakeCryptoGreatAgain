import React from 'react';
import benImage from '../assets/ben-memoji.png';

const BenShapiroAvatar: React.FC = () => {
    return (
        <div className="ben-avatar-container">
            <img src={benImage} alt="Ben Shapiro Cartoon" className="ben-avatar" />
        </div>
    );
};

export default BenShapiroAvatar;
