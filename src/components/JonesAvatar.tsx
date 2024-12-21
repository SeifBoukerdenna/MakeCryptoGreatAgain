import React from 'react';
import jonesImage from '../assets/jones-memoji.png';

const JonesAvatar: React.FC = () => {
    return (
        <div className="jones-avatar-container">
            <img src={jonesImage} alt="Alex jones Cartoon" className="jones-avatar" />
        </div>
    );
};

export default JonesAvatar;
