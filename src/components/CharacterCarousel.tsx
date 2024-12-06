import React from 'react'
import characters from '../characters'

export interface Character {
    id: number
    name: string
    img: string
}

interface CharacterCarouselProps {
    onSelect: (char: Character) => void
}

const CharacterCarousel: React.FC<CharacterCarouselProps> = ({ onSelect }) => {
    return (
        <div style={{
            display: 'flex',
            overflowX: 'auto',
            padding: '1rem',
            gap: '1rem',
            scrollSnapType: 'x mandatory',
            justifyContent: 'center',
            marginBottom: '3rem'
        }}>
            {characters.map((char) => (
                <div
                    key={char.id}
                    style={{
                        flex: '0 0 auto',
                        width: '80px',
                        textAlign: 'center',
                        scrollSnapAlign: 'center',
                        cursor: 'pointer',
                        color: '#0ff',
                        fontSize: '0.8rem'
                    }}
                    onClick={() => onSelect(char)}
                >
                    <img
                        src={char.img}
                        alt={char.name}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)'
                            e.currentTarget.style.boxShadow = '0 0 10px #0ff'
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    />
                    <span style={{ display: 'block', marginTop: '0.5rem', fontWeight: 500, textShadow: '0 0 5px #0ff' }}>
                        {char.name}
                    </span>
                </div>
            ))}
        </div>
    )
}

export default CharacterCarousel
