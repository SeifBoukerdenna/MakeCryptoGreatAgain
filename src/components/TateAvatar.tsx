import React from 'react';
import trumpImage from '../assets/tate-memoji.png';

const TateAvatar: React.FC = () => {
    return (
        <div className="tate-avatar-container">
            <img src={trumpImage} alt="Andrew Tate Cartoon" className="tate-avatar" />
        </div>
    );
};

export default TateAvatar;