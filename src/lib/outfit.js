// 옷차림 추천 로직
//
// 핵심 원칙
// - 상의·하의: 나가 있는 동안 계속 입으니 "낮 최고 체감온도" 기준 → 낮에 덥지 않게
// - 겉옷·내의: 오갈 때 필요하니 "나갈 때·들어올 때 중 더 추운 시간" 기준 → 춥지 않게
// - 일교차가 크면 벗기 쉬운 겉옷 안내
// - 실내는 냉난방이 되니 추운 날엔 겹쳐 입기, 더운 날엔 에어컨 대비
// 옷 아이템과 적정 온도는 clothes.js에서 관리한다.

import { describeWeather, dustGrade } from './weather.js'
import { CATEGORIES, optionsFor } from './clothes.js'
import { colorCombos } from './colors.js'

// 체질 보정 (체감온도에 더함). 더위를 많이 타면 더 따뜻하게 느끼므로 가볍게 입는다.
export const SENSITIVITY = {
  hot: { label: '더위를 많이 타요', offset: 2 },
  normal: { label: '보통이에요', offset: 0 },
  cold: { label: '추위를 많이 타요', offset: -2 },
}

const round = (n) => Math.round(n)

// 받침 유무에 따라 조사 선택: josa('패딩', '을', '를') → '패딩을'
function josa(word, withBatchim, without) {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  const hasBatchim = code >= 0 && code <= 11171 && code % 28 !== 0
  return word + (hasBatchim ? withBatchim : without)
}

/** "08:30" → 8.5 */
export function timeToHour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h + m / 60
}

/** 8.5 → "8시 30분", 13 → "오후 1시". 24 이상은 다음 날 (25 → "오전 1시") */
export function formatHour(t) {
  const m = Math.round((t - Math.floor(t)) * 60)
  const h = Math.floor(t) % 24
  const ampm = h === 0 ? '밤' : h < 12 ? '오전' : '오후' // 자정은 '밤 12시'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${h12}시${m ? ` ${m}분` : ''}`
}

// 시간 t(소수)의 날씨. 기온은 앞뒤 시간을 보간한다.
function weatherAt(hours, t) {
  const h = Math.min(Math.floor(t), hours.length - 1)
  const a = hours[h]
  const b = hours[h + 1] ?? a
  const f = t - h
  return {
    ...a,
    time: t,
    temp: a.temp + (b.temp - a.temp) * f,
    feels: a.feels + (b.feels - a.feels) * f,
  }
}

/**
 * @param day   fetchWeather()가 돌려준 하루치 (자정을 넘는 외출이면 outing.js의 joinDays로 이어 붙인 것)
 * @param opts    { leave: '08:00', back: '19:00', sensitivity: 'normal', gender: 'any' }
 *                leave·back은 소수 시간(17.5)도 된다 ('지금' 탭)
 * @param adjust  피드백으로 학습한 보정값 { peak, cold } (°C, feedback.js)
 */
export function buildPlan(day, { leave, back, sensitivity = 'normal', gender = 'any' }, adjust = { peak: 0, cold: 0 }) {
  const offset = SENSITIVITY[sensitivity]?.offset ?? 0
  const start = typeof leave === 'number' ? leave : timeToHour(leave)
  const end = typeof back === 'number' ? back : timeToHour(back)
  // 오후 3시 넘어 나가면 '낮'이 없으니 '가장 따뜻할 때'라고 부른다
  const daytime = start < 15
  const hours = day.hours

  const leaveW = weatherAt(hours, start)
  const backW = weatherAt(hours, end)

  // 나가 있는 동안 (나갈 때~들어올 때) 시간별 데이터
  const stay = hours.filter((h) => h.hour >= Math.floor(start) && h.hour <= Math.ceil(end))
  const inside = hours.filter((h) => h.hour > start && h.hour < end)

  // 낮 최고: 나가 있는 동안 체감온도가 가장 높은 시각
  const peakW = [leaveW, ...inside.map((h) => ({ ...h, time: h.hour })), backW].reduce((best, w) =>
    w.feels > best.feels ? w : best,
  )
  const coldW = leaveW.feels <= backW.feels ? { ...leaveW, label: '나갈 때' } : { ...backW, label: '들어올 때' }

  const peakEff = peakW.feels + offset + adjust.peak
  const coldEff = coldW.feels + offset + adjust.cold

  const swing = peakW.feels - coldW.feels
  const commuteWind = Math.max(leaveW.wind, backW.wind)

  const maxRain = Math.max(...stay.map((h) => h.rainProb))
  const maxUv = Math.max(...stay.map((h) => h.uv))
  const maxWind = Math.max(...stay.map((h) => h.wind))
  const pm10 = Math.max(...stay.map((h) => h.pm10 ?? -1))
  const pm25 = Math.max(...stay.map((h) => h.pm25 ?? -1))
  const dust = dustGrade(pm10 < 0 ? null : pm10, pm25 < 0 ? null : pm25)

  // 카테고리별로 오늘 입을 수 있는 옷 (잘 맞는 순). 문구는 각 카테고리 1순위 기준
  const pieces = {}
  for (const [category, { basis }] of Object.entries(CATEGORIES)) {
    const t = basis === 'peak' ? peakEff : coldEff
    pieces[category] = optionsFor(category, t, { windy: category === 'outer' && commuteWind >= 5, gender })
  }
  const outfit = {
    top: pieces.top[0],
    bottom: pieces.bottom[0],
    outer: pieces.outer[0].id === 'no-outer' ? null : pieces.outer[0],
    innerwear: pieces.innerwear[0].id === 'innerwear',
  }

  return {
    moments: [
      { key: 'leave', label: '나갈 때', ...summarize(leaveW) },
      { key: 'peak', label: daytime ? '낮 최고' : '가장 따뜻할 때', ...summarize(peakW) },
      { key: 'back', label: '들어올 때', ...summarize(backW) },
    ],
    pieces,
    outfit,
    colors: colorCombos(day.date, { rainy: maxRain >= 50, peakEff }),
    swing: round(swing),
    headline: makeHeadline({ outfit, swing, peakW, coldW, daytime }),
    tips: makeTips({ outfit, swing, peakW, coldW, peakEff, coldEff, commuteWind, daytime }),
    items: makeItems({ maxRain, maxUv, maxWind, peakEff, coldEff, dust, outer: outfit.outer }),
    dust,
    stayHours: stay,
  }
}

function summarize(w) {
  return {
    time: w.time,
    timeText: formatHour(w.time),
    temp: round(w.temp),
    feels: round(w.feels),
    weather: describeWeather(w.code),
  }
}

function makeHeadline({ outfit, swing, peakW, coldW, daytime }) {
  const { top, bottom, outer, innerwear } = outfit
  const base = `${top.name}에 ${bottom.name}`
  const inner = innerwear ? ' 발열 내의도 챙겨 입으세요.' : ''
  if (!outer) return `${base}, 겉옷 없이 충분해요.`
  if (swing >= 8) {
    return `체감온도가 ${coldW.label}는 ${round(coldW.feels)}°, ${daytime ? '낮엔' : '가장 따뜻할 땐'} ${round(peakW.feels)}°까지 올라가요. 안에는 ${base}, 겉옷은 벗기 쉬운 ${outer.name}!${inner}`
  }
  return `${base}, 위에 ${josa(outer.name, '을', '를')} 걸치세요.${inner}`
}

// 위 추천만으로는 알 수 없는, 평소와 다른 날에만 한 줄 팁 (평범한 날엔 없음)
// 기준은 2025.10~2026.9 서울 날씨로 확인: 매일 나오면 아무도 안 읽으니 드문 날에만
function makeTips({ outfit, swing, peakW, coldW, peakEff, coldEff, commuteWind, daytime }) {
  const { top, outer, innerwear } = outfit
  const tips = []
  // 폭염 (폭염주의보 기준 33°)
  if (peakEff >= 33) {
    tips.push({ emoji: '🥵', text: `${formatHour(peakW.time)}엔 체감 ${round(peakW.feels)}°까지 올라가요. 린넨·면처럼 통풍 잘 되는 소재가 좋아요.` })
  }
  // 한파: 밖은 아주 춥지만 실내는 난방이 되니 겹쳐 입기
  if (coldEff <= -10) {
    const layer = innerwear ? `발열 내의 위에 ${top.name}` : top.name
    tips.push({ emoji: '🏠', text: `${coldW.label} 체감 ${round(coldW.feels)}°로 아주 추워요. 실내는 난방이 되니 두꺼운 옷 한 벌보다 ${layer}처럼 겹쳐 입으세요.` })
  }
  // 일교차가 아주 큰 날
  if (outer && swing >= 12) {
    tips.push({ emoji: '🧥', text: `일교차가 ${round(swing)}°나 돼요. ${daytime ? '낮엔' : '따뜻할 땐'} 겉옷을 벗고 ${top.name}만 입어도 덥지 않아요.` })
  }
  if (commuteWind >= 5) {
    tips.push({ emoji: '🌬️', text: `오갈 때 바람이 초속 ${round(commuteWind)}m로 강해서 더 춥게 느껴질 수 있어요.` })
  }
  return tips
}

/**
 * '지금' 탭의 '밤늦게 들어온다면?' 카드
 * @param plan      평소대로 들어올 때 추천
 * @param latePlan  같은 조건에 들어올 시간만 밤늦게로 바꾼 추천 (더 추우면 겉옷이 바뀐다)
 */
export function lateNote(plan, latePlan) {
  const { timeText, feels } = latePlan.moments[2]
  const outer = plan.outfit.outer
  const lateOuter = latePlan.outfit.outer
  const outerChanged = lateOuter && lateOuter.id !== outer?.id
  const innerwear = latePlan.outfit.innerwear && !plan.outfit.innerwear
  // 이대로 괜찮으면 굳이 말하지 않는다
  if (!outerChanged && !innerwear) return null
  let a = `밤늦게 들어온다면, ${timeText}쯤엔 체감 ${feels}°까지 내려가요.`
  if (outerChanged) {
    a += outer ? ` ${outer.name}보다 따뜻한 ${josa(lateOuter.name, '이', '가')} 좋아요.` : ` ${josa(lateOuter.name, '을', '를')} 챙기세요.`
  }
  if (innerwear) a += ' 발열 내의도 입으면 든든해요.'
  return { emoji: '🌙', text: a }
}

function makeItems({ maxRain, maxUv, maxWind, peakEff, coldEff, dust, outer }) {
  const items = []
  if (maxRain >= 60) items.push({ emoji: '☔', label: '우산', reason: `비 올 확률 ${maxRain}%` })
  else if (maxRain >= 30) items.push({ emoji: '🌂', label: '접이식 우산', reason: `비 올 확률 ${maxRain}%` })

  if (maxUv >= 6) items.push({ emoji: '🕶️', label: '선크림 + 선글라스', reason: `자외선 높음 (${round(maxUv)})` })
  else if (maxUv >= 3) items.push({ emoji: '🧴', label: '선크림', reason: `자외선 보통 (${round(maxUv)})` })

  if (peakEff >= 28) items.push({ emoji: '🥤', label: '텀블러', reason: '더운 날 수분 보충' })

  // 더운 날엔 실내 에어컨이 추울 수 있다
  if (peakEff >= 25 && !outer) items.push({ emoji: '🧣', label: '얇은 가디건', reason: '실내 에어컨이 추울 수 있어요' })

  if (dust && dust.level >= 2) items.push({ emoji: '😷', label: '마스크', reason: `미세먼지 ${dust.text}` })

  if (coldEff <= 0) items.push({ emoji: '🧤', label: '장갑·목도리', reason: '영하의 추위' })

  if (maxWind >= 5 && !outer) items.push({ emoji: '🌬️', label: '얇은 바람막이', reason: `바람 초속 ${round(maxWind)}m` })

  return items
}
