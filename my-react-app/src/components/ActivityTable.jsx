import { useNavigate } from 'react-router-dom'

function ActivityTable({
  title,
  items,
  emptyText,
  formatTimestamp,
  detailPath = '',
  showEvent = true,
}) {
  const navigate = useNavigate()

  const handleRowClick = (itemId) => {
    if (!detailPath) return
    navigate(`${detailPath}/${itemId}`)
  }

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
                <th scope="col">Price</th>
                <th scope="col">Date listed</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
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
                  <td>{item.price ?? '—'}</td>
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
