import React from 'react'

const Header: React.FC = () => {
    return (
        <header style={{
            position: 'fixed',
            top: 0,
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            padding: '1rem 2rem',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 100,
            borderBottom: '10px solid #b22234'
        }}>
            <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#3c3b6e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
            }}>
                <span style={{ fontSize: '2rem' }}>⭐</span> American Dream Chat
            </div>
            <button style={{
                padding: '0.5rem 1rem',
                borderRadius: '5px',
                border: '1px solid #3c3b6e',
                background: '#3c3b6e',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s ease'
            }}
                onMouseOver={(e) => e.currentTarget.style.background = '#2c2b5e'}
                onMouseOut={(e) => e.currentTarget.style.background = '#3c3b6e'}
                onClick={() => alert('Redirect to buy coin page!')}
            >
                Buy Coin
            </button>
        </header>
    )
}

export default Header
