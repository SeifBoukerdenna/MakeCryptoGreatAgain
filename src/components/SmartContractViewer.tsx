// src/components/SmartContractViewer.tsx
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { motion } from 'framer-motion';
interface SmartContractViewerProps {
    code: string;
    language: string;
}

const SmartContractViewer: React.FC<SmartContractViewerProps> = ({ code, language }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            className="relative bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1 }}
        >
            {/* Copy Button */}
            <CopyToClipboard text={code} onCopy={handleCopy}>
                <motion.button
                    className="absolute top-4 right-4 bg-gray-700 text-white p-2 rounded-md hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    {copied ? <FaCheck /> : <FaCopy />}
                </motion.button>
            </CopyToClipboard>

            {/* Code Block */}
            <SyntaxHighlighter
                language={language}
                style={okaidia}
                wrapLines
                lineNumberStyle={{ color: '#888', paddingRight: '10px' }}
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
