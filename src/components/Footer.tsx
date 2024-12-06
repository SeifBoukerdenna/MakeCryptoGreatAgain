import React from 'react'

const Footer: React.FC = () => {
    return (
        <footer style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.9rem', marginTop: '3rem' }}>
            &copy; {new Date().getFullYear()} American Dream Chat. <span style={{ fontSize: '1.2rem' }}>🇺🇸</span>
        </footer>
    )
}

export default Footer
