// '지금 나가면' 탭: 언제 열어도 지금부터 들어올 때까지 기준으로 추천한다
// - 나갈 시간: 지금 (평소 나가는 시간 전이면 평소 시간 → 아침엔 예전과 같은 화면)
// - 들어올 시간: 칩 하나로 고른다 (3시간쯤 / 평소 들어오는 시간 / 밤늦게)

import { timeToHour, formatHour } from './outfit.js'

const LATE = 23 // '밤늦게' = 밤 11시
const SHORT = 3 // '3시간쯤'

export function hourOf(date) {
  return date.getHours() + date.getMinutes() / 60
}

/** 지금 탭의 나갈 시간 (소수 시간, 10분 단위로 반올림) */
export function outingLeave(now, settings) {
  return Math.max(Math.round(hourOf(now) * 6) / 6, timeToHour(settings.leave))
}

/**
 * 들어올 시간 선택지. 지나간 시간이나 겹치는 시간은 뺀다.
 * back이 24 이상이면 다음 날 새벽 (밤 10시 이후에 '밤늦게'를 고른 경우)
 */
export function returnOptions(leave, settings) {
  const usual = timeToHour(settings.back)
  const short = Math.round(leave + SHORT)
  const options = [{ key: 'short', label: `${SHORT}시간쯤`, back: short }]
  if (usual >= leave + 1 && usual !== short) options.push({ key: 'usual', label: `${formatHour(usual)}까지`, back: usual })
  // 저녁 늦게 나가면 '밤늦게'는 자정 넘어 새벽까지
  const late = Math.max(LATE, short + 2)
  if (Math.abs(usual - late) >= 1) options.push({ key: 'late', label: '밤늦게', back: late })
  return options.sort((a, b) => a.back - b.back)
}

/** 기본 선택: 평소 들어오는 시간까지 3시간 넘게 남았으면 그것, 아니면 밤늦게 (저녁 약속) */
export function defaultReturnKey(options, leave) {
  const usual = options.find((o) => o.key === 'usual')
  if (usual && usual.back - leave >= SHORT) return 'usual'
  return options[options.length - 1].key // 가장 늦게 (보통 '밤늦게')
}

/** 오늘·내일 시간별 날씨를 이어 붙인다 (내일 0시 = 24시). 자정을 넘는 외출용 */
export function joinDays(today, tomorrow) {
  if (!tomorrow) return today
  return { ...today, hours: [...today.hours, ...tomorrow.hours.map((h) => ({ ...h, hour: h.hour + 24 }))] }
}
