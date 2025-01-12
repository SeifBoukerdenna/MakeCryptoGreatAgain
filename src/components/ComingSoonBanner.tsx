import { Rocket, Star, X } from 'lucide-react';
import { useState } from 'react';
import '../styles/ComingSoonBanner.css';

const ComingSoonBanner = () => {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="coming-soon-banner banner-enter">
            <div className="banner-container">
                {/* Close Button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="banner-close-button"
                    aria-label="Close banner"
                >
                    <X size={16} />
                </button>

                {/* Main Banner */}
                <div className="banner-main">
                    <div className="banner-content">
                        <Rocket className="banner-icon" />
                        <div className="banner-text">
                            <h3>Token Launch</h3>
                            <p>Coming January 19th, 5PM EST</p>
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

                {/* Social Section */}
                <div className="social-section">
                    <a
                        href="https://x.com/_crypto_celeb_"
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