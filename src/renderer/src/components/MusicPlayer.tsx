/**
 * MusicPlayer — always mounted in App.tsx.
 * Manages background music playback:
 *  - Built-in noise (@builtin/white, @builtin/pink, @builtin/brown) via Web Audio API
 *  - Local files via Howler.js
 * Reads musicPath, musicVolume, musicPlaying from settingsStore.
 */
import { useEffect, useRef } from 'react'
import { Howl } from 'howler'
import { useSettingsStore } from '../stores/settingsStore'

/** Generate procedural noise into a Float32Array */
function generateNoise(type: string, sampleRate: number, seconds: number): Float32Array {
  const n = sampleRate * seconds
  const d = new Float32Array(n)

  if (type === '@builtin/white') {
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1
  } else if (type === '@builtin/pink') {
    // Pink noise via modified Voss algorithm
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      b3 = 0.86650 * b3 + w * 0.3104856
      b4 = 0.55000 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.0168980
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  } else {
    // Brown noise (low-frequency, soothing)
    let last = 0
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1
      const out = (last + 0.02 * w) / 1.02
      d[i] = out * 3.5
      last = out
    }
  }
  return d
}

export default function MusicPlayer(): null {
  const musicPath = useSettingsStore((s) => s.musicPath)
  const musicVolume = useSettingsStore((s) => s.musicVolume)
  const musicPlaying = useSettingsStore((s) => s.musicPlaying)

  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const howlRef = useRef<Howl | null>(null)

  const stopAll = (): void => {
    if (ctxRef.current) {
      try { ctxRef.current.close() } catch { /* ignore */ }
      ctxRef.current = null
    }
    gainRef.current = null
    if (howlRef.current) {
      howlRef.current.stop()
      howlRef.current.unload()
      howlRef.current = null
    }
  }

  // Start / stop whenever path or playing state changes
  useEffect(() => {
    stopAll()
    if (!musicPath || !musicPlaying) return

    if (musicPath.startsWith('@builtin/')) {
      const ctx = new AudioContext()
      ctxRef.current = ctx

      const gain = ctx.createGain()
      gain.gain.value = musicVolume / 100
      gain.connect(ctx.destination)
      gainRef.current = gain

      // 20-second looping buffer
      const data = generateNoise(musicPath, ctx.sampleRate, 20)
      const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate)
      buffer.copyToChannel(data as Float32Array<ArrayBuffer>, 0)

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      source.start()
    } else {
      // Local file — ensure file:// URL for Electron
      const filePath = musicPath.startsWith('file:')
        ? musicPath
        : 'file:///' + musicPath.replace(/\\/g, '/')
      const howl = new Howl({
        src: [filePath],
        loop: true,
        volume: musicVolume / 100,
        html5: true
      })
      howl.play()
      howlRef.current = howl
    }

    return stopAll
  }, [musicPath, musicPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update volume in place without restarting
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = musicVolume / 100
    if (howlRef.current) howlRef.current.volume(musicVolume / 100)
  }, [musicVolume])

  return null
}
