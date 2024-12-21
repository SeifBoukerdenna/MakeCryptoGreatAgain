import React from 'react';
import loganImage from '../assets/logan-memoji.png';

const LoganAvatar: React.FC = () => {
    return (
        <div className="logan-avatar-container">
            <img src={loganImage} alt="Logan Paul Cartoon" className="logan-avatar" />
        </div>
    );
};

export default LoganAvatar;
