import React from 'react';
import trumpImage from '../assets/ben-memoji.png';

const BenShapiroAvatar: React.FC = () => {
    return (
        <div className="ben-avatar-container">
            <img src={trumpImage} alt="Ben Shapiro Cartoon" className="ben-avatar" />
        </div>
    );
};

export default BenShapiroAvatar;
