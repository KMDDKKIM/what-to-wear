import { useEffect, useMemo, useState } from 'react'
import { fetchWeather, describeWeather } from './lib/weather.js'
import { buildPlan, lateNote, timeToHour, SENSITIVITY } from './lib/outfit.js'
import { CATEGORIES, GENDERS } from './lib/clothes.js'
import ColorPage from './ColorPage.jsx'
import FeedbackCard from './FeedbackCard.jsx'
import PlaceSearch from './PlaceSearch.jsx'
import InstallBanner from './InstallBanner.jsx'
import { placeNameAt } from './lib/geocode.js'
import { loadFeedback, saveFeedback, learnedAdjust, describeAdjust } from './lib/feedback.js'
import { hourOf, outingLeave, outingBack, lateBack, joinDays } from './lib/outing.js'

const DEFAULT_SETTINGS = {
  leave: '08:00',
  back: '19:00',
  sensitivity: 'normal',
  gender: 'any',
  tone: 'unknown',
  lat: 37.5665,
  lon: 126.978,
  placeName: '서울',
}

const STORAGE_KEY = 'what-to-wear-settings'

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return { ...DEFAULT_SETTINGS, ...saved }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // 저장 실패해도 앱은 동작
  }
}

function isAfterBack(back, now = new Date()) {
  return hourOf(now) >= timeToHour(back)
}

// 집에 들어올 시간이 지났으면 내일 옷을 준비할 시간
function defaultDayIndex(back) {
  return isAfterBack(back) ? 1 : 0
}

// 앱을 30분 넘게 안 보다가 다시 열면 지금 시각 기준으로 처음부터 (날씨도 새로)
const STALE_MS = 30 * 60 * 1000

export default function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [dayIndex, setDayIndex] = useState(() => defaultDayIndex(loadSettings().back))
  const [now, setNow] = useState(() => new Date())
  const [refreshKey, setRefreshKey] = useState(0)
  const [page, setPage] = useState('weather') // 'weather' | 'colors'
  const [days, setDays] = useState(null)
  const [error, setError] = useState(null)
  const [showSettings, setShowSettings] = useState(false)
  const [locating, setLocating] = useState(false)
  const [feedback, setFeedback] = useState(loadFeedback)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveFeedback(feedback)
  }, [feedback])

  useEffect(() => {
    let cancelled = false
    setError(null)
    fetchWeather({ lat: settings.lat, lon: settings.lon })
      .then((d) => !cancelled && setDays(d))
      .catch((e) => !cancelled && setError(e.message))
    return () => {
      cancelled = true
    }
  }, [settings.lat, settings.lon, refreshKey])

  // 지금 시각은 1분마다, 그리고 앱으로 돌아올 때 새로 잰다
  useEffect(() => {
    let hiddenAt = null
    const tick = () => setNow(new Date())
    const onVisible = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
        return
      }
      tick()
      if (hiddenAt && Date.now() - hiddenAt > STALE_MS) {
        setDayIndex(defaultDayIndex(settings.back))
        setRefreshKey((k) => k + 1)
      }
      hiddenAt = null
    }
    const timer = setInterval(tick, 60 * 1000)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [settings.back])

  // '지금': 지금 나가서 평소처럼 들어온다 (자정을 넘으면 내일 날씨까지 이어 봄)
  const leaveNow = outingLeave(now, settings)
  const backNow = outingBack(leaveNow, settings)
  const outing = { ...settings, leave: leaveNow, back: backNow }

  const day = days?.[dayIndex]
  const planDay = useMemo(() => (day && dayIndex === 0 ? joinDays(days[0], days[1]) : day), [days, day, dayIndex])
  // 그날보다 이전 피드백만 반영 (오늘 남긴 피드백은 내일 추천부터)
  const adjust = useMemo(() => {
    if (!day) return { peak: 0, cold: 0 }
    return learnedAdjust(Object.fromEntries(Object.entries(feedback).filter(([date]) => date < day.date)))
  }, [day, feedback])
  const plan = useMemo(
    () => (planDay ? buildPlan(planDay, dayIndex === 0 ? outing : settings, adjust) : null),
    [planDay, dayIndex, settings, adjust, leaveNow, backNow], // outing은 이 값들로 정해진다
  )
  // 밤늦게 들어오면 옷이 달라지는지 ('지금' 탭만)
  const late = useMemo(() => {
    const lateTime = lateBack(backNow)
    if (!planDay || dayIndex !== 0 || lateTime == null) return null
    return lateNote(plan, buildPlan(planDay, { ...outing, back: lateTime }, adjust))
  }, [plan]) // plan이 바뀔 때만 다시 (나머지 값은 plan을 만든 값과 같다)

  const today = days?.[0]
  const todayPlan = useMemo(() => (today ? buildPlan(today, settings) : null), [today, settings])
  const afterBack = isAfterBack(settings.back, now)
  const leavingNow = dayIndex === 0 && leaveNow > timeToHour(settings.leave)
  // 저녁 외출처럼 나갈 때·들어올 때가 가장 따뜻하면 같은 카드가 두 번 나오니 뺀다
  const moments = (plan?.moments ?? []).filter((m, _, [leave, , back]) => {
    return m.key !== 'peak' || (m.time !== leave.time && m.time !== back.time)
  })
  const adjustText = describeAdjust(learnedAdjust(feedback))

  const setTodayFeedback = (entry) => {
    setFeedback((log) => {
      const next = { ...log }
      if (entry) {
        // 그날 날씨도 함께 기록 (나중에 분석용)
        const [, peak, backMoment] = todayPlan?.moments ?? []
        next[today.date] = { ...entry, peakFeels: peak?.feels, coldFeels: backMoment?.feels }
      } else {
        delete next[today.date]
      }
      return next
    })
  }

  const feedbackCard = today && (
    <FeedbackCard entry={feedback[today.date]} onChange={setTodayFeedback} beforeBack={!afterBack} />
  )

  // 카테고리별로 보여줄 옷. 발열 내의는 입을 수도 있는 날에만 보여준다
  const wardrobe = plan
    ? Object.keys(CATEGORIES)
        .map((category) => {
          const options = plan.pieces[category]
          if (category !== 'innerwear') return { category, label: CATEGORIES[category].label, options }
          const innerwear = options.filter((o) => o.id === 'innerwear')
          if (!innerwear.length) return null
          return { category, label: plan.outfit.innerwear ? '발열 내의' : '발열 내의 (추위 타면)', options: innerwear }
        })
        .filter(Boolean)
    : []

  const update = (patch) => setSettings((s) => ({ ...s, ...patch }))
  // 시간 입력을 지우는 중이거나 들어올 시간이 나갈 시간보다 빠르면 반영하지 않음
  const updateTime = (key, value) => {
    if (!value) return
    const next = { ...settings, [key]: value }
    if (timeToHour(next.back) <= timeToHour(next.leave)) return
    update({ [key]: value })
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('이 브라우저는 위치 기능을 지원하지 않아요.')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords
        update({ lat, lon, placeName: '현재 위치' })
        setLocating(false)
        // 동네 이름을 찾으면 '현재 위치' 대신 표시
        const name = await placeNameAt(lat, lon)
        if (name) update({ placeName: name })
      },
      () => {
        setError('위치를 가져오지 못했어요. 브라우저 위치 권한을 확인해주세요.')
        setLocating(false)
      },
    )
  }

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>오늘 뭐 입지?</h1>
          <button className="place" onClick={() => setShowSettings(true)}>
            📍 {settings.placeName} <span className="place-change">변경</span>
          </button>
        </div>
        <button className="icon-btn" onClick={() => setShowSettings((v) => !v)} aria-label="설정">
          ⚙️
        </button>
      </header>

      <InstallBanner />

      {showSettings && (
        <section className="card settings">
          <div className="field">
            <span>
              동네 <span className="current-place">지금: {settings.placeName}</span>
            </span>
            <PlaceSearch
              onSelect={({ name, lat, lon }) => update({ lat, lon, placeName: name })}
            />
            <button className="loc-btn" onClick={useMyLocation} disabled={locating}>
              {locating ? '위치 찾는 중…' : '📍 현재 위치로 설정'}
            </button>
          </div>
          <label>
            집에서 나가는 시간
            <input type="time" value={settings.leave} onChange={(e) => updateTime('leave', e.target.value)} />
          </label>
          <label>
            집에 들어오는 시간
            <input type="time" value={settings.back} onChange={(e) => updateTime('back', e.target.value)} />
          </label>
          <div className="field">
            <span>추천할 옷</span>
            <div className="chips">
              {Object.entries(GENDERS).map(([key, { label }]) => (
                <button
                  key={key}
                  className={`chip ${settings.gender === key ? 'on' : ''}`}
                  onClick={() => update({ gender: key })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>나는</span>
            <div className="chips">
              {Object.entries(SENSITIVITY).map(([key, { label }]) => (
                <button
                  key={key}
                  className={`chip ${settings.sensitivity === key ? 'on' : ''}`}
                  onClick={() => update({ sensitivity: key })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {adjustText && (
            <div className="adjust">
              <span>💬 피드백 반영: {adjustText}</span>
              <button className="link-btn" onClick={() => setFeedback({})}>
                초기화
              </button>
            </div>
          )}
          <button className="done-btn" onClick={() => setShowSettings(false)}>
            완료
          </button>
        </section>
      )}

      <div className="tabs">
        {['지금', '내일'].map((label, i) => (
          <button
            key={label}
            className={`tab ${page === 'weather' && dayIndex === i ? 'on' : ''}`}
            onClick={() => {
              setDayIndex(i)
              setPage('weather')
            }}
          >
            {label}
          </button>
        ))}
        <button className={`tab ${page === 'colors' ? 'on' : ''}`} onClick={() => setPage('colors')}>
          🎨 색 조합
        </button>
      </div>

      {page === 'colors' && (
        <ColorPage
          plan={plan}
          dayLabel={dayIndex === 0 ? '지금' : '내일'}
          gender={settings.gender}
          tone={settings.tone}
          onTone={(tone) => update({ tone })}
        />
      )}

      {page === 'weather' && error && <p className="error">{error}</p>}
      {page === 'weather' && !plan && !error && <p className="loading">날씨를 살펴보는 중…</p>}

      {page === 'weather' && plan && (
        <>
          {/* 집에 들어와서 내일 탭을 볼 때 오늘 피드백을 먼저 묻는다 */}
          {dayIndex === 1 && afterBack && today && !feedback[today.date] && feedbackCard}

          <section className="card hero">
            <p className="headline">{plan.headline}</p>
            <div className="wardrobe">
              {wardrobe.map(({ category, label, options }) => {
                // 가장 잘 맞는 옷은 그림과 함께 크게, 나머지는 대안으로 작게
                const [best, ...others] = options
                return (
                  <div key={category} className="wardrobe-row">
                    <span className="wardrobe-emoji">{best.emoji}</span>
                    <div className="wardrobe-main">
                      <span className="wardrobe-label">{label}</span>
                      <strong className="wardrobe-pick">{best.name}</strong>
                      {others.length > 0 && (
                        <span className="wardrobe-alt">또는 {others.map((o) => o.name).join(', ')}도 괜찮아요</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="moments" style={{ gridTemplateColumns: `repeat(${moments.length}, 1fr)` }}>
            {moments.map((m) => (
              <div key={m.key} className={`moment ${m.key}`}>
                <span className="m-label">{m.label}</span>
                <span className="m-time">{leavingNow && m.key === 'leave' ? '지금' : m.timeText}</span>
                <span className="m-emoji">{m.weather.emoji}</span>
                <span className="m-temp">{m.temp}°</span>
                <span className="m-feels">체감 {m.feels}°</span>
              </div>
            ))}
          </section>

          {/* 꼭 알아야 할 게 있는 날에만 한 줄 팁 */}
          {(plan.tips.length > 0 || late) && (
            <section className="card tips">
              {[...plan.tips, ...(late ? [late] : [])].map((t) => (
                <p key={t.text} className="tip">
                  <span className="tip-emoji">{t.emoji}</span>
                  <span>{t.text}</span>
                </p>
              ))}
            </section>
          )}

          {plan.items.length > 0 && (
            <section className="card">
              <h2>챙기세요</h2>
              <ul className="items">
                {plan.items.map((it) => (
                  <li key={it.label}>
                    <span className="item-emoji">{it.emoji}</span>
                    <div>
                      <strong>{it.label}</strong>
                      <span className="reason">{it.reason}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card">
            <h2>나가 있는 동안</h2>
            <Timeline hours={plan.stayHours} />
            <p className="daily">
              하루 최저 {Math.round(day.min)}° · 최고 {Math.round(day.max)}°
              {plan.dust && ` · 미세먼지 ${plan.dust.text}`}
            </p>
          </section>

          {dayIndex === 0 && feedbackCard}
        </>
      )}

      <footer>
        날씨 데이터: <a href="https://open-meteo.com/">Open-Meteo.com</a>
      </footer>
    </div>
  )
}

// 한 화면에 다 보이게: 12시간이 넘으면 2시간 간격 (마지막 시간은 꼭 포함)
function Timeline({ hours: all }) {
  const hours = all.length > 12 ? all.filter((_, i) => i % 2 === 0 || i === all.length - 1) : all
  const temps = hours.map((h) => h.temp)
  const lo = Math.min(...temps)
  const hi = Math.max(...temps)
  return (
    <div className="timeline">
      {hours.map((h) => {
        const ratio = hi === lo ? 0.5 : (h.temp - lo) / (hi - lo)
        return (
          <div key={h.hour} className="t-col">
            <span className="t-temp">{Math.round(h.temp)}°</span>
            <div className="t-bar-wrap">
              <div className="t-bar" style={{ height: `${20 + ratio * 80}%` }} />
            </div>
            <span className="t-emoji">{describeWeather(h.code).emoji}</span>
            <span className="t-hour">{h.hour % 24}시</span>
            {h.rainProb >= 30 && <span className="t-rain">{h.rainProb}%</span>}
          </div>
        )
      })}
    </div>
  )
}
