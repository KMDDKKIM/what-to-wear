import { RATINGS, WHENS } from './lib/feedback.js'

/**
 * 오늘 옷차림 피드백 카드
 * @param entry     오늘 남긴 피드백 (없으면 undefined)
 * @param onChange  (entry | null) => void   null이면 오늘 피드백 삭제
 * @param beforeBack  집에 들어오기 전이면 안내 문구를 바꾼다
 */
export default function FeedbackCard({ entry, onChange, beforeBack }) {
  const rate = (rating) => onChange({ rating, when: null })
  const setWhen = (when) => onChange({ ...entry, when })

  if (!entry) {
    return (
      <section className="card feedback">
        <h2>오늘 옷차림 어땠어요?</h2>
        <div className="rating-buttons">
          {Object.entries(RATINGS).map(([key, { emoji, label }]) => (
            <button key={key} className="rating" onClick={() => rate(key)}>
              <span className="rating-emoji">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
        <p className="hint">
          {beforeBack ? '집에 들어와서 알려주시면' : '알려주시면'} 내 몸에 맞게 다음 추천을 조정할게요.
        </p>
      </section>
    )
  }

  const { emoji, label } = RATINGS[entry.rating]
  const askWhen = entry.rating !== 'good'

  return (
    <section className="card feedback">
      <p className="feedback-done">
        <span className="rating-emoji">{emoji}</span>
        <span>
          오늘은 <strong>{label}</strong>
        </span>
        <button className="link-btn" onClick={() => onChange(null)}>
          다시 고르기
        </button>
      </p>

      {askWhen && (
        <div className="when">
          <span className="when-label">언제 {entry.rating === 'cold' ? '추웠나요' : '더웠나요'}?</span>
          <div className="chips">
            {Object.entries(WHENS).map(([key, text]) => (
              <button
                key={key}
                className={`chip ${entry.when === key ? 'on' : ''}`}
                onClick={() => setWhen(entry.when === key ? null : key)}
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="hint thanks">
        {entry.rating === 'good' ? '좋아요! 지금 기준을 유지할게요.' : '고마워요! 다음 추천부터 반영할게요.'}
      </p>
    </section>
  )
}
