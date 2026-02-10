import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatPrice } from '../utils/format.js'

function ActivityTable({
  title,
  items,
  emptyText,
  formatTimestamp,
  detailPath = '',
  showEvent = true,
}) {
  const navigate = useNavigate()
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' })

  const handleRowClick = (itemId) => {
    if (!detailPath) return
    navigate(`${detailPath}/${itemId}`)
  }

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      return { key, direction: 'desc' }
    })
  }

  const sortedItems = useMemo(() => {
    const withDate = (value) => {
      if (!value) return null
      if (typeof value.toDate === 'function') {
        return value.toDate()
      }
      return value instanceof Date ? value : null
    }

    return [...items].sort((a, b) => {
      if (sort.key === 'price') {
        const priceA = Number(a.price ?? 0)
        const priceB = Number(b.price ?? 0)
        return sort.direction === 'asc' ? priceA - priceB : priceB - priceA
      }

      const dateA = withDate(a.created_at)?.getTime() ?? 0
      const dateB = withDate(b.created_at)?.getTime() ?? 0
      return sort.direction === 'asc' ? dateA - dateB : dateB - dateA
    })
  }, [items, sort])

  const sortIndicator = (key) =>
    sort.key === key ? (sort.direction === 'asc' ? '▲' : '▼') : '↕'

  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <h2 className="h6 text-uppercase text-secondary mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-secondary mb-0">{emptyText}</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0 table-clickable">
            <thead>
              <tr>
                {showEvent && <th scope="col">Event</th>}
                <th scope="col">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-dark fw-semibold"
                    onClick={() => toggleSort('price')}
                    aria-label="Sort by price"
                  >
                    Price <span className="text-secondary">{sortIndicator('price')}</span>
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none text-dark fw-semibold"
                    onClick={() => toggleSort('date')}
                    aria-label="Sort by date listed"
                  >
                    Date listed <span className="text-secondary">{sortIndicator('date')}</span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => handleRowClick(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handleRowClick(item.id)
                    }
                  }}
                >
                  {showEvent && <td>{item.event_id || '—'}</td>}
                  <td>{formatPrice(item.price)}</td>
                  <td>{formatTimestamp(item.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ActivityTable
