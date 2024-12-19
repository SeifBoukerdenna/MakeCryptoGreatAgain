// src/components/ThemeToggle.tsx

import React, { useEffect, useState } from 'react';
import Switch from 'react-switch';
import { FaSun, FaMoon } from 'react-icons/fa';

interface ThemeToggleProps {
    toggleTheme: () => void;
    theme: 'light' | 'dark';
}

interface SwitchColors {
    offColor: string;
    onColor: string;
    offHandleColor: string;
    onHandleColor: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ toggleTheme, theme }) => {
    const isDark = theme === 'dark';
    const [colors, setColors] = useState<SwitchColors>({
        offColor: '#888888',
        onColor: '#86d3ff',
        offHandleColor: '#ffffff',
        onHandleColor: '#2693e6',
    });

    useEffect(() => {
        const root = document.documentElement;
        const offColor = getComputedStyle(root).getPropertyValue('--toggle-bg-light').trim();
        const onColor = getComputedStyle(root).getPropertyValue('--toggle-bg-dark').trim();
        const offHandleColor = getComputedStyle(root).getPropertyValue('--toggle-handle-light').trim();
        const onHandleColor = getComputedStyle(root).getPropertyValue('--toggle-handle-dark').trim();

        setColors({
            offColor: offColor || '#888888',               // Fallback to default if undefined
            onColor: onColor || '#86d3ff',
            offHandleColor: offHandleColor || '#ffffff',
            onHandleColor: onHandleColor || '#2693e6',
        });
    }, [theme]); // Re-run if the theme changes

    return (
        <div className="flex items-center mr-4">
            <FaSun className="text-yellow-500 mr-2" />
            <Switch
                onChange={toggleTheme}
                checked={isDark}
                offColor={colors.offColor}
                onColor={colors.onColor}
                offHandleColor={colors.offHandleColor}
                onHandleColor={colors.onHandleColor}
                uncheckedIcon={
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            fontSize: 16,
                            paddingLeft: 2,
                        }}
                    >
                        {/* <FaSun color="#FFA500" /> Orange Sun */}
                    </div>
                }
                checkedIcon={
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            fontSize: 16,
                            paddingRight: 2,
                        }}
                    >
                        {/* <FaMoon color="#4B5563" /> Cool Gray Moon */}
                    </div>
                }
                height={24}
                width={48}
                handleDiameter={20}
                aria-label="Toggle Dark Mode"
                className="react-switch"
            />
            <FaMoon className="text-gray-700 ml-2" />
        </div>
    );
};

export default ThemeToggle;
