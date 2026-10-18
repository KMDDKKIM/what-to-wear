// '지금' 탭: 언제 열어도 지금부터 들어올 때까지 기준으로 추천한다
// - 나갈 시간: 지금 (평소 나가는 시간 전이면 평소 시간 → 아침엔 예전과 같은 화면)
// - 들어올 시간: 고르지 않고 알아서 (평소 들어오는 시간, 그게 3시간도 안 남았으면 지금부터 3시간 뒤)
// - 밤늦게 들어올 때는 '밤늦게 들어온다면?' 카드로 따로 알려준다

import { timeToHour } from './outfit.js'

const LATE = 23 // '밤늦게' = 밤 11시
const MIN_OUT = 3 // 나가면 보통 3시간은 있다 온다

export function hourOf(date) {
  return date.getHours() + date.getMinutes() / 60
}

/** 지금 탭의 나갈 시간 (소수 시간, 10분 단위로 반올림) */
export function outingLeave(now, settings) {
  return Math.max(Math.round(hourOf(now) * 6) / 6, timeToHour(settings.leave))
}

/**
 * 지금 탭의 들어올 시간: 평소 들어오는 시간, 단 나간 지 3시간은 지나서.
 * 24 이상이면 다음 날 새벽 (밤 10시 넘어 나가는 경우)
 */
export function outingBack(leave, settings) {
  return Math.max(timeToHour(settings.back), Math.round(leave + MIN_OUT))
}

/** '밤늦게 들어온다면?' 기준 시간: 밤 11시. 들어올 시간이 이미 밤 11시 이후면 null (카드 안 보임) */
export function lateBack(back) {
  return back < LATE ? LATE : null
}

/** 오늘·내일 시간별 날씨를 이어 붙인다 (내일 0시 = 24시). 자정을 넘는 외출용 */
export function joinDays(today, tomorrow) {
  if (!tomorrow) return today
  return { ...today, hours: [...today.hours, ...tomorrow.hours.map((h) => ({ ...h, hour: h.hour + 24 }))] }
}
