// src/components/ThemeToggle.tsx

import React from 'react';
import Switch from 'react-switch';
import { FaSun, FaMoon } from 'react-icons/fa';

interface ThemeToggleProps {
    toggleTheme: () => void;
    theme: 'light' | 'dark';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ toggleTheme, theme }) => {
    return (
        <div className="flex items-center mr-4">
            <Switch
                onChange={toggleTheme}
                checked={theme === 'dark'}
                offColor="var(--button-bg)"
                onColor="var(--button-bg)"
                offHandleColor="#ffffff"
                onHandleColor="#ffffff"
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
                        <FaSun color="yellow" />
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
                            paddingLeft: 2,
                        }}
                    >
                        <FaMoon color="white" />
                    </div>
                }
                height={24}
                width={48}
                handleDiameter={20}
                aria-label="Toggle Dark Mode"
            />
        </div>
    );
};

export default ThemeToggle;
