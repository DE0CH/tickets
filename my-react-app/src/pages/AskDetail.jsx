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
      successStatus="sold"
      successLabel="Sold"
    />
  )
}

export default AskDetail
