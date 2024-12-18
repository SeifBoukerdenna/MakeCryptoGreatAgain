// src/components/About.jsx

import { FaLock, FaUsers, FaRocket, FaQuoteLeft } from 'react-icons/fa';
import '../styles/about.css'; // Import the About page CSS
import banner from "../assets/banner.png"
const About = () => {
    return (
        <div className="about-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-background"></div>
                <div className="hero-content">
                    <h1 className="hero-title">About Make Crypto Great Again</h1>
                    <p className="hero-text">
                        We're harnessing the power of decentralization to revolutionize digital interactions,
                        creating meaningful connections between fans and their favorite personalities.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className="mission-section">
                <div className="mission-grid">
                    <div className="mission-content">
                        <h2 className="mission-title">Our Mission</h2>
                        <p className="mission-text">
                            We're democratizing access to exclusive interactions, breaking down barriers
                            between fans and their idols through innovative blockchain technology.
                        </p>
                        <p className="mission-text">
                            By leveraging decentralized platforms, we ensure every interaction is transparent,
                            secure, and authentic, creating unparalleled experiences for users worldwide.
                        </p>
                    </div>
                    <div className="mission-image-wrapper" style={{ transform: 'scale(1.5)' }}>
                        <div className="mission-image-background"></div>
                        <img
                            src={banner}
                            alt="Our Mission"
                            className="mission-image"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="features-container">
                    <h2 className="features-title">Why Choose Us?</h2>
                    <div className="features-grid">
                        {[
                            {
                                icon: FaLock,
                                title: "Secure & Transparent",
                                description: "State-of-the-art blockchain encryption ensuring your data and conversations remain protected and tamper-proof."
                            },
                            {
                                icon: FaUsers,
                                title: "Authentic Interactions",
                                description: "Connect with verified celebrities and industry leaders in real-time, ensuring genuine and meaningful conversations."
                            },
                            {
                                icon: FaRocket,
                                title: "Innovative Technology",
                                description: "Leading the integration of AI and blockchain for seamless, engaging experiences that keep you ahead of the curve."
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

            {/* Testimonials Section */}
            <section className="testimonials-section">
                <div className="testimonials-container">
                    <h2 className="testimonials-title">What Our Users Say</h2>
                    <div className="testimonials-grid">
                        {[
                            {
                                quote: "Make Crypto Great Again has transformed how I connect with my favorite artists. The interactions feel so real and personal!",
                                author: "Jane Doe"
                            },
                            {
                                quote: "The security and transparency provided by the platform give me peace of mind. It's a game-changer in the crypto space.",
                                author: "John Smith"
                            }
                        ].map((testimonial, index) => (
                            <div key={index} className="testimonial-card">
                                <FaQuoteLeft className="quote-icon" />
                                <blockquote className="testimonial-text">
                                    {testimonial.quote}
                                </blockquote>
                                <p className="testimonial-author">- {testimonial.author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-container">
                    <h2 className="cta-title">Join Our Revolution</h2>
                    <p className="cta-text">
                        Be part of the future of decentralized interactions. Your investment helps build
                        a platform that connects fans with their idols like never before.
                    </p>
                    <div className="cta-buttons">
                        <button className="cta-button-primary">
                            Buy Tokens
                        </button>
                        <button className="cta-button-secondary">
                            Learn More
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
