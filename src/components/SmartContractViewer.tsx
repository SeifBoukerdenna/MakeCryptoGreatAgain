import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { FaCopy, FaCheck, FaExternalLinkAlt, FaShieldAlt, FaLock, FaCode, FaCheckCircle } from 'react-icons/fa';
import '../styles/SmartContractViewer.css';

interface SmartContractViewerProps {
    code: string;
    language: string;
    theme: 'light' | 'dark';
}

const SmartContractViewer: React.FC<SmartContractViewerProps> = ({ code, language, theme }) => {
    const [copied, setCopied] = useState(false);
    const contractAddress = "DNsprXHccVbxFTE2RNvchU3E3W1Hn3U4yosFSiVs8bQT";

    const handleCopy = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const contractInstructions = [
        {
            title: "Initialize Pool",
            description: "Creates a new token pool with a secret hash. The pool holds MCGA tokens that can be won by guessing the secret phrase correctly.",
            function: "initialize_pool",
            icon: <FaLock />
        },
        {
            title: "Deposit Tokens",
            description: "Users deposit MCGA tokens into the pool to participate in the challenge. A small fee is required for each attempt.",
            function: "deposit",
            icon: <FaCode />
        },
        {
            title: "Check Hash",
            description: "Users submit their guess of the secret phrase. If correct, they win all tokens in the pool. The hash must match exactly to win.",
            function: "check_hash",
            icon: <FaCheckCircle />
        }
    ];

    const securityFeatures = [
        {
            title: "Program-Derived Authority (PDA)",
            description: "Token accounts are owned by PDAs, meaning only the program itself can transfer tokens. No admin or external party has access.",
            icon: <FaShieldAlt />
        },
        {
            title: "Secure Hash Verification",
            description: "Secret phrases are stored as secure hashes. Even if someone accessed the contract data, they couldn't reverse-engineer the answers.",
            icon: <FaLock />
        },
        {
            title: "Automatic Token Distribution",
            description: "If a user guesses correctly, tokens are transferred automatically by the program. No manual intervention or trust required.",
            icon: <FaCheckCircle />
        },
        {
            title: "No Admin Controls",
            description: "Once deployed, nobody can modify the contract or access its funds. The program operates autonomously based on its code.",
            icon: <FaShieldAlt />
        }
    ];

    return (
        <div className="contract-viewer-container">
            {/* Contract Info Card */}
            <div
                className="address-card"
            >
                {/* Contract Address Section */}
                <section className="contract-section">
                    <h3 className="address-card-header">Contract Address</h3>
                    <div className="address-content">
                        <div className="address-label">
                            <span>MCGA Pool</span>
                            <CopyToClipboard text={contractAddress} onCopy={handleCopy}>
                                <button className="copy-button">
                                    {copied ? (
                                        <FaCheck className="copy-success" />
                                    ) : (
                                        <FaCopy />
                                    )}
                                </button>
                            </CopyToClipboard>
                        </div>
                        <div className="contract-address">
                            {contractAddress}
                        </div>
                        <a
                            href={`https://solscan.io/account/${contractAddress}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="solscan-link"
                        >
                            View on Solscan
                            <FaExternalLinkAlt />
                        </a>
                    </div>
                </section>

                {/* Security Features Section */}
                <section className="contract-section mt-6">
                    <h3 className="address-card-header">Security Safeguards</h3>
                    <div className="security-features">
                        {securityFeatures.map((feature, index) => (
                            <div key={index} className="security-item">
                                <div className="security-icon">
                                    {feature.icon}
                                </div>
                                <div className="security-content">
                                    <h4 className="security-title">{feature.title}</h4>
                                    <p className="security-description">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="contract-section mt-6">
                    <h3 className="address-card-header">How It Works</h3>
                    <div className="instructions-content">
                        {contractInstructions.map((instruction, index) => (
                            <div key={instruction.function} className="instruction-item">
                                <div className="instruction-header">
                                    <span className="instruction-number">{index + 1}</span>
                                    <span className="instruction-icon">
                                        {instruction.icon}
                                    </span>
                                    <h4 className="instruction-title">{instruction.title}</h4>
                                </div>
                                <p className="instruction-description">
                                    {instruction.description}
                                </p>
                                <code className="instruction-function">
                                    {instruction.function}()
                                </code>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Code Viewer */}
            <div
                className="code-viewer"
            >
                <CopyToClipboard text={code} onCopy={handleCopy}>
                    <button
                        className="code-copy-button"
                    >
                        {copied ? (
                            <FaCheck className="copy-success" />
                        ) : (
                            <FaCopy />
                        )}
                    </button>
                </CopyToClipboard>

                <SyntaxHighlighter
                    language={language}
                    style={theme === 'light' ? materialLight : okaidia}
                    wrapLines
                    lineNumberStyle={{
                        color: theme === 'light' ? '#555' : '#888',
                        paddingRight: '10px'
                    }}
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
            </div>
        </div>
    );
};

export default SmartContractViewer;