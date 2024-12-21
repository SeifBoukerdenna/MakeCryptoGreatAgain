import React from 'react';
import trumpImage from '../assets/kanye-memoji.png';

const KanyeAvatar: React.FC = () => {
    return (
        <div className="kanye-avatar-container">
            <img src={trumpImage} alt="Kanye West Cartoon" className="kanye-avatar" />
        </div>
    );
};

export default KanyeAvatar;