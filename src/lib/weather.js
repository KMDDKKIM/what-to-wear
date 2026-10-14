// 날씨 데이터: Open-Meteo (무료, API 키 불필요)
// 나중에 기상청 API로 바꿀 때는 이 파일만 교체하면 되도록 normalize 결과 형태를 고정해둔다.

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality'

/**
 * @returns {Promise<Array<{
 *   date: string, max: number, min: number,
 *   hours: Array<{ hour, temp, feels, rainProb, code, wind, uv, pm10, pm25 }>
 * }>>}  오늘, 내일 2일치. hours[i]는 i시 데이터.
 */
export async function fetchWeather({ lat, lon }) {
  const common = {
    latitude: lat,
    longitude: lon,
    timezone: 'Asia/Seoul',
    forecast_days: '2',
  }
  const forecastParams = new URLSearchParams({
    ...common,
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m,uv_index',
    daily: 'temperature_2m_max,temperature_2m_min',
    wind_speed_unit: 'ms',
  })
  const airParams = new URLSearchParams({ ...common, hourly: 'pm10,pm2_5' })

  const [forecast, air] = await Promise.all([
    fetch(`${FORECAST_URL}?${forecastParams}`).then((r) => {
      if (!r.ok) throw new Error('날씨 정보를 불러오지 못했어요.')
      return r.json()
    }),
    // 미세먼지는 실패해도 앱은 동작하게
    fetch(`${AIR_URL}?${airParams}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ])

  return normalize(forecast, air)
}

function normalize(forecast, air) {
  const h = forecast.hourly
  const airByTime = {}
  if (air?.hourly) {
    air.hourly.time.forEach((t, i) => {
      airByTime[t] = { pm10: air.hourly.pm10[i], pm25: air.hourly.pm2_5[i] }
    })
  }

  const days = forecast.daily.time.map((date, i) => ({
    date,
    max: forecast.daily.temperature_2m_max[i],
    min: forecast.daily.temperature_2m_min[i],
    hours: [],
  }))

  h.time.forEach((t, i) => {
    const day = days.find((d) => t.startsWith(d.date))
    if (!day) return
    day.hours.push({
      hour: Number(t.slice(11, 13)),
      temp: h.temperature_2m[i],
      feels: h.apparent_temperature[i],
      rainProb: h.precipitation_probability[i] ?? 0,
      code: h.weather_code[i],
      wind: h.wind_speed_10m[i],
      uv: h.uv_index[i] ?? 0,
      pm10: airByTime[t]?.pm10 ?? null,
      pm25: airByTime[t]?.pm25 ?? null,
    })
  })

  return days
}

// WMO 날씨 코드 → 이모지 + 설명
export function describeWeather(code) {
  if (code === 0) return { emoji: '☀️', text: '맑음' }
  if (code <= 2) return { emoji: '🌤️', text: '구름 조금' }
  if (code === 3) return { emoji: '☁️', text: '흐림' }
  if (code <= 48) return { emoji: '🌫️', text: '안개' }
  if (code <= 57) return { emoji: '🌦️', text: '이슬비' }
  if (code <= 67) return { emoji: '🌧️', text: '비' }
  if (code <= 77) return { emoji: '🌨️', text: '눈' }
  if (code <= 82) return { emoji: '🌧️', text: '소나기' }
  if (code <= 86) return { emoji: '🌨️', text: '눈' }
  return { emoji: '⛈️', text: '뇌우' }
}

// 한국 환경부 기준 미세먼지 등급
export function dustGrade(pm10, pm25) {
  if (pm10 == null && pm25 == null) return null
  const g10 = pm10 == null ? 0 : pm10 <= 30 ? 0 : pm10 <= 80 ? 1 : pm10 <= 150 ? 2 : 3
  const g25 = pm25 == null ? 0 : pm25 <= 15 ? 0 : pm25 <= 35 ? 1 : pm25 <= 75 ? 2 : 3
  const level = Math.max(g10, g25)
  return { level, text: ['좋음', '보통', '나쁨', '매우 나쁨'][level] }
}
