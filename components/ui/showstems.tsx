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

  const audioRefVocal = useRef<HTMLAudioElement>(null)
  const audioRefInstrumental = useRef<HTMLAudioElement>(null)
  const canvasRefVocal = useRef<HTMLCanvasElement>(null)
  const canvasRefInstrumental = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    console.log('Showstems component mounted with props:', { vocals, accompaniment, originalFileName });

    if (audioRefVocal.current && audioRefInstrumental.current) {
      audioRefVocal.current.src = vocals
      audioRefInstrumental.current.src = accompaniment

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

          const audioContext = new AudioContext()
          const vocalAudioBuffer = await audioContext.decodeAudioData(vocalArrayBuffer)
          const instrumentalAudioBuffer = await audioContext.decodeAudioData(instrumentalArrayBuffer)

          drawWaveform(canvasRefVocal, '#4a90e2', vocalAudioBuffer)
          drawWaveform(canvasRefInstrumental, '#50e3c2', instrumentalAudioBuffer)

          setError(null)
        } catch (error) {
          console.error('Error loading audio files:', error)
          setError('Failed to load audio files. Please try again.')
        }
      }

      loadAudio()
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

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRefVocal.current?.pause()
      audioRefInstrumental.current?.pause()
    } else {
      audioRefVocal.current?.play()
      audioRefInstrumental.current?.play()
    }
    setIsPlaying(!isPlaying)
  }

  const toggleMuteVocal = () => {
    if (audioRefVocal.current) {
      audioRefVocal.current.muted = !isMutedVocal
    }
    setIsMutedVocal(!isMutedVocal)
  }

  const toggleMuteInstrumental = () => {
    if (audioRefInstrumental.current) {
      audioRefInstrumental.current.muted = !isMutedInstrumental
    }
    setIsMutedInstrumental(!isMutedInstrumental)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const downloadTrack = (trackName: string) => {
    const link = document.createElement('a')
    const fileUrl = trackName === 'vocal' ? vocals : accompaniment
    const fileName = originalFileName.replace(/\.[^/.]+$/, "")
    const extension = fileUrl.split('.').pop()
    
    link.href = fileUrl
    link.download = `${fileName}_${trackName === 'vocal' ? 'vocals' : 'instrumental'}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleTimeUpdate = () => {
    if (audioRefVocal.current && audioRefInstrumental.current) {
      const newTime = audioRefVocal.current.currentTime
      setCurrentTime(newTime)
      audioRefInstrumental.current.currentTime = newTime
    }
  }

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
        <audio
          ref={audioRefVocal}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(audioRefVocal.current?.duration || 0)}
        />
        <audio ref={audioRefInstrumental} />
      </div>
    </div>
  )
}