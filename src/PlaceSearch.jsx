import { useState } from 'react'
import { searchPlaces } from './lib/geocode.js'

/**
 * 동네 이름 검색
 * @param onSelect  ({ name, detail, lat, lon }) => void
 */
export default function PlaceSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'error'

  const search = async (e) => {
    e.preventDefault()
    const q = query.trim()
    if (!q || status === 'loading') return
    setStatus('loading')
    try {
      setResults(await searchPlaces(q))
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  const choose = (place) => {
    onSelect(place)
    setQuery('')
    setResults(null)
  }

  return (
    <div className="place-search">
      <form onSubmit={search} className="search-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="동네 이름 (예: 역삼동, 분당, 판교동)"
          enterKeyHint="search"
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? '…' : '검색'}
        </button>
      </form>

      {status === 'error' && <p className="error-text">검색하지 못했어요. 잠시 후 다시 시도해주세요.</p>}
      {results?.length === 0 && <p className="hint">찾는 동네가 없어요. "OO동"이나 "OO구"로 검색해보세요.</p>}
      {results?.length > 0 && (
        <ul className="place-results">
          {results.map((p) => (
            <li key={`${p.name}-${p.lat}-${p.lon}`}>
              <button onClick={() => choose(p)}>
                <strong>{p.name}</strong>
                <span>{p.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
