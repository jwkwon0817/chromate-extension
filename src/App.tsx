import React from 'react'
import VoiceControl from './components/VoiceControl'

const App: React.FC = () => {
    return (
        <div className="min-h-screen bg-black rounded-[24px] overflow-hidden">
            <VoiceControl />
        </div>
    )
}

export default App