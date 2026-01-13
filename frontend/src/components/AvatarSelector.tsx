import { useState } from 'react'
import './AvatarSelector.css'

const AVATARS = [
  '/Avatar/Avatar 1.png',
  '/Avatar/Avatar 2.png',
  '/Avatar/Avatar 3.png',
  '/Avatar/Avatar 4.png',
  '/Avatar/Avatar 5.png',
  '/Avatar/Avatar 6.png',
  '/Avatar/Avatar 7.png',
  '/Avatar/Avatar 8.png',
]

interface AvatarSelectorProps {
  selectedAvatar: string
  onSelectAvatar: (avatar: string) => void
}

export function AvatarSelector({ selectedAvatar, onSelectAvatar }: AvatarSelectorProps) {
  return (
    <div className="avatar-selector">
      <label className="avatar-selector-label">
        <span>Choose Your Avatar</span>
      </label>
      <div style={{ display: 'flex', gridTemplateColumns: 'repeat(3, 1fr)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} className="avatar-grid">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            type="button"
            className={`avatar-option ${selectedAvatar === avatar ? 'selected' : ''}`}
            onClick={() => onSelectAvatar(avatar)}
            aria-label={`Select avatar ${avatar.split('/').pop()}`}
          >
            <img src={avatar} alt={`Avatar ${avatar.split('/').pop()}`} />
            {selectedAvatar === avatar && <div className="avatar-checkmark">✓</div>}
          </button>
        ))}
      </div>
    </div>
  )
}
