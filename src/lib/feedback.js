// 하루 끝 피드백 → 내 몸에 맞게 추천 보정
//
// 기록: { 'YYYY-MM-DD': { rating: 'cold'|'good'|'hot', when: 'day'|'commute'|null, peakFeels, coldFeels } }
// 보정값(°C)은 체감온도에 더한다. 더웠다 → +(가볍게), 추웠다 → -(따뜻하게)
// - when 'day'     → 낮(상의·하의) 보정만
// - when 'commute' → 오갈 때(겉옷·내의) 보정만
// - 모름(null)     → 둘 다

const STORAGE_KEY = 'what-to-wear-feedback'
const STEP = 0.5 // 피드백 1번당 보정 폭
const LIMIT = 3 // 보정 최대치
const RECENT = 14 // 최근 며칠 피드백만 반영

export const RATINGS = {
  cold: { emoji: '🥶', label: '추웠어요' },
  good: { emoji: '😊', label: '딱 좋았어요' },
  hot: { emoji: '🥵', label: '더웠어요' },
}

export const WHENS = {
  commute: '오갈 때',
  day: '낮에',
}

export function loadFeedback() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

export function saveFeedback(log) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log))
  } catch {
    // 저장 실패해도 앱은 동작
  }
}

const clamp = (n) => Math.max(-LIMIT, Math.min(LIMIT, n))

/** 최근 피드백으로 계산한 보정값 { peak, cold } */
export function learnedAdjust(log) {
  const recent = Object.keys(log).sort().slice(-RECENT).map((date) => log[date])
  let peak = 0
  let cold = 0
  for (const { rating, when } of recent) {
    const delta = rating === 'hot' ? STEP : rating === 'cold' ? -STEP : 0
    if (when !== 'commute') peak += delta
    if (when !== 'day') cold += delta
  }
  return { peak: clamp(peak), cold: clamp(cold) }
}

/** 보정값을 읽을 수 있는 문장으로 */
export function describeAdjust({ peak, cold }) {
  const part = (label, v) => {
    if (v === 0) return null
    const level = Math.abs(v) >= 2 ? '' : '조금 '
    return `${label}엔 ${level}${v > 0 ? '가볍게' : '따뜻하게'}`
  }
  const parts = [part('낮', peak), part('오갈 때', cold)].filter(Boolean)
  return parts.length ? `${parts.join(', ')} 추천하고 있어요` : null
}
