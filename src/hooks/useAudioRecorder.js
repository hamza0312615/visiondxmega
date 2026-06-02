import { useState, useRef, useCallback } from 'react'

export function useAudioRecorder(onRecordingComplete) {
  const [recording, setRecording] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [audioFile, setAudioFile] = useState(null)
  const [error, setError] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerIntervalRef = useRef(null)

  const startRecording = useCallback(async () => {
    setError('')
    setAudioFile(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        setAudioFile(audioBlob)
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob)
        }
      }

      mediaRecorder.start()
      setRecording(true)
      setTimeLeft(10)

      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current)
            mediaRecorder.stop()
            setRecording(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)

    } catch (err) {
      setError('Microphone access denied. Please allow microphone access to use VoiceDoc.')
      setRecording(false)
      console.error(err)
    }
  }, [onRecordingComplete])

  const stopRecordingEarly = useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      clearInterval(timerIntervalRef.current)
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }, [recording])

  const resetRecording = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    setRecording(false)
    setAudioFile(null)
  }, [])

  return {
    recording,
    timeLeft,
    audioFile,
    error,
    startRecording,
    stopRecordingEarly,
    resetRecording,
    setError
  }
}
