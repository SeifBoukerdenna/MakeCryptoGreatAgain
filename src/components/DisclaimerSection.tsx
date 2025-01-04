import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import "../styles/Disclaimer.css"

const DisclaimerSection = () => {
    return (
        <motion.section
            className="disclaimer-section"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
        >
            <div className="disclaimer-container">
                <div className="disclaimer-content">
                    <AlertTriangle className="disclaimer-icon" />
                    <div className="disclaimer-text">
                        <h3 className="disclaimer-title">
                            Educational Purpose Disclaimer
                        </h3>
                        <p className="disclaimer-paragraph">
                            MCGA is an educational project designed to explore the intersection of AI, blockchain technology, and historical figures. The AI-generated responses and personalities are simulations intended for entertainment and educational purposes only.
                        </p>
                        <p className="disclaimer-paragraph">
                            We do not endorse, promote, or condone any controversial views, statements, or actions that may be expressed by the AI characters. Our goal is to provide a unique learning experience while examining historical perspectives and technological innovation in a responsible manner. All interactions are simulated and should not be interpreted as real statements or opinions from the actual figures represented.
                        </p>
                    </div>
                </div>
            </div>
        </motion.section>
    );
};

export default DisclaimerSection;