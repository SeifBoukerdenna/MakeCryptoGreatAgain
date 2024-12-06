import React, { useState } from 'react'

interface PromptInputProps {
    onSubmit: (prompt: string) => void
}

const PromptInput: React.FC<PromptInputProps> = ({ onSubmit }) => {
    const [value, setValue] = useState('')

    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value.trim())
            setValue('')
        }
    }

    return (
        <div style={{ marginBottom: '2rem' }}>
            <input
                type="text"
                placeholder="Ask your question..."
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                style={{
                    width: '100%', maxWidth: '400px', padding: '0.75rem',
                    fontSize: '1rem', borderRadius: '5px', border: '1px solid #ccc',
                    outline: 'none', marginBottom: '1rem'
                }}
            />
            <br />
            <button
                onClick={handleSubmit}
                style={{
                    padding: '0.5rem 1rem', fontSize: '1rem', borderRadius: '5px',
                    border: '1px solid #b22234', background: '#b22234', color: '#fff', cursor: 'pointer',
                    fontWeight: 'bold', letterSpacing: '0.5px', transition: 'background 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#a22234'}
                onMouseOut={(e) => e.currentTarget.style.background = '#b22234'}
            >
                Submit
            </button>
        </div>
    )
}

export default PromptInput
