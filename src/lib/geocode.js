// 동네 이름 검색 / 현재 위치 이름 찾기
//
// OpenStreetMap Nominatim (무료, 키 불필요)
// 사용 규칙: 초당 1회 이하, 입력할 때마다 자동검색 금지 → 검색 버튼을 눌렀을 때만 호출한다.
// 정식 출시 때는 카카오 로컬 API로 교체 권장 (이 파일만 바꾸면 됨)

const BASE = 'https://nominatim.openstreetmap.org'

/** 'OO동, OO구, OO시, 경기도, 12345, 대한민국' → '경기도 OO시 OO구' (큰 지역부터, 이름·우편번호 제외) */
function regionOf(displayName) {
  return displayName
    .split(', ')
    .slice(1)
    .filter((part) => part !== '대한민국' && !/\d/.test(part))
    .reverse()
    .join(' ')
}

/**
 * @returns [{ name, detail, lat, lon }]
 */
export async function searchPlaces(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    countrycodes: 'kr',
    'accept-language': 'ko',
    limit: '8',
  })
  const res = await fetch(`${BASE}/search?${params}`)
  if (!res.ok) throw new Error('검색하지 못했어요. 잠시 후 다시 시도해주세요.')
  const results = await res.json()

  const seen = new Set()
  return results
    .map((r) => ({ name: r.name, detail: regionOf(r.display_name), lat: Number(r.lat), lon: Number(r.lon) }))
    .filter((p) => {
      const key = p.name + p.detail
      if (!p.name || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

/** 좌표 → 동네 이름 (예: '역삼2동'). 실패하면 null */
export async function placeNameAt(lat, lon) {
  try {
    const params = new URLSearchParams({ lat, lon, format: 'jsonv2', 'accept-language': 'ko', zoom: '16' })
    const res = await fetch(`${BASE}/reverse?${params}`)
    if (!res.ok) return null
    const { address } = await res.json()
    return address?.quarter ?? address?.suburb ?? address?.borough ?? address?.city ?? null
  } catch {
    return null
  }
}
