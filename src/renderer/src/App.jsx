import { useState, useEffect } from 'react'
import SourceSelector from './SourceSelector'
import ScreenRecorder from './ScreenRecorder'

function App() {
    const [sessionId, setSessionId] = useState(null)
    const [selectedSourceId, setSelectedSourceId] = useState(null)

    useEffect(() => {
        // Generate a session ID
        if (window.electronAPI) {
            window.electronAPI.generateSessionId().then(id => {
                setSessionId(id)
            })
        }
    }, [])

    const handleSourceSelect = (sourceId) => {
        setSelectedSourceId(sourceId)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <main className="container mx-auto px-6 py-8 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">🎥 Screen & Webcam Recorder</h1>
                    <p className="text-gray-600 text-lg">Built with Electron + React + Vite</p>
                    {sessionId && (
                        <div className="mt-3">
                            <span className="inline-block bg-white/60 backdrop-blur-sm rounded-lg px-4 py-2 text-sm font-mono text-gray-600">
                                Session: {sessionId}
                            </span>
                        </div>
                    )}
                </div>

                {/* Source Selector */}
                <SourceSelector
                    onSourceSelect={handleSourceSelect}
                    selectedSourceId={selectedSourceId}
                />

                {/* Screen Recorder */}
                <ScreenRecorder
                    selectedSourceId={selectedSourceId}
                    sessionId={sessionId}
                />

                {/* Instructions */}
                <section className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 mt-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">📋 How to Use</h3>
                    <ol className="space-y-2 text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">1.</span>
                            Select a screen or window from the sources above
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">2.</span>
                            Click "Start Recording" to begin capturing your screen
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">3.</span>
                            Click "Stop Recording" when finished
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-indigo-500 font-bold">4.</span>
                            Your recording will be saved in the <code className="bg-gray-200 px-2 py-1 rounded text-sm">videos/</code> folder
                        </li>
                    </ol>
                </section>
            </main>
        </div>
    )
}

export default App
