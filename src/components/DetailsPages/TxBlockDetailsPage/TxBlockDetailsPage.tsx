import React, { useMemo, useCallback, useState, useEffect, useContext } from 'react'
import { Link, useParams } from 'react-router-dom'
import { OverlayTrigger, Tooltip, Card, Row, Col, Container } from 'react-bootstrap'

import ViewAllTable from 'src/components/ViewAllPages/ViewAllTable/ViewAllTable'
import { NetworkContext } from 'src/services/networkProvider'
import { MappedTxBlock } from 'src/services/dataService'
import { qaToZil, timestampToTimeago, hexAddrToZilAddr, timestampToDisplay, pubKeyToZilAddr } from 'src/utils/Utils'
import { TransactionObj } from '@zilliqa-js/core/src/types'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy, faCaretSquareLeft, faCaretSquareRight } from '@fortawesome/free-regular-svg-icons'

import './TxBlockDetailsPage.css'

// Pre-processing data to display
const processMap = new Map()
processMap.set('amount-col', (amt: number) => (
  <OverlayTrigger placement='top'
    overlay={<Tooltip id={'tt'}> {qaToZil(amt)} </Tooltip>}>
    <span>{qaToZil(amt)}</span>
  </OverlayTrigger>
))
processMap.set('from-col', pubKeyToZilAddr)
processMap.set('to-col', hexAddrToZilAddr)
processMap.set('hash-col', (hash: number) => (<Link to={`/tx/0x${hash}`}>{'0x' + hash}</Link>))

const TxBlockDetailsPage: React.FC = () => {

  const { blockNum } = useParams()
  const networkContext = useContext(NetworkContext)
  const { dataService } = networkContext!

  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<MappedTxBlock | null>(null)
  const [latestTxBlockNum, setLatestTxBlockNum] = useState<number | null>(null)
  const [transactionData, setTransactionData] = useState<TransactionObj[] | null>(null)

  // Fetch data
  useEffect(() => {
    if (!dataService) return

    let latestTxBlockNum: number
    let receivedData: MappedTxBlock
    const getData = async () => {
      try {
        receivedData = await dataService.getTxBlockDetails(blockNum)
        if (receivedData)
          setData(receivedData)
        latestTxBlockNum = await dataService.getNumTxBlocks()
        if (latestTxBlockNum)
          setLatestTxBlockNum(latestTxBlockNum)
      } catch (e) {
        console.log(e)
      }
    }
    getData()
  }, [dataService, blockNum])

  const columns = useMemo(
    () => [{
      id: 'from-col',
      Header: 'From',
      accessor: 'pubKey',
    },
    {
      id: 'to-col',
      Header: 'To',
      accessor: 'toAddr',
    },
    {
      id: 'amount-col',
      Header: 'Amount',
      accessor: 'amount',
    },
    {
      id: 'hash-col',
      Header: 'Hash',
      accessor: 'hash',
    }], []
  )

  const fetchData = useCallback(({ pageIndex }) => {
    if (!data) return

    const getData = async () => {
      try {
        setIsLoading(true)
        let receivedData = await dataService.getTransactionsDetails(data.txnHashes.slice(pageIndex * 10, pageIndex * 10 + 10))

        if (receivedData) {
          console.log(receivedData)
          setTransactionData(receivedData)
          setIsLoading(false)
        }
      } catch (e) {
        console.log(e)
      }
    }

    getData()
  }, [dataService, data])

  return <>
    {data && (
      <>
        <div className='txblock-header'>
          <h3>
            Tx Block
              {' '}
            <span className='txblock-header-blocknum'>#{data.header.BlockNum}</span>
          </h3>
          <span>
            <Link
              style={{ marginRight: '1rem' }}
              className={parseInt(data.header.BlockNum) === 0 ? 'disabled-link' : ''}
              to={`/txbk/${parseInt(data.header.BlockNum) - 1}`}>
              <FontAwesomeIcon size='2x' icon={faCaretSquareLeft} />
            </Link>
            <Link
              className={latestTxBlockNum && parseInt(data.header.BlockNum) === latestTxBlockNum - 1 ? 'disabled-link' : ''}
              to={`/txbk/${parseInt(data.header.BlockNum) + 1}`}>
              <FontAwesomeIcon size='2x' icon={faCaretSquareRight} />
            </Link>
          </span>
        </div>
        <div style={{ display: 'flex' }}>
          {/* To be removed after SDK typing is updated
        // @ts-ignore */}
          <h6 className='txblock-hash'>{'0x' + data.body.BlockHash}</h6>
          <div onClick={() => {
            {/* To be removed after SDK typing is updated
            // @ts-ignore */}
            navigator.clipboard.writeText(data.body.BlockHash)
          }} className='txblock-hash-copy-btn'>
            <FontAwesomeIcon icon={faCopy} />
          </div>
        </div>
        <Card className='txblock-details-card'>
          <Card.Body>
            <Container>
              <Row>
                <Col>
                  <div className='txblock-detail'>
                    <span className='txblock-detail-header'>Date:</span>
                    <span>
                      {timestampToDisplay(data.header.Timestamp)}
                      {' '}
                        ({timestampToTimeago(data.header.Timestamp)})
                      </span>
                  </div>
                </Col>
                <Col>
                  <div className='txblock-detail'>
                    <span className='txblock-detail-header'>Transactions:</span>
                    <span>{data.header.NumTxns}</span>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className='txblock-detail'>
                    <span className='txblock-detail-header'>Gas Limit:</span>
                    <span>{data.header.GasLimit}</span>
                  </div>
                </Col>
                <Col>
                  <div className='txblock-detail'>
                    <span className='txblock-detail-header'>Gas Used:</span>
                    <span>{data.header.GasUsed}</span>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className='txblock-detail'>
                    <span className='txblock-detail-header'>Rewards:</span>
                    <span>{qaToZil(data.header.Rewards)}</span>
                  </div>
                </Col>
                <Col>
                  <div className='txblock-detail'>
                    <span className='txblock-detail-header'>DS Block:</span>
                    <span><Link to={`/dsbk/${data.header.DSBlockNum}`}>{data.header.DSBlockNum}</Link></span>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col>
                  <div className='txblock-detail'>
                    <span className='txblock-detail-header'>Miner:</span>
                    <span>{pubKeyToZilAddr(data.header.MinerPubKey)}</span>
                  </div>
                </Col>
              </Row>
            </Container>
          </Card.Body>
        </Card>
        {/* To be removed after SDK typing is updated
              // @ts-ignore */}
        {data.body.MicroBlockInfos.length > 0 && (
          <Card className='txblock-details-card'>
            <Card.Body>
              <Container>
                <h6>Micro Blocks</h6>
                {/* To be removed after SDK typing is updated
              // @ts-ignore */}
                {data.body.MicroBlockInfos.map((x) => <div>[{x.MicroBlockShardId}] {x.MicroBlockHash}</div>)}
              </Container>
            </Card.Body>
          </Card>
        )}
        {data.txnHashes.length > 0 && (
          <>
            <h4>Transactions</h4>
            <Card className='txblock-details-card'>
              <Card.Body>
                <ViewAllTable
                  isLoading={isLoading}
                  fetchData={fetchData}
                  pageCount={Math.ceil(data.txnHashes.length / 10)}
                  columns={columns}
                  data={transactionData ? transactionData : []}
                  processMap={processMap} />
              </Card.Body>
            </Card>
          </>
        )}
      </>
    )}
  </>
}

export default TxBlockDetailsPage
