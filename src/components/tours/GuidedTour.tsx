import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useWallet } from '@solana/wallet-adapter-react';
import useCharacterStore from '../../stores/useCharacterStore';

const GuidedTour = () => {
    const [switchTourRun, setSwitchTourRun] = useState(false);
    const [chatTourRun, setChatTourRun] = useState(false);
    const { connected } = useWallet();
    const selectedCharacter = useCharacterStore((state) => state.selectedCharacter);
    const [switchTourCompleted, setSwitchTourCompleted] = useState(false);
    const [hasCheckedLocalStorage, setHasCheckedLocalStorage] = useState(false);

    // Switch tour steps
    const switchSteps: Step[] = [
        {
            target: '.character-card .react-switch',
            content: 'Toggle between normal and secret modes. Secret mode reveals hidden challenges and special interactions!',
            placement: 'top',
            disableBeacon: true,
            styles: {
                options: {
                    backgroundColor: 'var(--card-bg-color)',
                }
            }
        }
    ];

    // Chat features tour steps
    const chatSteps: Step[] = [
        {
            target: '.chat-area',
            content: 'This is your chat area where you\'ll interact with the character',
            placement: 'top',
            disableBeacon: true,
            styles: {
                options: {
                    backgroundColor: 'var(--card-bg-color)',
                }
            }
        },
        {
            target: '.mic-button',
            content: 'Use voice input to speak with the character',
            placement: 'left',
            disableBeacon: true,
            styles: {
                options: {
                    backgroundColor: 'var(--card-bg-color)',
                }
            }
        },
        {
            target: '.camera-button',
            content: 'Record your conversation and create shareable video clips',
            placement: 'left',
            disableBeacon: true,
            styles: {
                options: {
                    backgroundColor: 'var(--card-bg-color)',
                }
            }
        },
        {
            target: '.prompt-input-container',
            content: 'Type your message here and press send to chat with the character',
            placement: 'top',
            disableBeacon: true,
            styles: {
                options: {
                    backgroundColor: 'var(--card-bg-color)',
                }
            }
        }
    ];

    // Check localStorage only once on component mount
    useEffect(() => {
        const hasSwitchTour = localStorage.getItem('hasSwitchTour');
        const hasChatTour = localStorage.getItem('hasChatTour');
        setSwitchTourCompleted(!!hasSwitchTour);
        setHasCheckedLocalStorage(true);
    }, []);

    // Start switch tour on initial connection
    useEffect(() => {
        if (connected && !switchTourCompleted && hasCheckedLocalStorage && !localStorage.getItem('hasSwitchTour')) {
            setSwitchTourRun(true);
        }
    }, [connected, switchTourCompleted, hasCheckedLocalStorage]);

    // Start chat tour only after switch tour is completed and if it hasn't been shown before
    useEffect(() => {
        if (selectedCharacter && switchTourCompleted && hasCheckedLocalStorage && !localStorage.getItem('hasChatTour')) {
            setTimeout(() => setChatTourRun(true), 300);
        }
    }, [selectedCharacter, switchTourCompleted, hasCheckedLocalStorage]);

    const handleSwitchTourCallback = (data: CallBackProps) => {
        const { status } = data;
        // @ts-ignore
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            localStorage.setItem('hasSwitchTour', 'true');
            setSwitchTourCompleted(true);
            setSwitchTourRun(false);
        }
    };

    const handleChatTourCallback = (data: CallBackProps) => {
        const { status } = data;
        // @ts-ignore
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            localStorage.setItem('hasChatTour', 'true');
            setChatTourRun(false);
        }
    };

    const getThemeColors = () => {
        const style = getComputedStyle(document.documentElement);
        return {
            primary: style.getPropertyValue('--button-bg').trim() || 'linear-gradient(90deg, #6366F1 0%, #D946EF 100%)',
            text: style.getPropertyValue('--text-color').trim() || '#F9FAFB',
            background: style.getPropertyValue('--card-bg-color').trim() || '#1F2937',
            border: style.getPropertyValue('--card-border').trim() || 'rgba(147, 51, 234, 0.2)',
        };
    };

    const colors = getThemeColors();
    const tourStyles = {
        options: {
            arrowColor: colors.background,
            backgroundColor: colors.background,
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            primaryColor: '#D946EF',
            textColor: colors.text,
            zIndex: 1000,
            width: 300,
        },
        tooltip: {
            borderRadius: '1rem',
            fontSize: '0.875rem',
            border: `1px solid ${colors.border}`,
        },
        buttonNext: {
            background: colors.primary,
            borderRadius: '0.5rem',
            color: '#ffffff',
            padding: '0.5rem 1rem',
        },
        buttonBack: {
            marginRight: '0.5rem',
            color: colors.text,
        },
        buttonSkip: {
            color: colors.text,
        },
        spotlight: {
            backgroundColor: 'transparent',
        }
    };

    // Don't render anything if both tours have been completed
    if (localStorage.getItem('hasSwitchTour') && localStorage.getItem('hasChatTour')) {
        return null;
    }

    return (
        <>
            {/* Switch Tour */}
            <Joyride
                callback={handleSwitchTourCallback}
                continuous={true}
                hideCloseButton
                scrollToFirstStep
                showProgress
                showSkipButton
                steps={switchSteps}
                run={switchTourRun}
                styles={tourStyles}
            />

            {/* Chat Features Tour */}
            {switchTourCompleted && (
                <Joyride
                    callback={handleChatTourCallback}
                    continuous={true}
                    hideCloseButton
                    scrollToFirstStep
                    showProgress
                    showSkipButton
                    steps={chatSteps}
                    run={chatTourRun}
                    styles={tourStyles}
                />
            )}
        </>
    );
};

export default GuidedTour;