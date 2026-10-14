import { useEffect, useRef, useState } from 'react'
import { TOP_COLORS, BOTTOM_COLORS, MATCH_TYPES, TONES, matchesFor, suitsTone } from './lib/colors.js'
import { shopLinks } from './lib/shop.js'

// 조합 종류마다 최대 몇 개까지 보여줄지
const MAX_PER_GROUP = 6

const SIDES = {
  top: { label: '상의', other: 'bottom' },
  bottom: { label: '하의', other: 'top' },
}

/**
 * @param plan    선택된 날의 날씨 plan. 쇼핑 검색어에 오늘 맞는 옷 종류를 넣는 데 쓴다.
 * @param gender  성별 (쇼핑 검색어에 사용)
 * @param tone    내 톤 ('unknown' | 'warm' | 'cool')
 * @param onTone  톤 변경
 */
export default function ColorPage({ plan, dayLabel, gender, tone, onTone }) {
  const [side, setSide] = useState('top')
  const [selectedId, setSelectedId] = useState(null)
  const [picked, setPicked] = useState(null) // 크게 볼 조합 { color, type }
  const resultRef = useRef(null)

  // 색을 고르면 결과가 보이도록 스크롤
  useEffect(() => {
    if (selectedId) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedId, side])

  const palette = side === 'top' ? TOP_COLORS : BOTTOM_COLORS
  const selected = palette.find((c) => c.id === selectedId)
  const matches = selected ? matchesFor(side, selected.id, tone) : []
  // 상의 색에만 톤 표시
  const sparkle = (category, id) => category === 'top' && suitsTone(tone, id)
  const other = SIDES[side].other

  const itemNames = (category) => plan?.pieces[category].map((o) => o.name) ?? [SIDES[category].label]

  const switchSide = (next) => {
    setSide(next)
    setSelectedId(null)
    setPicked(null)
  }

  // 오늘의 추천 조합을 누르면 그 상의 색으로 바로 찾기
  const pickToday = (topId) => {
    setSide('top')
    setSelectedId(topId)
    setPicked(null)
  }

  return (
    <div className="color-page">
      {plan && (
        <section className="card">
          <h2>{dayLabel} 날씨 추천 조합</h2>
          <div className="color-pairs">
            {plan.colors.pairs.map(({ top, bottom }) => (
              <button key={top.id + bottom.id} className="color-pair" onClick={() => pickToday(top.id)}>
                <span className="swatch" style={{ background: top.hex }} />
                <span className="swatch" style={{ background: bottom.hex }} />
                <span className="color-name">
                  {top.name}+{bottom.name}
                </span>
              </button>
            ))}
          </div>
          <p className="color-reason">🎨 {plan.colors.reason}</p>
        </section>
      )}

      <section className="card">
        <div className="tone-row">
          <span className="tone-label">내 퍼스널 컬러</span>
          <div className="chips">
            {Object.entries(TONES).map(([key, { label }]) => (
              <button key={key} className={`chip ${tone === key ? 'on' : ''}`} onClick={() => onTone(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        {tone !== 'unknown' && <p className="hint">✨ 표시는 {TONES[tone].label}에 잘 어울리는 상의 색이에요.</p>}
      </section>

      <section className="card">
        <div className="segment">
          {Object.entries(SIDES).map(([key, { label }]) => (
            <button key={key} className={side === key ? 'on' : ''} onClick={() => switchSide(key)}>
              {label} 색으로 찾기
            </button>
          ))}
        </div>
        <p className="hint">입을 {SIDES[side].label} 색을 골라주세요.</p>
        <div className="palette">
          {palette.map((c) => (
            <button
              key={c.id}
              className={`palette-item ${selectedId === c.id ? 'on' : ''}`}
              onClick={() => {
                setSelectedId(c.id)
                setPicked(null)
              }}
            >
              <span className="swatch big-swatch" style={{ background: c.hex }} />
              <span>
                {sparkle(side, c.id) && '✨'}
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <section className="card" ref={resultRef}>
          <h2>
            {selected.name} {SIDES[side].label}에 어울리는 {SIDES[other].label}
          </h2>
          <p className="hint">마음에 드는 조합을 누르면 크게 보여드려요.</p>
          {Object.entries(MATCH_TYPES).map(([type, { label, reason }]) => {
            const group = matches.filter((m) => m.type === type).slice(0, MAX_PER_GROUP)
            if (!group.length) return null
            return (
              <div key={type} className="match-group">
                <p className="group-head">
                  <span className={`badge ${type}`}>{label}</span>
                  <span className="match-reason">{reason}</span>
                </p>
                <div className="match-grid">
                  {group.map(({ color }) => {
                    const top = side === 'top' ? selected : color
                    const bottom = side === 'top' ? color : selected
                    const content = (
                      <>
                        <OutfitPreview top={top.hex} bottom={bottom.hex} />
                        <strong>
                          {sparkle(other, color.id) && '✨'}
                          {color.name}
                        </strong>
                      </>
                    )
                    // 피할 조합은 눌러볼 필요가 없으니 그림만
                    if (type === 'avoid') {
                      return (
                        <div key={color.id} className="match-card avoid">
                          {content}
                        </div>
                      )
                    }
                    return (
                      <button key={color.id} className={`match-card ${type}`} onClick={() => setPicked({ color, type })}>
                        {content}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {selected && picked && (
        <ComboSheet
          top={side === 'top' ? selected : picked.color}
          bottom={side === 'top' ? picked.color : selected}
          type={picked.type}
          shop={(category, c) => shopLinks(c.name, itemNames(category), gender)[0]}
          onClose={() => setPicked(null)}
        />
      )}
    </div>
  )
}

// 고른 조합을 크게 보여주고, 그 색 옷이 없을 때 쇼핑으로 연결
function ComboSheet({ top, bottom, type, shop, onClose }) {
  const { label, reason } = MATCH_TYPES[type]
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="sheet-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        <OutfitPreview top={top.hex} bottom={bottom.hex} />
        <h2>
          {top.name} 상의 + {bottom.name} 하의
        </h2>
        <p className="group-head sheet-reason">
          <span className={`badge ${type}`}>{label}</span>
          <span className="match-reason">{reason}</span>
        </p>
        <div className="sheet-shop">
          <span className="shop-title">이 색 옷이 없다면?</span>
          <ShopLink link={shop('top', top)} />
          <ShopLink link={shop('bottom', bottom)} />
        </div>
      </section>
    </div>
  )
}

// 색 옷이 없을 때 쇼핑으로 연결 (광고 상품이면 "광고" 표시)
function ShopLink({ link }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="shop-link"
      title={`${link.label} 찾아보기`}
    >
      {link.sponsored && <span className="ad">광고</span>}
      🛍️ {link.label} 찾아보기
    </a>
  )
}

// 상의·하의 색을 입힌 작은 옷 그림
function OutfitPreview({ top, bottom }) {
  return (
    <svg className="preview" viewBox="0 0 40 58" aria-hidden="true">
      <path
        d="M13 2 L4 6 L0 14 L6 17 L8 15 L8 27 L32 27 L32 15 L34 17 L40 14 L36 6 L27 2 Q20 7 13 2 Z"
        fill={top}
        stroke="rgba(0,0,0,0.18)"
        strokeLinejoin="round"
      />
      <path
        d="M9 29 L31 29 L33 56 L23 56 L20 38 L17 56 L7 56 Z"
        fill={bottom}
        stroke="rgba(0,0,0,0.18)"
        strokeLinejoin="round"
      />
    </svg>
  )
}
