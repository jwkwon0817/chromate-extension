import React, { useState } from 'react'
import VoiceControl from './components/VoiceControl'
import HelpPage from './components/Help'

const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<'main' | 'help'>('main')

    return (
        <div className="min-h-screen bg-black rounded-[24px] overflow-hidden">
            {currentPage === 'main' ? (
                <VoiceControl onHelpClick={() => setCurrentPage('help')} />
            ) : (
                <HelpPage onBack={() => setCurrentPage('main')} />
            )}
        </div>
    )
}

export default App