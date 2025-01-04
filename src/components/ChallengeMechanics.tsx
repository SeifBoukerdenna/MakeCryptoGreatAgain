import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Lock, CheckCircle2, XCircle } from 'lucide-react';
import '../styles/ChallengeMechanics.css';

const ChallengeMechanics = () => {
    const [selectedStep, setSelectedStep] = useState<number | null>(null);

    const steps = [
        {
            title: "Initial Attempt",
            description: "To make an attempt at solving a character's challenge, your wallet will first prompt you to approve sending MCGA tokens to the challenge pool.",
            icon: <Lock className="icon-lock" />,
            alert: "If you cancel this transaction, no tokens will be transferred and no attempt will be recorded."
        },
        {
            title: "Token Transfer",
            description: "Once you confirm the first transaction, your tokens are automatically transferred to the challenge pool, regardless of whether your answer is correct or not.",
            icon: <ArrowRight className="icon-arrow" />
        },
        {
            title: "Hash Verification",
            description: "A second transaction will appear to verify your answer. At this point, Phantom will show you the result:",
            icon: <AlertCircle className="icon-alert" />,
            outcomes: [
                {
                    title: "Correct Hash",
                    description: "You'll see the full pool amount ready to be transferred to your wallet. Make sure to CONFIRM this transaction - canceling it means losing the tokens forever!",
                    icon: <CheckCircle2 className="icon-check" />
                },
                {
                    title: "Incorrect Hash",
                    description: "You'll see a placeholder transaction that won't affect your wallet. Whether you confirm or cancel it doesn't matter - a cooldown will be applied based on your current MCGA token holdings.",
                    icon: <XCircle className="icon-x" />
                }
            ]
        }
    ];

    return (
        <div className="challenge-mechanics">
            <div className="challenge-mechanics-container">
                <h2 className="challenge-mechanics-title">
                    How Challenges Work
                </h2>

                <div className="steps-grid">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className={`step-card ${selectedStep === index ? 'selected' : ''}`}
                            tabIndex={0}
                            role="button"
                            aria-pressed={selectedStep === index}
                        >
                            <div className="step-header">
                                <div className="step-icon">
                                    {step.icon}
                                </div>
                                <h3 className="step-title">
                                    {step.title}
                                </h3>
                            </div>

                            <p className="step-description">
                                {step.description}
                            </p>

                            {step.alert && (
                                <div className="step-alert">
                                    {step.alert}
                                </div>
                            )}

                            {step.outcomes && (
                                <div className="outcomes-container">
                                    {step.outcomes.map((outcome, idx) => (
                                        <div key={idx} className="outcome-card">
                                            <div className="outcome-header">
                                                <span className="outcome-icon">
                                                    {outcome.icon}
                                                </span>
                                                <h4 className="outcome-title">
                                                    {outcome.title}
                                                </h4>
                                            </div>
                                            <p className="outcome-description">
                                                {outcome.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChallengeMechanics;