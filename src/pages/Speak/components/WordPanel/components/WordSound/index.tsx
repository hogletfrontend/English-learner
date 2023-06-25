import type { SoundIconProps } from '../SoundIcon'
import { SoundIcon } from '../SoundIcon'
import styles from './index.module.css'
import Tooltip from '@/components/Tooltip'
import usePronunciationSound from '@/hooks/usePronunciation'
import { TypingContext } from '@/pages/Speak/store'
import { pronunciationIsOpenAtom } from '@/store'
import { useAtomValue } from 'jotai'
import { useCallback, useContext, useEffect, useState, useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { AudioTwoTone } from '@ant-design/icons'

const WordSound = ({ word, inputWord, type, ...rest }: WordSoundProps) => {
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state } = useContext(TypingContext)!

  const { play, stop, isPlaying } = usePronunciationSound(word)
  const pronunciationIsOpen = useAtomValue(pronunciationIsOpenAtom)

  useHotkeys(
    'ctrl+j',
    () => {
      if (state.isTyping) {
        stop()
        play()
      }
    },
    [play, stop, state.isTyping],
    { enableOnFormTags: true, preventDefault: true },
  )
  useEffect(() => {
    if (inputWord.length === 0 && state.isTyping) {
      stop()
      play()
    }
  }, [play, inputWord, stop, state.isTyping])

  useEffect(() => {
    return stop
  }, [word, stop])

  const handleClickSoundIcon = useCallback(() => {
    stop()
    play()
  }, [play, stop])

  const timerRef = useRef<any>()
  const recRef = useRef<any>(null)
  const [microPhoneColor, setMicroPhoneColor] = useState('#4b5563')

  useEffect(() => {
    if (navigator.mediaDevices) {
      const constraints = { audio: true };
      let chunks: any[] = [];
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        recRef.current = new MediaRecorder(stream)
        const audio = document.createElement('audio')

        recRef.current.onstart = (e: any) => {
          audio.pause()
          setMicroPhoneColor('#52c41a')
          timerRef.current = setInterval(() => {
            setMicroPhoneColor(value => value === '#4b5563' ? '#52c41a' : '#4b5563')
          }, 400)
        }

        recRef.current.onstop = (e: any) => {
          clearInterval(timerRef.current)
          if (microPhoneColor === '#52c41a') {
            setMicroPhoneColor('#4b5563')
          }

          const blob = new Blob(chunks, { type: 'audio/webm; codecs=opus' })
          if (blob.size > 5000) {
            const audioURL = window.URL.createObjectURL(blob)
            audio.controls = true
            audio.src = audioURL
            audio.play()
            // TODO 语音识别逻辑
          }
        }

        recRef.current.ondataavailable = (e: any) => {
          chunks = []
          chunks.push(e.data)
          clearInterval(timerRef.current)
        }
      })
    }
  }, [])

  useEffect(() => {
    if (state.isListening) {
      if (recRef.current?.state === 'recording') {
        recRef.current?.stop()
      }
      recRef.current?.start()
    } else {
      clearInterval(timerRef.current)
      recRef.current?.stop()
    }
  }, [state.isListening])


  if (type === 'listen') {
    return (
      <Tooltip content="开始录音（G）" className={`${styles.wordSound}`}>
        <AudioTwoTone style={{ fontSize: 24, marginTop: 24 }} twoToneColor={state.isListening ? microPhoneColor : '#4b5563'} />
      </Tooltip>
    )
  }

  return (
    <>
      {pronunciationIsOpen && (
        <Tooltip content="朗读发音（Ctrl + J）" className={`${styles.wordSound}`}>
          <SoundIcon animated={isPlaying} {...rest} onClick={handleClickSoundIcon} />
        </Tooltip>
      )}
    </>
  )
}

export type WordSoundProps = {
  word: string
  inputWord: string
} & SoundIconProps

export default WordSound
