import { api } from './api'

/** Blob URLs per phrase, so replaying a card never hits the network twice. */
const clips = new Map<string, string>()
let player: HTMLAudioElement | null = null

function chineseVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.replace('_', '-').toLowerCase().startsWith('zh'))
}

/** Last resort when the Azure voice is unreachable: the robotic built-in one. */
function speakWithBrowser(text: string): void {
  if (!('speechSynthesis' in window)) return

  const synth = window.speechSynthesis
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.8
  const voice = chineseVoice()
  if (voice) utterance.voice = voice

  if (synth.speaking || synth.pending) {
    // Chrome drops an utterance queued in the same tick as cancel().
    synth.cancel()
    setTimeout(() => synth.speak(utterance), 120)
  } else {
    synth.speak(utterance)
  }
}

async function clipUrl(text: string): Promise<string> {
  const cached = clips.get(text)
  if (cached) return cached

  const url = URL.createObjectURL(await api.speech(text))
  clips.set(text, url)
  return url
}

export function speakChinese(text: string): void {
  void (async () => {
    try {
      const url = await clipUrl(text)
      // One shared element keeps mobile browsers happy about gesture-driven playback.
      player ??= new Audio()
      player.pause()
      player.src = url
      await player.play()
    } catch {
      speakWithBrowser(text)
    }
  })()
}

// Chrome populates the voice list asynchronously, so ask for it before the fallback needs it.
if ('speechSynthesis' in window) window.speechSynthesis.getVoices()
