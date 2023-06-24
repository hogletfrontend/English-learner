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
import Recorder from 'js-audio-recorder'

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
  const recorderRef = useRef(new Recorder())
  // 是否已经开始录音
  const [started, setStatrted] = useState(false)
  // 录音颜色标识
  const [microPhoneColor, setMicroPhoneColor] = useState('#4b5563')

  // 申请录音权限
  useEffect(() => {
    if (navigator.mediaDevices.getUserMedia) {
      const constraints = { audio: true }
      navigator.mediaDevices.getUserMedia(constraints)
    }
  }, [])

  useEffect(() => {
    if (state.isListening) {
      setMicroPhoneColor('#52c41a')
      setStatrted(true)
      timerRef.current = setInterval(() => {
        setMicroPhoneColor(value => value === '#4b5563' ? '#52c41a' : '#4b5563')
      }, 400)
      recorderRef.current.start().then(() => {
        // 
      }, (error) => {
        console.log(error)
      })

      recorderRef.current.onprogress = (params) => {
        console.log(params, params.duration > 5)
        if(params.duration > 5) {
          recorderRef.current.stop()
        }
      }
    } else {
      // 结束录音
      clearInterval(timerRef.current)
      if (microPhoneColor === '#52c41a') {
        setMicroPhoneColor('#4b5563')
      }
      recorderRef.current.stop()

      if (started) {
        console.log(2)
        // recorderRef.current.destroy()
        recorderRef.current.stop()
        recorderRef.current.play()
        // console.log(recorder.getPCMBlob());
        console.log(recorderRef.current.getWAVBlob());
        // TODO 提交录音文件，过滤时间较小的文件
      }
    }
  }, [state.isListening])


  if (type === 'listen') {
    return (
      <Tooltip content="开始录音（G）" className={`${styles.wordSound}`}>
        <AudioTwoTone style={{ fontSize: 24, marginTop: 24 }} twoToneColor={microPhoneColor} />
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
