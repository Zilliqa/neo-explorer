import React, { useState, useEffect, useMemo, useContext } from 'react'
import { OverlayTrigger, Tooltip, Card, Spinner } from 'react-bootstrap'

import { QueryPreservingLink } from 'src'
import { refreshRate } from 'src/constants'
import { NetworkContext } from 'src/services/networkProvider'
import { timestampToTimeago, qaToZil } from 'src/utils/Utils'
import { TxBlockObj } from '@zilliqa-js/core/src/types'

import DisplayTable from '../../DisplayTable/DisplayTable'

import './TxBlockList.css'

const TxBlockList: React.FC = () => {

  const networkContext = useContext(NetworkContext)
  const { dataService, nodeUrl } = networkContext!

  useEffect(() => { setData(null) }, [nodeUrl]) // Unset data on url change

  const [data, setData] = useState<TxBlockObj[] | null>(null)

  const columns = useMemo(
    () => [{
      id: 'txheight-col',
      Header: 'Height',
      accessor: 'header.BlockNum',
      Cell: ({ value }: { value: string }) => (
        <QueryPreservingLink to={`txbk/${value}`}>
          {value}
        </QueryPreservingLink>
      )
    },
    {
      id: 'numTxns-col',
      Header: 'Transactions',
      accessor: 'header.NumTxns',
      Cell: ({ value }: { value: string }) => (
        <div className='text-center'>{value}</div>
      ),
    },
    {
      id: 'total-fees-col',
      Header: 'Total Fees',
      accessor: 'header.Rewards',
      Cell: ({ value }: { value: string }) => (
        <div className='text-right'>
          <OverlayTrigger placement='top'
            overlay={<Tooltip id={'amt-tt'}> {qaToZil(value)} </Tooltip>}>
            <span>{qaToZil(value, 5)}</span>
          </OverlayTrigger>
        </div>)
    },
    {
      id: 'ds-block-col',
      Header: 'DS Block',
      accessor: 'header.DSBlockNum',
      Cell: ({ value }: { value: string }) => (
        <QueryPreservingLink to={`dsbk/${value}`}>
          <div className='text-center'>{value}</div>
        </QueryPreservingLink>
      )
    },
    {
      id: 'age-col',
      Header: 'Age',
      accessor: 'header.Timestamp',
      Cell: ({ value }: { value: string }) => (
        <div className='text-right'>{
          timestampToTimeago(value)}
        </div>
      ),
    }], []
  )

  // Fetch Data
  useEffect(() => {
    let isCancelled = false
    if (!dataService) return

    let receivedData: TxBlockObj[]
    const getData = async () => {
      try {
        receivedData = await dataService.getLatest5TxBlocks()
        if (!isCancelled && receivedData)
          setData(receivedData)
      } catch (e) {
        if (!isCancelled)
          console.log(e)
      }
    }
    getData()
    
    const getDataTimer = setInterval(async () => {
      await getData()
    }, refreshRate)
    return () => {
      isCancelled = true
      clearInterval(getDataTimer)
    }
  }, [dataService])

  return <>
    <Card className='txblock-card'>
      <Card.Header>
        <div className='dsblock-card-header'>
          <span>Transaction Blocks</span>
          <QueryPreservingLink to={'txbk'}>View All</QueryPreservingLink>
        </div>
      </Card.Header>
      <Card.Body>
        {data
          ? <DisplayTable columns={columns} data={data} />
          : <Spinner animation="border" role="status" />
        }
      </Card.Body>
    </Card>
  </>
}

export default TxBlockList
