import React from 'react';
import trumpImage from '../assets/hitler-memoji.png';

const HitlerAvatar: React.FC = () => {
    return (
        <div className="hitler-avatar-container">
            <img src={trumpImage} alt="Hitler Cartoon" className="hitler-avatar" />
        </div>
    );
};

export default HitlerAvatar;
