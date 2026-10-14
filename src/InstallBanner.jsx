import { useEffect, useState } from 'react'

// 홈 화면 설치 안내
// - 이미 설치해서 앱으로 열었으면 숨김
// - 카카오톡 등 앱 안 브라우저: 설치가 안 되므로 다른 브라우저로 열도록 안내
// - 안드로이드 크롬: 설치 버튼 (beforeinstallprompt)
// - 아이폰: 공유 → 홈 화면에 추가 안내

const DISMISS_KEY = 'what-to-wear-install-dismissed'
const DISMISS_DAYS = 14

const ua = navigator.userAgent
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const isKakao = /KAKAOTALK/i.test(ua)
const isOtherInApp = /NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(ua)
const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return at && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export default function InstallBanner() {
  const [installEvent, setInstallEvent] = useState(() => window.__installPrompt ?? null)
  const [hidden, setHidden] = useState(() => isStandalone() || recentlyDismissed())

  useEffect(() => {
    // main.jsx에서 미리 받아둔 설치 이벤트
    const onReady = () => setInstallEvent(window.__installPrompt)
    const onInstalled = () => setHidden(true)
    window.addEventListener('installpromptready', onReady)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('installpromptready', onReady)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (hidden) return null

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // 저장 실패해도 이번에는 숨김
    }
    setHidden(true)
  }

  const install = async () => {
    installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') setHidden(true)
  }

  let body
  if (isKakao) {
    body = (
      <>
        <p>카카오톡 안에서는 앱 설치가 안 돼요. 다른 브라우저로 열어서 설치해주세요.</p>
        <button
          className="install-btn"
          onClick={() => (location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(location.href)}`)}
        >
          다른 브라우저로 열기
        </button>
      </>
    )
  } else if (isOtherInApp) {
    body = <p>지금 화면에서는 앱 설치가 안 돼요. 오른쪽 위 ⋯ 메뉴에서 "다른 브라우저로 열기"를 눌러주세요.</p>
  } else if (installEvent) {
    body = (
      <>
        <p>홈 화면에 설치하면 앱처럼 바로 열 수 있어요.</p>
        <button className="install-btn" onClick={install}>
          📲 홈 화면에 설치하기
        </button>
      </>
    )
  } else if (isIOS) {
    body = (
      <p>
        아래쪽 <strong>공유 버튼(□↑)</strong>을 누르고 <strong>"홈 화면에 추가"</strong>를 고르면 앱처럼 쓸 수 있어요.
      </p>
    )
  } else {
    return null
  }

  return (
    <section className="install-banner">
      <img src={`${import.meta.env.BASE_URL}pwa-192.png`} alt="" className="install-icon" />
      <div className="install-body">
        <strong>앱으로 설치하기</strong>
        {body}
      </div>
      <button className="install-close" onClick={dismiss} aria-label="닫기">
        ✕
      </button>
    </section>
  )
}
