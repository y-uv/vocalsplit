'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react'

export function Showstems() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMutedVocal, setIsMutedVocal] = useState(false)
  const [isMutedInstrumental, setIsMutedInstrumental] = useState(false)

  const audioRefVocal = useRef<HTMLAudioElement>(null)
  const audioRefInstrumental = useRef<HTMLAudioElement>(null)
  const canvasRefVocal = useRef<HTMLCanvasElement>(null)
  const canvasRefInstrumental = useRef<HTMLCanvasElement>(null)

  const waveformDataVocal = useRef<number[]>([])
  const waveformDataInstrumental = useRef<number[]>([])

  useEffect(() => {
    // In a real application, you would load the actual audio files here
    if (audioRefVocal.current) {
      audioRefVocal.current.src = '/placeholder.mp3'
    }
    if (audioRefInstrumental.current) {
      audioRefInstrumental.current.src = '/placeholder.mp3'
    }

    // Generate random waveform data
    waveformDataVocal.current = Array.from({ length: 320 }, () => Math.random())
    waveformDataInstrumental.current = Array.from({ length: 320 }, () => Math.random())

    drawWaveforms()
  }, [])

  useEffect(() => {
    drawWaveforms()
  }, [isMutedVocal, isMutedInstrumental])

  const drawWaveforms = () => {
    drawWaveform(canvasRefVocal, '#4a90e2', waveformDataVocal.current, isMutedVocal)
    drawWaveform(canvasRefInstrumental, '#50e3c2', waveformDataInstrumental.current, isMutedInstrumental)
  }

  const drawWaveform = (canvasRef: React.RefObject<HTMLCanvasElement>, color: string, data: number[], isMuted: boolean) => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = isMuted ? `${color}40` : color // 25% opacity for muted state
        for (let i = 0; i < data.length; i++) {
          const height = data[i] * canvas.height
          ctx.fillRect(i, (canvas.height - height) / 2, 1, height)
        }
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
    // In a real application, this function would initiate the download of the track
    console.log(`Downloading ${trackName} track`)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">VocalSplit Results</h1>
        <div className="space-y-6">
          <div className="flex justify-center mb-4">
            <button
              onClick={togglePlayPause}
              className="bg-blue-500 text-white rounded-full p-3 hover:bg-blue-600 transition-colors"
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
                  >
                    {isMutedVocal ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <button
                    onClick={() => downloadTrack('vocal')}
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="Download vocal track"
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
                  >
                    {isMutedInstrumental ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <button
                    onClick={() => downloadTrack('instrumental')}
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="Download instrumental track"
                  >
                    <Download size={20} />
                  </button>
                </div>
              </div>
              <canvas ref={canvasRefInstrumental} width="320" height="80" className="w-full" />
            </div>
          </div>
        </div>
        <audio
          ref={audioRefVocal}
          onTimeUpdate={() => setCurrentTime(audioRefVocal.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRefVocal.current?.duration || 0)}
        />
        <audio ref={audioRefInstrumental} />
      </div>
    </div>
  )
}