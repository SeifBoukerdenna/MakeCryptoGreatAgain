import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, ACTIONS, EVENTS, STATUS } from 'react-joyride';

const RoadmapTour = () => {
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);

    const steps: Step[] = [
        {
            target: '.roadmap-header',
            content: 'Welcome to the Character Roadmap! Here you can vote on which character should be added to the platform next.',
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '.stat-card:nth-child(1)',
            content: 'Keep track of the remaining time in the current voting period. Make sure to cast your vote before it ends!',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.voting-power',
            content: 'Your voting power increases with your MCGA token holdings. Hold up to 100k MCGA tokens to get maximum voting power of 100x!',
            placement: 'bottom',
            disableBeacon: true,
        },
        {
            target: '.chart-section',
            content: 'This pie chart shows the current distribution of votes among the proposed characters.',
            placement: 'left',
            disableBeacon: true,
        },
        {
            target: '.vote-card:first-child',
            content: 'Each character card shows their current ranking, vote count, and percentage of total votes.',
            placement: 'right',
            disableBeacon: true,
        },
        {
            target: '.vote-progress-bar',
            content: 'The progress bar visualizes each character\'s share of the total votes.',
            placement: 'top',
            disableBeacon: true,
        },
        {
            target: '.vote-button',
            content: 'Click here to cast your vote. You can change your vote at any time during the voting period.',
            placement: 'bottom',
            disableBeacon: true,
        }
    ];

    useEffect(() => {
        const hasRoadmapTour = localStorage.getItem('hasRoadmapTour');
        if (!hasRoadmapTour) {
            setRun(true);
        }
    }, []);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { action, index, status, type } = data;
        // @ts-ignore
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            localStorage.setItem('hasRoadmapTour', 'true');
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

export default RoadmapTour;