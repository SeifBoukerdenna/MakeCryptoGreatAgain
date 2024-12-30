import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Stylish theme with purples
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface SmartContractViewerProps {
    code: string;
    language: string;
    theme: 'light' | 'dark'; // Add theme prop
}

const SmartContractViewer: React.FC<SmartContractViewerProps> = ({ code, language, theme }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            className={`relative rounded-lg shadow-lg overflow-hidden ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
                }`}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1 }}
        >
            {/* Copy Button */}
            <CopyToClipboard text={code} onCopy={handleCopy}>
                <motion.button
                    className={`absolute top-4 right-4 p-2 rounded-md shadow hover:shadow-lg transition-all ${theme === 'light' ? 'bg-gray-300 text-gray-800' : 'bg-gray-700 text-white'
                        }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {copied ? (
                        <FaCheck className={`${theme === 'light' ? 'text-green-500' : 'text-green-400'}`} />
                    ) : (
                        <FaCopy />
                    )}
                </motion.button>
            </CopyToClipboard>

            {/* Code Block */}
            <SyntaxHighlighter
                language={language}
                style={theme === 'light' ? materialLight : okaidia} // Apply theme-based styling
                wrapLines
                lineNumberStyle={{ color: theme === 'light' ? '#555' : '#888', paddingRight: '10px' }}
                customStyle={{
                    margin: 0,
                    padding: '2rem',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    borderRadius: '0.5rem',
                }}
            >
                {code}
            </SyntaxHighlighter>
        </motion.div>
    );
};

export default SmartContractViewer;
