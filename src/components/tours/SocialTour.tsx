import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, ACTIONS, EVENTS, STATUS } from 'react-joyride';

const SocialTour = () => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const steps: Step[] = [
        {
            target: '.token-holder-card',
            content: 'Check out our top users ranked by their interaction levels. The more you chat, the higher you climb!',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '.rank-badge.gold',
            content: 'Top users get special badges. Can you make it to #1?',
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '.character-stats-card',
            content: 'See which characters are the most popular and track their usage statistics.',
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '.character-stats-summary',
            content: 'Keep an eye on global statistics to see how the community is growing!',
            placement: 'bottom',
            disableBeacon: true,
        }
    ];

    useEffect(() => {
        const hasSocialTour = localStorage.getItem('hasSocialTour');
        if (!hasSocialTour) {
            setRun(true);
        }
    }, []);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { action, index, status, type } = data;
        // @ts-ignore
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            localStorage.setItem('hasSocialTour', 'true');
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

export default SocialTour;