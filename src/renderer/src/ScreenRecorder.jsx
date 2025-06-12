import { useState, useRef } from 'react'

function ScreenRecorder({ selectedSourceId, sessionId }) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [webcamEnabled, setWebcamEnabled] = useState(false)
    const [webcamStream, setWebcamStream] = useState(null)

    const mediaRecorderRef = useRef(null)
    const webcamRecorderRef = useRef(null)
    const streamRef = useRef(null)
    const webcamStreamRef = useRef(null)
    const chunksRef = useRef([])
    const webcamChunksRef = useRef([])
    const timerRef = useRef(null)
    const webcamVideoRef = useRef(null)

    const startRecording = async () => {
        if (!selectedSourceId) {
            alert('Please select a screen source first')
            return
        }

        try {
            // Get screen stream using chromeMediaSourceId
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: selectedSourceId,
                        maxWidth: 1920,
                        maxHeight: 1080
                    }
                }
            })

            streamRef.current = stream
            chunksRef.current = []

            // Get webcam stream if enabled
            let webcamStream = null
            if (webcamEnabled) {
                try {
                    webcamStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 640, height: 480 },
                        audio: false
                    })
                    webcamStreamRef.current = webcamStream
                    webcamChunksRef.current = []
                    setWebcamStream(webcamStream)

                    // Set webcam preview
                    if (webcamVideoRef.current) {
                        webcamVideoRef.current.srcObject = webcamStream
                    }
                } catch (webcamError) {
                    console.error('Failed to get webcam stream:', webcamError)
                    alert('Failed to access webcam. Screen recording will continue without webcam.')
                }
            }

            // Create MediaRecorder for screen
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm;codecs=vp8'
            })

            mediaRecorderRef.current = mediaRecorder

            // Handle screen recording data
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            // Create MediaRecorder for webcam if available
            if (webcamStream) {
                const webcamRecorder = new MediaRecorder(webcamStream, {
                    mimeType: 'video/webm;codecs=vp8'
                })

                webcamRecorderRef.current = webcamRecorder

                // Handle webcam recording data
                webcamRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        webcamChunksRef.current.push(event.data)
                    }
                }

                webcamRecorder.start()
            }

            // Handle recording stop
            mediaRecorder.onstop = async () => {
                // Save screen recording
                const blob = new Blob(chunksRef.current, { type: 'video/webm' })
                const buffer = await blob.arrayBuffer()

                try {
                    const result = await window.electronAPI.saveRecording(buffer, 'screen', sessionId)
                    if (result.success) {
                        console.log('Screen recording saved:', result.filePath)
                    } else {
                        console.error('Failed to save screen recording:', result.error)
                    }
                } catch (error) {
                    console.error('Error saving screen recording:', error)
                }

                // Save webcam recording if available
                if (webcamRecorderRef.current && webcamChunksRef.current.length > 0) {
                    const webcamBlob = new Blob(webcamChunksRef.current, { type: 'video/webm' })
                    const webcamBuffer = await webcamBlob.arrayBuffer()

                    try {
                        const webcamResult = await window.electronAPI.saveRecording(webcamBuffer, 'webcam', sessionId)
                        if (webcamResult.success) {
                            console.log('Webcam recording saved:', webcamResult.filePath)
                        } else {
                            console.error('Failed to save webcam recording:', webcamResult.error)
                        }
                    } catch (error) {
                        console.error('Error saving webcam recording:', error)
                    }
                }

                // Cleanup
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                    streamRef.current = null
                }

                if (webcamStreamRef.current) {
                    webcamStreamRef.current.getTracks().forEach(track => track.stop())
                    webcamStreamRef.current = null
                    setWebcamStream(null)
                }

                alert('Recording saved successfully!')
            }

            // Start recording
            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

            console.log('Recording started')

        } catch (error) {
            console.error('Error starting recording:', error)
            alert('Error starting recording: ' + error.message)
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()

            // Stop webcam recording if it exists
            if (webcamRecorderRef.current) {
                webcamRecorderRef.current.stop()
            }

            setIsRecording(false)

            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            console.log('Recording stopped')
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 relative">
            <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                🖥️ Screen & Webcam Recording
            </h3>

            {selectedSourceId ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                            Source: {selectedSourceId}
                        </span>
                        {isRecording && (
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-mono text-red-600">
                                    {formatTime(recordingTime)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Webcam Toggle */}
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={webcamEnabled}
                                onChange={(e) => setWebcamEnabled(e.target.checked)}
                                disabled={isRecording}
                                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">
                                📹 Include Webcam Recording
                            </span>
                        </label>
                    </div>

                    <div className="flex gap-3">
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-2"
                            >
                                ⏺️ Start Recording
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-2"
                            >
                                ⏹️ Stop Recording
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-gray-500 text-center py-4">
                    Please select a screen source to start recording
                </p>
            )}

            {/* Webcam Preview - Small corner box */}
            {isRecording && webcamStream && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className="bg-black rounded-lg overflow-hidden shadow-lg border-2 border-white">
                        <video
                            ref={webcamVideoRef}
                            autoPlay
                            muted
                            className="w-32 h-24 object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                            WEBCAM
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ScreenRecorder