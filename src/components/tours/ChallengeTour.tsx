import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, ACTIONS, EVENTS, STATUS } from 'react-joyride';

const ChallengeTour = () => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const steps: Step[] = [
        {
            target: '.token-holder-card',
            content: 'Welcome to Character Challenges! Here you can test your knowledge of each character and win MCGA tokens.',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '.holder-stats',
            content: 'Keep track of your progress and see how many characters have been solved by the community.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.pool-info',
            content: 'Each character has a token pool. If you guess their secret phrase correctly, you win all the tokens in their pool!',
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '.challenge-card input',
            content: 'Enter your guess for the secret phrase here. But choose wisely - there\'s a cooldown period between attempts!',
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '.challenge-button',
            content: 'Submit your guess when you\'re ready. You\'ll need to pay a small fee in MCGA tokens for each attempt.',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.winner-section',
            content: 'Check out who has already solved each character\'s challenge and how many tokens they won!',
            placement: 'top',
            disableBeacon: true,
        }
    ];

    useEffect(() => {
        const hasChallengeTour = localStorage.getItem('hasChallengeTour');
        if (!hasChallengeTour) {
            setRun(true);
        }
    }, []);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { action, index, status, type } = data;
        // @ts-ignore
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            localStorage.setItem('hasChallengeTour', 'true');
            setRun(false);
            setStepIndex(0);
            return;
        }

        // Update step index when navigating
        // @ts-ignore
        if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
            setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
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

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={steps}
            stepIndex={stepIndex}
            run={run}
            styles={{
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
            }}
        />
    );
};

export default ChallengeTour;