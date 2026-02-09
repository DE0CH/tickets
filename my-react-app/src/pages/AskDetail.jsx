import { useParams } from 'react-router-dom'
import ListingDetail from '../components/ListingDetail.jsx'

function AskDetail() {
  const { askId } = useParams()

  return (
    <ListingDetail
      itemId={askId}
      itemCollection="ask"
      historyCollection="ask_history"
      historyKey="ask_id"
      title="Ask"
      personLabel="Seller"
    />
  )
}

export default AskDetail
