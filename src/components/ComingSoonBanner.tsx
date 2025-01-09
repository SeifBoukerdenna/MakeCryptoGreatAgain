import { Rocket, Star } from 'lucide-react';
import '../styles/ComingSoonBanner.css';

const ComingSoonBanner = () => {
    return (
        <div className="coming-soon-banner banner-enter">
            <div className="banner-container">
                {/* Main Banner */}
                <div className="banner-main">
                    <div className="banner-content">
                        <Rocket className="banner-icon" />
                        <div className="banner-text">
                            <h3>Token Launch</h3>
                            <p>Coming Soon!</p>
                        </div>
                    </div>

                    {/* Animated Stars */}
                    <div className="star-left-1">
                        <Star className="star-icon star-icon-1" />
                    </div>
                    <div className="star-left-2">
                        <Star className="star-icon star-icon-2" />
                    </div>
                </div>

                {/* Timer Section */}
                <div className="timer-section">
                    <p className="timer-text">
                        Check out the latest updates on Twitter!
                    </p>
                    <a
                        href="https://x.com/___MCGA___"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link"
                    >
                        Follow on Twitter
                        <Rocket className="social-icon" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ComingSoonBanner;