import { useParams } from 'react-router-dom'
import ListingDetail from '../components/ListingDetail.jsx'

function BidDetail() {
  const { bidId } = useParams()

  return (
    <ListingDetail
      itemId={bidId}
      itemCollection="bid"
      historyCollection="bid_history"
      historyKey="bid_id"
      title="Bid"
      personLabel="Buyer"
      historyLogLabel="Bid"
      successStatus="filled"
      successLabel="Filled"
    />
  )
}

export default BidDetail
