'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Download, AlertCircle } from 'lucide-react'

interface ShowstemsProps {
  vocals: string;
  accompaniment: string;
  originalFileName: string;
}

export function Showstems({ vocals, accompaniment, originalFileName }: ShowstemsProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMutedVocal, setIsMutedVocal] = useState(false)
  const [isMutedInstrumental, setIsMutedInstrumental] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canvasRefVocal = useRef<HTMLCanvasElement>(null)
  const canvasRefInstrumental = useRef<HTMLCanvasElement>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeVocalRef = useRef<AudioBufferSourceNode | null>(null)
  const sourceNodeInstrumentalRef = useRef<AudioBufferSourceNode | null>(null)
  const gainNodeVocalRef = useRef<GainNode | null>(null)
  const gainNodeInstrumentalRef = useRef<GainNode | null>(null)
  const startTimeRef = useRef<number>(0)
  const vocalBufferRef = useRef<AudioBuffer | null>(null)
  const instrumentalBufferRef = useRef<AudioBuffer | null>(null)

  useEffect(() => {
    console.log('Showstems component mounted with props:', { vocals, accompaniment, originalFileName });

    const loadAudio = async () => {
      try {
        console.log('Fetching vocal track:', vocals);
        const vocalResponse = await fetch(vocals)
        console.log('Vocal response status:', vocalResponse.status);

        console.log('Fetching instrumental track:', accompaniment);
        const instrumentalResponse = await fetch(accompaniment)
        console.log('Instrumental response status:', instrumentalResponse.status);

        if (!vocalResponse.ok || !instrumentalResponse.ok) {
          throw new Error('Failed to load audio files')
        }

        const vocalArrayBuffer = await vocalResponse.arrayBuffer()
        const instrumentalArrayBuffer = await instrumentalResponse.arrayBuffer()

        audioContextRef.current = new AudioContext()
        vocalBufferRef.current = await audioContextRef.current.decodeAudioData(vocalArrayBuffer)
        instrumentalBufferRef.current = await audioContextRef.current.decodeAudioData(instrumentalArrayBuffer)

        drawWaveform(canvasRefVocal, '#4a90e2', vocalBufferRef.current)
        drawWaveform(canvasRefInstrumental, '#50e3c2', instrumentalBufferRef.current)

        setDuration(vocalBufferRef.current.duration)
        setError(null)

        gainNodeVocalRef.current = audioContextRef.current.createGain()
        gainNodeVocalRef.current.gain.value = 1
        gainNodeInstrumentalRef.current = audioContextRef.current.createGain()
        gainNodeInstrumentalRef.current.gain.value = 1

        gainNodeVocalRef.current.connect(audioContextRef.current.destination)
        gainNodeInstrumentalRef.current.connect(audioContextRef.current.destination)

      } catch (error) {
        console.error('Error loading audio files:', error)
        setError('Failed to load audio files. Please try again.')
      }
    }

    loadAudio()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [vocals, accompaniment, originalFileName])

  const drawWaveform = (canvasRef: React.RefObject<HTMLCanvasElement>, color: string, audioBuffer: AudioBuffer) => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const data = audioBuffer.getChannelData(0)
        const step = Math.ceil(data.length / canvas.width)
        const amp = canvas.height / 2

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.beginPath()
        ctx.moveTo(0, amp)

        for (let i = 0; i < canvas.width; i++) {
          let min = 1.0
          let max = -1.0
          for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j]
            if (datum < min) min = datum
            if (datum > max) max = datum
          }
          ctx.lineTo(i, (1 + min) * amp)
          ctx.lineTo(i, (1 + max) * amp)
        }

        ctx.strokeStyle = color
        ctx.stroke()
      }
    }
  }

  const startPlayback = () => {
    if (audioContextRef.current && vocalBufferRef.current && instrumentalBufferRef.current) {
      // Stop any existing playback
      stopPlayback()

      sourceNodeVocalRef.current = audioContextRef.current.createBufferSource()
      sourceNodeVocalRef.current.buffer = vocalBufferRef.current
      sourceNodeVocalRef.current.connect(gainNodeVocalRef.current!)

      sourceNodeInstrumentalRef.current = audioContextRef.current.createBufferSource()
      sourceNodeInstrumentalRef.current.buffer = instrumentalBufferRef.current
      sourceNodeInstrumentalRef.current.connect(gainNodeInstrumentalRef.current!)

      sourceNodeVocalRef.current.start(0, currentTime)
      sourceNodeInstrumentalRef.current.start(0, currentTime)

      startTimeRef.current = audioContextRef.current.currentTime - currentTime

      sourceNodeVocalRef.current.onended = () => {
        setIsPlaying(false)
        setCurrentTime(0)
      }
    }
  }

  const stopPlayback = () => {
    if (sourceNodeVocalRef.current) {
      sourceNodeVocalRef.current.stop()
      sourceNodeVocalRef.current.disconnect()
      sourceNodeVocalRef.current = null
    }
    if (sourceNodeInstrumentalRef.current) {
      sourceNodeInstrumentalRef.current.stop()
      sourceNodeInstrumentalRef.current.disconnect()
      sourceNodeInstrumentalRef.current = null
    }
  }

  const togglePlayPause = () => {
    if (audioContextRef.current) {
      if (isPlaying) {
        audioContextRef.current.suspend()
        stopPlayback()
      } else {
        if (currentTime >= duration) {
          setCurrentTime(0)
        }
        audioContextRef.current.resume()
        startPlayback()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMuteVocal = () => {
    if (gainNodeVocalRef.current) {
      gainNodeVocalRef.current.gain.value = isMutedVocal ? 1 : 0
    }
    setIsMutedVocal(!isMutedVocal)
  }

  const toggleMuteInstrumental = () => {
    if (gainNodeInstrumentalRef.current) {
      gainNodeInstrumentalRef.current.gain.value = isMutedInstrumental ? 1 : 0
    }
    setIsMutedInstrumental(!isMutedInstrumental)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const downloadTrack = async (trackName: string) => {
    const fileUrl = trackName === 'vocal' ? vocals : accompaniment
    const fileName = originalFileName.replace(/\.[^/.]+$/, "")
    const extension = fileUrl.split('.').pop()
    const fullFileName = `${fileName}_${trackName === 'vocal' ? 'vocals' : 'instrumental'}.${extension}`

    try {
      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fullFileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading file:', error)
      setError('Failed to download the file. Please try again.')
    }
  }

  useEffect(() => {
    let animationFrameId: number = 0

    const updateTime = () => {
      if (audioContextRef.current && isPlaying) {
        const newTime = audioContextRef.current.currentTime - startTimeRef.current
        setCurrentTime(newTime >= duration ? duration : newTime)
        animationFrameId = requestAnimationFrame(updateTime)
      }
    }

    if (isPlaying) {
      updateTime()
    } else {
      cancelAnimationFrame(animationFrameId)
    }

    return () => cancelAnimationFrame(animationFrameId)
  }, [isPlaying, duration])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">VocalSplit Results</h1>
        {error ? (
          <div className="text-red-500 flex items-center justify-center mb-4">
            <AlertCircle className="mr-2" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center mb-4">
              <button
                onClick={togglePlayPause}
                className="bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 transition-colors"
                disabled={!duration}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </div>
            <div className="text-center text-gray-600 mb-4">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Vocal</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={toggleMuteVocal} 
                      className="text-gray-600 hover:text-gray-800"
                      disabled={!duration}
                    >
                      {isMutedVocal ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <button
                      onClick={() => downloadTrack('vocal')}
                      className="text-gray-600 hover:text-gray-800"
                      aria-label="Download vocal track"
                      disabled={!duration}
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>
                <canvas ref={canvasRefVocal} width="320" height="80" className="w-full" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Instrumental</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={toggleMuteInstrumental} 
                      className="text-gray-600 hover:text-gray-800"
                      disabled={!duration}
                    >
                      {isMutedInstrumental ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <button
                      onClick={() => downloadTrack('instrumental')}
                      className="text-gray-600 hover:text-gray-800"
                      aria-label="Download instrumental track"
                      disabled={!duration}
                    >
                      <Download size={20} />
                    </button>
                  </div>
                </div>
                <canvas ref={canvasRefInstrumental} width="320" height="80" className="w-full" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}