// 옷 아이템 카탈로그 (성인)
//
// range: 이 옷이 적당한 체감온도 범위 [최저, 최고]
//   - 상의·하의: 나가 있는 동안 계속 입으니 "낮 최고 체감온도"로 판단
//   - 겉옷·내의: 오갈 때 필요하니 "나갈 때·들어올 때 중 추운 시간 체감온도"로 판단
//     (흔한 "기온별 옷차림표"보다 2° 낮게 잡았다. 체감온도는 바람 때문에 보통 기온보다 낮아서,
//      표대로 두면 한 단계 두껍게 나온다. 2025.10~2026.9 서울 날씨로 계절별 확인)
// ideal: 가장 잘 맞는 온도. 여러 옷이 범위에 들면 ideal에 가까운 순으로 추천
// everyday: 평소 많이 입는 옷. 범위에 들면 이 온도(°C)만큼 더 잘 맞는 것으로 보고 앞에 둔다
// gender: 'f' 여성 옷, 'm' 남성 옷, 없으면 공용
// dress: 원피스. 하의가 따로 필요 없어서 1순위로는 두지 않고 "이것도 괜찮아요"에만 보여준다
//
// 실내(회사·카페 등)는 냉난방이 되므로 상의·하의는 기모 이상으로 두꺼워지지 않게 하고,
// 추위는 겉옷과 발열 내의로 해결한다.

export const CATEGORIES = {
  top: { label: '상의', basis: 'peak' },
  bottom: { label: '하의', basis: 'peak' },
  outer: { label: '겉옷', basis: 'cold' },
  innerwear: { label: '발열 내의', basis: 'cold' },
}

export const GENDERS = {
  any: { label: '모두 보기' },
  f: { label: '여성 옷' },
  m: { label: '남성 옷' },
}

export const CLOTHES = [
  // 상의
  { id: 'sleeveless', category: 'top', name: '민소매', emoji: '🎽', range: [28, 45], ideal: 32, gender: 'f' },
  { id: 'linen-shirt', category: 'top', name: '린넨 셔츠', emoji: '👔', range: [25, 45], ideal: 29 },
  { id: 'tshirt', category: 'top', name: '반팔 티', emoji: '👕', range: [23, 45], ideal: 27, everyday: 2 },
  { id: 'short-shirt', category: 'top', name: '반팔 셔츠', emoji: '👔', range: [23, 32], ideal: 26.5 },
  { id: 'short-blouse', category: 'top', name: '반팔 블라우스', emoji: '👚', range: [23, 32], ideal: 26.5, gender: 'f' },
  { id: 'linen-dress', category: 'top', name: '린넨 원피스', emoji: '👗', range: [24, 45], ideal: 28, gender: 'f', dress: true },
  { id: 'shirt', category: 'top', name: '셔츠', emoji: '👔', range: [17, 24], ideal: 20.5, everyday: 1 },
  { id: 'blouse', category: 'top', name: '블라우스', emoji: '👚', range: [17, 24], ideal: 20.5, gender: 'f' },
  { id: 'long-tee', category: 'top', name: '긴팔 티', emoji: '👕', range: [17, 23], ideal: 20 },
  { id: 'dress', category: 'top', name: '원피스', emoji: '👗', range: [17, 26], ideal: 21.5, gender: 'f', dress: true },
  { id: 'thin-knit', category: 'top', name: '얇은 니트', emoji: '🧶', range: [14, 21], ideal: 17.5 },
  { id: 'sweat', category: 'top', name: '맨투맨', emoji: '👕', range: [12, 19], ideal: 15.5 },
  { id: 'hoodie', category: 'top', name: '후드티', emoji: '👕', range: [12, 19], ideal: 15 },
  { id: 'knit', category: 'top', name: '니트', emoji: '🧶', range: [7, 15], ideal: 11, everyday: 1 },
  { id: 'knit-dress', category: 'top', name: '니트 원피스', emoji: '👗', range: [3, 14], ideal: 8, gender: 'f', dress: true },
  { id: 'turtle', category: 'top', name: '터틀넥 니트', emoji: '🧶', range: [-30, 10], ideal: 3 },
  { id: 'fleece-sweat', category: 'top', name: '기모 맨투맨', emoji: '🧶', range: [-30, 11], ideal: 4.5 },

  // 하의
  { id: 'shorts', category: 'bottom', name: '반바지', emoji: '🩳', range: [26, 45], ideal: 30 },
  { id: 'linen-pants', category: 'bottom', name: '린넨 바지', emoji: '👖', range: [24, 45], ideal: 28 },
  { id: 'summer-skirt', category: 'bottom', name: '얇은 치마', emoji: '👗', range: [23, 45], ideal: 27, gender: 'f' },
  { id: 'cotton-pants', category: 'bottom', name: '면바지', emoji: '👖', range: [15, 26], ideal: 20.5, everyday: 2 },
  { id: 'slacks', category: 'bottom', name: '슬랙스', emoji: '👖', range: [13, 26], ideal: 19.5, everyday: 2 },
  { id: 'long-skirt', category: 'bottom', name: '롱스커트', emoji: '👗', range: [14, 25], ideal: 19.5, gender: 'f' },
  { id: 'jeans', category: 'bottom', name: '청바지', emoji: '👖', range: [10, 22], ideal: 16, everyday: 3 },
  { id: 'corduroy', category: 'bottom', name: '코듀로이 바지', emoji: '👖', range: [3, 14], ideal: 9 },
  { id: 'skirt-tights', category: 'bottom', name: '스타킹에 치마', emoji: '👗', range: [5, 15], ideal: 10, gender: 'f' },
  { id: 'fleece-slacks', category: 'bottom', name: '기모 슬랙스', emoji: '👖', range: [-30, 10], ideal: 3, everyday: 1 },
  { id: 'fleece-jeans', category: 'bottom', name: '기모 청바지', emoji: '👖', range: [-30, 10], ideal: 3.5, everyday: 1 },
  { id: 'fleece-skirt', category: 'bottom', name: '기모 스타킹에 치마', emoji: '👗', range: [-10, 7], ideal: 2, gender: 'f' },

  // 겉옷 (no-outer = 겉옷 없음)
  { id: 'no-outer', category: 'outer', name: '겉옷 없이', emoji: '🙅', range: [20, 45], ideal: 25 },
  { id: 'cardigan', category: 'outer', name: '얇은 가디건', emoji: '🧥', range: [16, 22], ideal: 19 },
  { id: 'windbreaker', category: 'outer', name: '바람막이', emoji: '🧥', range: [12, 19], ideal: 15.5, windproof: true },
  { id: 'blazer', category: 'outer', name: '블레이저', emoji: '🧥', range: [12, 19], ideal: 15.5 },
  { id: 'denim-jacket', category: 'outer', name: '청재킷', emoji: '🧥', range: [11, 18], ideal: 14.5 },
  { id: 'trench', category: 'outer', name: '트렌치코트', emoji: '🧥', range: [7, 15], ideal: 9.5, windproof: true, everyday: 1 },
  { id: 'leather', category: 'outer', name: '가죽 재킷', emoji: '🧥', range: [6, 12], ideal: 9, windproof: true },
  { id: 'light-padding', category: 'outer', name: '경량 패딩', emoji: '🧥', range: [2, 9], ideal: 5 },
  { id: 'coat', category: 'outer', name: '울 코트', emoji: '🧥', range: [-2, 7], ideal: 3 },
  { id: 'padding', category: 'outer', name: '패딩', emoji: '🧥', range: [-8, 2], ideal: -2.5, windproof: true },
  { id: 'long-padding', category: 'outer', name: '롱패딩', emoji: '🧥', range: [-30, -2], ideal: -9, windproof: true },

  // 발열 내의
  { id: 'no-innerwear', category: 'innerwear', name: '내의 없이', emoji: '🙅', range: [1, 45], ideal: 13 },
  { id: 'innerwear', category: 'innerwear', name: '발열 내의', emoji: '🩲', range: [-30, 3], ideal: -7 },
]

/**
 * 해당 카테고리에서 온도 t에 맞는 옷들을 잘 맞는 순으로 돌려준다.
 * 범위에 드는 옷이 없으면 가장 가까운 옷 하나를 돌려준다.
 * @param gender 'any' | 'f' | 'm'  고른 성별 옷 + 공용 옷만 (any면 전부)
 */
export function optionsFor(category, t, { windy = false, gender = 'any' } = {}) {
  const items = CLOTHES.filter((c) => c.category === category && (gender === 'any' || !c.gender || c.gender === gender))
  const fit = items.filter((c) => t >= c.range[0] && t <= c.range[1])
  // 바람이 강하면 바람을 막아주는 겉옷을, 평소 많이 입는 옷은 늘 앞으로, 원피스는 뒤로.
  // '모두 보기'에서는 남녀 공용 옷을 먼저, 성별 옷은 "이것도 괜찮아요"로
  const score = (c) =>
    Math.abs(t - c.ideal) -
    (windy && c.windproof ? 3 : 0) -
    (c.everyday ?? 0) +
    (c.dress ? 100 : 0) +
    (gender === 'any' && c.gender ? 5 : 0)
  if (fit.length) return fit.sort((a, b) => score(a) - score(b))

  const distance = (c) => Math.min(Math.abs(t - c.range[0]), Math.abs(t - c.range[1]))
  return [items.sort((a, b) => distance(a) - distance(b))[0]]
}
