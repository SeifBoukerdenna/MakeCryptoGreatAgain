import { FaLock, FaUsers, FaRocket, FaQuoteLeft } from 'react-icons/fa';
import '../styles/about.css';
import banner from "../assets/banner.png";

const About = () => {
    return (
        <div className="about-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background"></div>
                <div className="hero-content">
                    <h1 className="hero-title">Connect with Icons Through Crypto</h1>
                    <p className="hero-text">
                        Experience revolutionary AI-powered conversations with your favorite celebrities,
                        secured and authenticated by blockchain technology. Own tokens, unlock exclusive
                        interactions, and be part of a new era of fan engagement.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="mission-section">
                <div className="mission-grid">
                    <div className="mission-content">
                        <h2 className="mission-title">How It Works</h2>
                        <p className="mission-text">
                            Connect your crypto wallet and use MCGA tokens to unlock personalized
                            conversations with AI-powered versions of influential figures. Each
                            interaction is unique, secured by blockchain, and enhanced by
                            cutting-edge voice synthesis technology.
                        </p>
                        <p className="mission-text">
                            Our platform combines the security of blockchain with advanced AI to
                            create authentic, engaging conversations that feel remarkably real.
                            Choose your icon, start chatting, and experience interactions that
                            were never before possible.
                        </p>
                    </div>
                    <div className="mission-image-wrapper">
                        <div className="mission-image-background"></div>
                        <img
                            src={banner}
                            alt="Platform Preview"
                            className="mission-image"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="features-container">
                    <h2 className="features-title">Platform Features</h2>
                    <div className="features-grid">
                        {[
                            {
                                icon: FaLock,
                                title: "Blockchain Security",
                                description: "Your interactions and tokens are secured by Solana blockchain, ensuring transparent, verifiable ownership and access to exclusive content."
                            },
                            {
                                icon: FaUsers,
                                title: "AI-Powered Conversations",
                                description: "Experience natural, context-aware conversations powered by advanced language models and voice synthesis technology."
                            },
                            {
                                icon: FaRocket,
                                title: "Token-Gated Access",
                                description: "Use MCGA tokens to unlock premium characters, exclusive conversations, and special features in our decentralized ecosystem."
                            }
                        ].map((feature, index) => (
                            <div key={index} className="feature-card">
                                <feature.icon className="feature-icon" />
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Proposition Section (replacing Testimonials) */}
            <section className="testimonials-section">
                <div className="testimonials-container">
                    <h2 className="testimonials-title">Why MCGA Tokens?</h2>
                    <div className="testimonials-grid">
                        {[
                            {
                                title: "Exclusive Access",
                                description: "MCGA tokens are your key to unlocking premium characters and special features. The more tokens you hold, the more exclusive content you can access."
                            },
                            {
                                title: "Community Growth",
                                description: "As our platform expands with more celebrity personalities and features, early token holders will benefit from increased utility and platform adoption."
                            }
                        ].map((item, index) => (
                            <div key={index} className="testimonial-card">
                                <FaQuoteLeft className="quote-icon" />
                                <h3 className="testimonial-text font-bold mb-2">{item.title}</h3>
                                <p className="testimonial-text">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Start Chatting Today</h2>
                    <p className="cta-text">
                        Join the revolution in celebrity-fan interactions. Connect your wallet,
                        acquire MCGA tokens, and start having meaningful conversations with
                        your favorite personalities.
                    </p>
                    <div className="cta-buttons">
                        <button className="cta-button-primary">
                            Get MCGA Tokens
                        </button>
                        <button
                            className="cta-button-secondary"
                            onClick={() => window.location.href = '/'}
                        >
                            View Characters
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;