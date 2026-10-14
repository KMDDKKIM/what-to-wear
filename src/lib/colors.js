// 상의·하의 색 조합
// 1) colorCombos: 날씨 화면에 보여줄 "오늘의 색 조합" 2쌍
// 2) matchesFor: 색 조합 페이지에서 한쪽 색을 고르면 어울리는 반대쪽 색 찾기

export const COLORS = {
  white: { name: '화이트', hex: '#FFFFFF' },
  ivory: { name: '아이보리', hex: '#F6F0E1' },
  cream: { name: '크림', hex: '#F3E6C8' },
  beige: { name: '베이지', hex: '#E3D3B8' },
  gray: { name: '그레이', hex: '#A7A9AE' },
  charcoal: { name: '차콜', hex: '#45474D' },
  black: { name: '블랙', hex: '#222222' },
  navy: { name: '네이비', hex: '#2B3A5C' },
  denim: { name: '데님', hex: '#4A6A96' },
  lightdenim: { name: '연청', hex: '#9DB6D4' },
  skyblue: { name: '하늘색', hex: '#A9D3F0' },
  mint: { name: '민트', hex: '#B5E5D4' },
  lime: { name: '연두', hex: '#B6DB5E' },
  green: { name: '초록', hex: '#2E8B57' },
  blue: { name: '파랑', hex: '#2F6FD6' },
  khaki: { name: '카키', hex: '#7D7D4E' },
  lemon: { name: '연노랑', hex: '#FBEB9B' },
  yellow: { name: '노랑', hex: '#FFD43B' },
  mustard: { name: '머스타드', hex: '#D9A22E' },
  orange: { name: '주황', hex: '#FF9A3C' },
  lightpink: { name: '연핑크', hex: '#F7CFD8' },
  pink: { name: '핑크', hex: '#F28CB1' },
  red: { name: '빨강', hex: '#D94040' },
  burgundy: { name: '버건디', hex: '#7E2D3B' },
  lavender: { name: '라벤더', hex: '#C9B8E8' },
  brown: { name: '브라운', hex: '#7A5232' },
}

const color = (id) => ({ id, ...COLORS[id] })

// ---------- 1) 날씨 화면용 오늘의 색 조합 ----------

const pair = (top, bottom) => ({ top: color(top), bottom: color(bottom) })

const PALETTES = {
  rain: {
    reason: '비 오는 날엔 젖어도 티 덜 나는 어두운 하의, 기분 전환되는 밝은 상의',
    pairs: [pair('white', 'navy'), pair('skyblue', 'charcoal'), pair('mustard', 'black'), pair('ivory', 'denim')],
  },
  hot: {
    reason: '더운 날엔 햇볕을 덜 흡수하는 밝은 색',
    pairs: [pair('white', 'beige'), pair('skyblue', 'white'), pair('mint', 'ivory'), pair('lemon', 'white')],
  },
  cold: {
    reason: '추운 날엔 따뜻해 보이는 진한 색',
    pairs: [pair('burgundy', 'charcoal'), pair('mustard', 'navy'), pair('cream', 'brown'), pair('ivory', 'navy')],
  },
  spring: {
    reason: '봄엔 산뜻한 파스텔 색',
    pairs: [pair('lemon', 'denim'), pair('lightpink', 'lightdenim'), pair('mint', 'beige'), pair('skyblue', 'gray')],
  },
  summer: {
    reason: '여름엔 시원해 보이는 색',
    pairs: [pair('skyblue', 'white'), pair('mint', 'denim'), pair('white', 'navy'), pair('lemon', 'beige')],
  },
  autumn: {
    reason: '가을엔 차분한 어스 톤',
    pairs: [pair('mustard', 'navy'), pair('khaki', 'beige'), pair('ivory', 'brown'), pair('burgundy', 'denim')],
  },
  winter: {
    reason: '겨울엔 포근한 색',
    pairs: [pair('cream', 'brown'), pair('burgundy', 'charcoal'), pair('ivory', 'navy'), pair('gray', 'black')],
  },
}

function season(month) {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

/**
 * @param date    'YYYY-MM-DD'
 * @param weather { rainy, peakEff }
 * @returns { reason, pairs: [{ top, bottom }] }  2쌍
 */
export function colorCombos(date, { rainy, peakEff }) {
  const key = rainy ? 'rain' : peakEff >= 26 ? 'hot' : peakEff < 8 ? 'cold' : season(Number(date.slice(5, 7)))
  const { reason, pairs } = PALETTES[key]
  // 날짜마다 다른 2쌍이 나오도록
  const start = Number(date.slice(8, 10)) % pairs.length
  return { reason, pairs: [pairs[start], pairs[(start + 1) % pairs.length]] }
}

// ---------- 2) 색 조합 페이지 ----------

export const MATCH_TYPES = {
  basic: { label: '실패 없는 기본', reason: '어떤 날에도 무난하게 잘 어울려요' },
  tone: { label: '톤온톤', reason: '비슷한 계열이라 차분하고 세련돼 보여요' },
  point: { label: '포인트 조합', reason: '색이 대비돼서 생기 있고 눈에 띄어요' },
  avoid: { label: '피하면 좋은 조합', reason: '비슷한 색이 겹치거나 서로 어색해 보여요' },
}

// 상의 색 → 어울리는 하의 색. 하의에서 찾을 때는 이 표를 거꾸로 읽는다.
// 인터넷 코디 색 조합표들(코디북, 스타일샤워 등)에서 공통으로 좋다/피하라는 조합을 참고
const MATCHES = {
  white: [
    ['denim', 'basic'], ['lightdenim', 'basic'], ['black', 'basic'], ['navy', 'basic'],
    ['charcoal', 'basic'], ['beige', 'tone'], ['khaki', 'point'], ['lightpink', 'basic'],
    ['skyblue', 'basic'], ['mint', 'basic'], ['lavender', 'basic'], ['pink', 'basic'],
    ['red', 'point'], ['yellow', 'point'],
  ],
  ivory: [
    ['denim', 'basic'], ['lightdenim', 'basic'], ['navy', 'basic'], ['black', 'basic'],
    ['brown', 'tone'], ['khaki', 'tone'], ['lightpink', 'basic'], ['lavender', 'basic'],
    ['mint', 'basic'], ['red', 'point'],
  ],
  cream: [
    ['denim', 'basic'], ['lightdenim', 'basic'], ['navy', 'basic'], ['brown', 'tone'],
    ['beige', 'tone'], ['lightpink', 'basic'],
  ],
  beige: [
    ['denim', 'basic'], ['lightdenim', 'basic'], ['navy', 'basic'], ['black', 'basic'],
    ['white', 'basic'], ['brown', 'tone'], ['ivory', 'tone'],
  ],
  gray: [
    ['black', 'basic'], ['denim', 'basic'], ['lightdenim', 'basic'], ['navy', 'basic'],
    ['beige', 'basic'], ['white', 'basic'], ['charcoal', 'tone'], ['pink', 'basic'],
    ['lightpink', 'basic'], ['lavender', 'basic'], ['mint', 'basic'], ['red', 'point'],
    ['yellow', 'point'],
  ],
  charcoal: [
    ['denim', 'basic'], ['black', 'basic'], ['gray', 'tone'], ['beige', 'point'],
    ['pink', 'point'], ['red', 'point'],
  ],
  black: [
    ['denim', 'basic'], ['gray', 'tone'], ['beige', 'point'], ['white', 'point'],
    ['red', 'point'], ['pink', 'point'],
  ],
  navy: [
    ['beige', 'basic'], ['ivory', 'basic'], ['gray', 'basic'], ['white', 'basic'],
    ['khaki', 'basic'], ['charcoal', 'basic'], ['red', 'basic'], ['lightdenim', 'tone'],
    ['skyblue', 'tone'], ['pink', 'point'], ['yellow', 'point'], ['mint', 'point'],
    ['denim', 'avoid'],
  ],
  blue: [
    ['denim', 'basic'], ['beige', 'basic'], ['white', 'basic'], ['black', 'basic'],
    ['gray', 'basic'], ['khaki', 'avoid'], ['charcoal', 'avoid'],
  ],
  skyblue: [
    ['white', 'basic'], ['beige', 'basic'], ['gray', 'basic'], ['black', 'basic'],
    ['brown', 'basic'], ['navy', 'tone'], ['lightdenim', 'tone'], ['mint', 'tone'],
  ],
  mint: [
    ['white', 'basic'], ['beige', 'basic'], ['lightdenim', 'basic'], ['gray', 'basic'],
    ['skyblue', 'tone'], ['lightpink', 'point'], ['lavender', 'point'],
  ],
  green: [
    ['lightdenim', 'basic'], ['denim', 'basic'], ['beige', 'basic'], ['white', 'basic'],
    ['gray', 'basic'], ['brown', 'tone'], ['khaki', 'avoid'], ['charcoal', 'avoid'],
  ],
  lime: [
    ['denim', 'basic'], ['lightdenim', 'basic'], ['beige', 'basic'], ['white', 'basic'],
    ['navy', 'point'], ['khaki', 'avoid'],
  ],
  khaki: [['beige', 'tone'], ['ivory', 'basic'], ['black', 'basic'], ['denim', 'basic'], ['white', 'basic']],
  lemon: [
    ['denim', 'basic'], ['white', 'basic'], ['gray', 'basic'], ['navy', 'point'],
    ['lavender', 'point'], ['mint', 'point'], ['lightpink', 'point'],
  ],
  yellow: [
    ['denim', 'basic'], ['gray', 'basic'], ['charcoal', 'basic'], ['white', 'basic'],
    ['black', 'point'], ['navy', 'point'], ['lightdenim', 'avoid'],
  ],
  mustard: [
    ['denim', 'basic'], ['charcoal', 'basic'], ['black', 'basic'], ['brown', 'tone'],
    ['khaki', 'tone'], ['navy', 'point'],
  ],
  orange: [
    ['denim', 'basic'], ['lightdenim', 'basic'], ['white', 'basic'], ['black', 'basic'],
    ['beige', 'tone'], ['brown', 'tone'], ['navy', 'point'],
  ],
  lightpink: [
    ['lightdenim', 'basic'], ['denim', 'basic'], ['gray', 'basic'], ['white', 'basic'],
    ['ivory', 'tone'], ['pink', 'tone'], ['lavender', 'tone'], ['mint', 'point'],
  ],
  pink: [
    ['denim', 'basic'], ['lightdenim', 'basic'], ['gray', 'basic'], ['white', 'basic'],
    ['beige', 'basic'], ['lightpink', 'tone'], ['black', 'point'], ['navy', 'point'],
  ],
  red: [
    ['black', 'basic'], ['beige', 'basic'], ['gray', 'basic'], ['white', 'basic'],
    ['charcoal', 'basic'], ['denim', 'point'], ['navy', 'point'],
  ],
  burgundy: [
    ['denim', 'basic'], ['charcoal', 'basic'], ['gray', 'basic'], ['black', 'basic'],
    ['beige', 'tone'],
  ],
  lavender: [
    ['white', 'basic'], ['gray', 'basic'], ['black', 'basic'], ['beige', 'basic'],
    ['lightdenim', 'basic'], ['ivory', 'tone'], ['lightpink', 'tone'], ['mint', 'point'],
  ],
  brown: [
    ['denim', 'basic'], ['lightdenim', 'basic'], ['black', 'basic'], ['beige', 'tone'],
    ['ivory', 'tone'], ['navy', 'point'],
  ],
}

export const TOP_COLORS = Object.keys(MATCHES).map(color)
// 하의 색: 어른 옷에 흔한 무난한 색 위주, 밝은 색은 몇 가지만 뒤에
export const BOTTOM_COLORS = [
  'denim', 'lightdenim', 'black', 'navy', 'charcoal', 'gray', 'beige', 'ivory', 'white', 'khaki', 'brown',
  'lightpink', 'skyblue',
].map(color)
const BOTTOM_IDS = new Set(BOTTOM_COLORS.map((c) => c.id))

/**
 * @param side 'top' | 'bottom'  고른 색이 상의인지 하의인지
 * @param id   고른 색 id
 * @param tone 내 톤. 하의로 찾을 때(결과가 상의일 때) 톤에 맞는 상의를 앞으로
 * @returns [{ color, type }]  반대쪽에 어울리는 색 (기본 → 톤온톤 → 포인트 → 피할 조합 순)
 */
export function matchesFor(side, id, tone = 'unknown') {
  const order = Object.keys(MATCH_TYPES)
  const list =
    side === 'top'
      ? (MATCHES[id] ?? [])
          .filter(([other]) => BOTTOM_IDS.has(other))
          .map(([other, type]) => ({ color: color(other), type }))
      : Object.entries(MATCHES).flatMap(([top, list]) =>
          list.filter(([bottom]) => bottom === id).map(([, type]) => ({ color: color(top), type })),
        )
  // 종류별로 묶고, 묶음 안에서는 컬러와 무채색을 번갈아 (앞쪽만 보여줘도 다양하게)
  return order.flatMap((type) => {
    const group = list.filter((m) => m.type === type)
    const colorful = group.filter((m) => !NEUTRALS.has(m.color.id))
    const neutral = group.filter((m) => NEUTRALS.has(m.color.id))
    const mixed = Array.from({ length: Math.max(colorful.length, neutral.length) }, (_, i) => [colorful[i], neutral[i]])
      .flat()
      .filter(Boolean)
    if (side === 'top' || type === 'avoid') return mixed
    return [...mixed.filter((m) => suitsTone(tone, m.color.id)), ...mixed.filter((m) => !suitsTone(tone, m.color.id))]
  })
}

const NEUTRALS = new Set(['white', 'ivory', 'cream', 'beige', 'gray', 'charcoal', 'black', 'navy', 'denim', 'lightdenim', 'brown'])

// ---------- 퍼스널 컬러 (선택 사항) ----------
// 안 맞는 색을 숨기지는 않고 ✨ 표시 + 앞쪽 정렬만 한다. 얼굴 가까운 상의에만 적용.

export const TONES = {
  unknown: { label: '모름' },
  warm: {
    label: '웜톤',
    colors: new Set(['ivory', 'cream', 'beige', 'lemon', 'yellow', 'mustard', 'orange', 'lime', 'khaki', 'brown', 'green']),
  },
  cool: {
    label: '쿨톤',
    colors: new Set(['white', 'skyblue', 'blue', 'navy', 'lightpink', 'pink', 'lavender', 'mint', 'gray', 'burgundy']),
  },
}

export function suitsTone(tone, colorId) {
  return TONES[tone]?.colors?.has(colorId) ?? false
}
