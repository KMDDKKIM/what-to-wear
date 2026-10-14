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

/** 8.5 → "8시 30분", 13 → "오후 1시" */
export function formatHour(t) {
  const h = Math.floor(t)
  const m = Math.round((t - h) * 60)
  const ampm = h < 12 ? '오전' : '오후'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${ampm} ${h12}시${m ? ` ${m}분` : ''}`
}

// 시간 t(소수)의 날씨. 기온은 앞뒤 시간을 보간한다.
function weatherAt(hours, t) {
  const h = Math.min(Math.floor(t), 23)
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
 * @param day   fetchWeather()가 돌려준 하루치
 * @param opts    { leave: '08:00', back: '19:00', sensitivity: 'normal', gender: 'any' }
 * @param adjust  피드백으로 학습한 보정값 { peak, cold } (°C, feedback.js)
 */
export function buildPlan(day, { leave, back, sensitivity = 'normal', gender = 'any' }, adjust = { peak: 0, cold: 0 }) {
  const offset = SENSITIVITY[sensitivity]?.offset ?? 0
  const start = timeToHour(leave)
  const end = timeToHour(back)
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
      { key: 'peak', label: '낮 최고', ...summarize(peakW) },
      { key: 'back', label: '들어올 때', ...summarize(backW) },
    ],
    pieces,
    outfit,
    colors: colorCombos(day.date, { rainy: maxRain >= 50, peakEff }),
    swing: round(swing),
    headline: makeHeadline({ outfit, swing, peakW, coldW }),
    worries: makeWorries({ outfit, swing, peakW, coldW, peakEff, commuteWind }),
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

function makeHeadline({ outfit, swing, peakW, coldW }) {
  const { top, bottom, outer, innerwear } = outfit
  const base = `${top.name}에 ${bottom.name}`
  const inner = innerwear ? ' 발열 내의도 챙겨 입으세요.' : ''
  if (!outer) return `${base}, 겉옷 없이 충분해요.`
  if (swing >= 8) {
    return `체감온도가 ${coldW.label}는 ${round(coldW.feels)}°, 낮엔 ${round(peakW.feels)}°까지 올라가요. 안에는 ${base}, 겉옷은 벗기 쉬운 ${outer.name}!${inner}`
  }
  return `${base}, 위에 ${josa(outer.name, '을', '를')} 걸치세요.${inner}`
}

function makeWorries({ outfit, swing, peakW, coldW, peakEff, commuteWind }) {
  const { top, outer, innerwear } = outfit
  const peakTime = formatHour(peakW.time)

  // 걱정 1: 낮에 덥지 않을까?
  let hot
  if (peakEff >= 28) {
    hot = `${peakTime}에 체감 ${round(peakW.feels)}°까지 올라가 더워요. 린넨·면처럼 통풍 잘 되는 소재가 좋아요.`
  } else if (peakEff < 12) {
    // 추운 날의 "더위" 걱정은 실내 난방 때문
    const layer = innerwear ? `발열 내의 위에 ${top.name}` : top.name
    hot = `바깥은 낮에도 체감 ${round(peakW.feels)}°로 쌀쌀하지만, 실내는 난방이 돼요. 두꺼운 옷 한 벌보다 ${layer}처럼 겹쳐 입어야 실내에서 덥지 않아요.`
  } else if (outer && swing >= 8) {
    hot = `${peakTime}엔 체감 ${round(peakW.feels)}°예요. 낮엔 겉옷을 벗고 ${top.name}만 입어도 덥지 않아요. 벗어서 들고 다니기 쉬운 겉옷이 좋아요.`
  } else {
    hot = `가장 따뜻한 ${peakTime}에도 체감 ${round(peakW.feels)}°예요. ${josa(top.name, '이면', '면')} 덥지 않아요.`
  }

  // 걱정 2: 오갈 때 춥지 않을까?
  let cold
  const coldTime = `${coldW.label}(${formatHour(coldW.time)})`
  if (!outer) {
    cold = `가장 쌀쌀한 ${coldTime}에도 체감 ${round(coldW.feels)}°라 겉옷 없이도 괜찮아요.`
  } else {
    cold = `가장 추운 ${coldTime}는 체감 ${round(coldW.feels)}°예요. ${josa(outer.name, '을', '를')} 입으면 따뜻해요.`
  }
  if (innerwear) cold += ' 발열 내의까지 입으면 든든해요.'
  if (commuteWind >= 5) cold += ` 바람이 초속 ${round(commuteWind)}m로 강해서 더 춥게 느껴질 수 있어요.`

  return [
    { emoji: '🥵', q: '낮에 덥지 않을까?', a: hot },
    { emoji: '🥶', q: '오갈 때 춥지 않을까?', a: cold },
  ]
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
