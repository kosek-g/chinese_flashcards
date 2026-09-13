export function isSpeechSupported(): boolean {
  return 'speechSynthesis' in window
}

function chineseVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis
    .getVoices()
    .find((voice) => voice.lang.replace('_', '-').toLowerCase().startsWith('zh'))
}

export function hasChineseVoice(): boolean {
  return isSpeechSupported() && chineseVoice() !== undefined
}

export function speakChinese(text: string): void {
  if (!isSpeechSupported()) return

  const synth = window.speechSynthesis
  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.8
  const voice = chineseVoice()
  if (voice) utterance.voice = voice
  synth.speak(utterance)
}

// Chrome populates the voice list asynchronously, so ask for it before the first card.
if (isSpeechSupported()) window.speechSynthesis.getVoices()
