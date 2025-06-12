import { useState, useEffect } from 'react'

function SourceSelector({ onSourceSelect, selectedSourceId }) {
    const [sources, setSources] = useState([])
    const [loading, setLoading] = useState(false)

    const loadSources = async () => {
        setLoading(true)
        try {
            const sources = await window.electronAPI.getScreenSources()
            setSources(sources)
        } catch (error) {
            console.error('Error getting sources:', error)
            alert('Error getting sources: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSources()
    }, [])

    const handleSourceSelect = (sourceId) => {
        onSourceSelect(sourceId)
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                    📺 Select Screen Source
                </h3>
                <button
                    onClick={loadSources}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm"
                >
                    {loading ? 'Loading...' : 'Refresh'}
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading sources...</p>
                </div>
            ) : sources.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sources.map((source) => (
                        <div
                            key={source.id}
                            onClick={() => handleSourceSelect(source.id)}
                            className={`bg-white rounded-lg p-4 shadow-sm border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${selectedSourceId === source.id
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <img
                                    src={source.thumbnail}
                                    alt={source.name}
                                    className="w-full h-20 object-cover rounded border"
                                />
                                <div className="text-center w-full">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {source.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                        {source.id}
                                    </p>
                                </div>
                                {selectedSourceId === source.id && (
                                    <div className="w-full text-center">
                                        <span className="inline-block bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                                            ✓ Selected
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-gray-500">No sources available</p>
                    <button
                        onClick={loadSources}
                        className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm underline"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    )
}

export default SourceSelector
