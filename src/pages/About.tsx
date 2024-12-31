import { FaLock, FaUsers, FaRocket, FaQuoteLeft } from 'react-icons/fa';
import '../styles/about.css';
import banner from "../assets/banner.png";
import SmartContractViewer from '../components/SmartContractViewer';
import { motion } from 'framer-motion';

interface AboutProps {
    theme: 'light' | 'dark';
}
const About = ({ theme }: AboutProps) => {
    const contractCode = `
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("DNsprXHccVbxFTE2RNvchU3E3W1Hn3U4yosFSiVs8bQT");

#[program]
pub mod mcga_pool {
    use super::*;

    pub fn initialize_pool(ctx: Context<InitializePool>, seed: String, secret_hash: String) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.token_account = ctx.accounts.pool_token_account.key();
        pool.secret_hash = secret_hash;
        pool.seed = seed;
        Ok(())
    }

    // First step: Just deposit tokens
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let transfer_to_pool = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };

        let cpi_ctx_to_pool = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            transfer_to_pool,
        );

        token::transfer(cpi_ctx_to_pool, amount)?;
        Ok(())
    }

    // Second step: Check hash and potentially win pool
    pub fn check_hash(ctx: Context<Deposit>, attempt_hash: String) -> Result<()> {
        let pool = &ctx.accounts.pool;

        // Only transfer if hash matches
        if attempt_hash == pool.secret_hash {
            let pool_balance = ctx.accounts.pool_token_account.amount;

            let transfer_to_user = Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            };

            let seeds = &[
                pool.seed.as_bytes(),
                &[ctx.bumps.pool],
            ];
            let signer = &[&seeds[..]];

            let cpi_ctx_to_user = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                transfer_to_user,
                signer,
            );

            token::transfer(cpi_ctx_to_user, pool_balance)?;
        }

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(seed: String, secret_hash: String)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 64 + 64 + 8,
        seeds = [seed.as_bytes()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = authority,
        token::mint = mcga_mint,
        token::authority = pool,
    )]
    pub pool_token_account: Account<'info, TokenAccount>,
    pub mcga_mint: Account<'info, token::Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        seeds = [pool.seed.as_bytes()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        mut,
        constraint = pool_token_account.key() == pool.token_account
    )]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub secret_hash: String,
    pub seed: String,
}
`;
    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                staggerChildren: 0.2,
                duration: 0.8,
                ease: "easeOut",
            }
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="about-container">
            {/* Hero Section */}
            <motion.section
                className="hero-section"
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
            >
                <div className="hero-background"></div>
                <div className="hero-content">
                    <motion.h1
                        className="hero-title"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.3 }}
                    >
                        Connect with Icons Through Crypto
                    </motion.h1>
                    <motion.p
                        className="hero-text"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                    >
                        Experience revolutionary AI-powered conversations with your favorite celebrities,
                        secured and authenticated by blockchain technology. Own tokens, unlock exclusive
                        interactions, and be part of a new era of fan engagement.
                    </motion.p>
                </div>
            </motion.section>

            {/* Mission Section */}
            <motion.section
                className="mission-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={containerVariants}
            >
                <div className="mission-grid">
                    <motion.div className="mission-content" variants={containerVariants}>
                        <motion.h2 className="mission-title" variants={itemVariants}>
                            How It Works
                        </motion.h2>
                        <motion.p className="mission-text" variants={itemVariants}>
                            Connect your crypto wallet and use MCGA tokens to unlock personalized
                            conversations with AI-powered versions of influential figures. Each
                            interaction is unique, secured by blockchain, and enhanced by
                            cutting-edge voice synthesis technology.
                        </motion.p>
                        <motion.p className="mission-text" variants={itemVariants}>
                            Our platform combines the security of blockchain with advanced AI to
                            create authentic, engaging conversations that feel remarkably real.
                            Choose your icon, start chatting, and experience interactions that
                            were never before possible.
                        </motion.p>
                    </motion.div>
                    <motion.div className="mission-image-wrapper" variants={itemVariants}>
                        <div className="mission-image-background"></div>
                        <img
                            src={banner}
                            alt="Platform Preview"
                            className="mission-image"
                        />
                    </motion.div>
                </div>
            </motion.section>

            {/* Features Section */}
            <motion.section
                className="features-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={containerVariants}
            >
                <div className="features-container">
                    <motion.h2 className="features-title" variants={itemVariants}>
                        Platform Features
                    </motion.h2>
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
                            <motion.div
                                key={index}
                                className="feature-card"
                                variants={itemVariants}
                                whileHover={{ scale: 1.05, boxShadow: '0px 10px 20px rgba(0,0,0,0.2)' }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <feature.icon className="feature-icon" />
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Value Proposition Section (replacing Testimonials) */}
            <motion.section
                className="testimonials-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={containerVariants}
            >
                <div className="testimonials-container">
                    <motion.h2 className="testimonials-title" variants={itemVariants}>
                        Why MCGA Tokens?
                    </motion.h2>
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
                            <motion.div
                                key={index}
                                className="testimonial-card"
                                variants={itemVariants}
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 200 }}
                            >
                                <FaQuoteLeft className="quote-icon" />
                                <h3 className="testimonial-text font-bold mb-2">{item.title}</h3>
                                <p className="testimonial-text">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* CTA Section */}
            <motion.section
                className="cta-section"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 1 }}
            >
                <div className="cta-container">
                    <motion.h2
                        className="cta-title"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                    >
                        Start Chatting Today
                    </motion.h2>
                    <motion.p
                        className="cta-text"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                    >
                        Join the revolution in celebrity-fan interactions. Connect your wallet,
                        acquire MCGA tokens, and start having meaningful conversations with
                        your favorite personalities.
                    </motion.p>
                </div>
                <div className="contract-viewer-section">
                    <div className="contract-viewer-wrapper">
                        <SmartContractViewer code={contractCode} language="rust" theme={theme} />
                    </div>
                </div>

            </motion.section>
        </div>

    );
};

export default About;