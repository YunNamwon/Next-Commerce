// import { CountControl } from '@components/CountControl'
import styled from '@emotion/styled'
import { Badge} from '@mantine/core'
import { Cart, OrderItem, Orders } from '@prisma/client'
import { IconX } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { format } from 'date-fns'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import InputNumber from '@/components/InputNumber'
import Button from '@/components/Button'

interface OrderItemDetail extends OrderItem {
  name: string
  image_url: string
}

interface OrderDetail extends Orders {
  orderItems: OrderItemDetail[]
}

const ORDER_STATUS_MAP = [
  '주문취소',
  '주문대기',
  '결제대기',
  '결제완료',
  '배송대기',
  '배송중',
  '배송완료',
  '환불대기',
  '환불완료',
  '반품대기',
  '반품완료',
]

export const ORDER_QUERY_KEY = '/api/get-order'

export default function MyPage() {
  const router = useRouter()

  const { data } = useQuery<{ items: OrderDetail[] }, unknown, OrderDetail[]>(
    [ORDER_QUERY_KEY],
    () =>
      fetch(ORDER_QUERY_KEY)
        .then((res) => res.json())
        .then((data) => data.items)
  )

  return (
    <div>
      <span className="text-2xl mb-3">주문내역 ({data ? data.length : 0})</span>
      <div className="flex">
        <div className="flex flex-col p-4 space-y-4 flex-1">
          {data ? (
            data.length > 0 ? (
              data.map((item, idx) => <DetailItem key={idx} {...item} />)
            ) : (
              <div>주문내역이 아무것도 없습니다.</div>
            )
          ) : (
            <div>불러오는 중...</div>
          )}
        </div>
      </div>
    </div>
  )
}

const DetailItem = (props: OrderDetail) => {
  const queryClient = useQueryClient()
  const { mutate: updateOrderStatus } = useMutation<
    unknown,
    unknown,
    number,
    any
  >(
    (status) =>
      fetch('/api/update-order-status', {
        method: 'POST',
        body: JSON.stringify({
          id: props.id,
          status: status,
          userId: props.userId,
        }),
      })
        .then((data) => data.json())
        .then((res) => res.items),
    {
      onMutate: async (status) => {
        await queryClient.cancelQueries([ORDER_QUERY_KEY])

        // Snapshot the previous value
        const previous = queryClient.getQueryData([ORDER_QUERY_KEY])

        // Optimistically update to the new value
        queryClient.setQueryData<Cart[]>([ORDER_QUERY_KEY], (old) =>
          (old || []).map((c) => {
            if (c.id === props.id) {
              return { ...c, status: status }
            }
            return c
          })
        )

        // Return a context object with the snapshotted value
        return { previous }
      },
      onError: (error, _, context) => {
        queryClient.setQueryData([ORDER_QUERY_KEY], context.previous)
      },
      onSuccess: () => {
        queryClient.invalidateQueries([ORDER_QUERY_KEY])
      },
    }
  )

  const handlePayment = () => {
    // 주문상태를 5 로 바꿔주라
    updateOrderStatus(5)
  }

  const handleCancel = () => {
    // 주문상태를 -1 로 바꿔주라
    updateOrderStatus(-1)
  }
  return (
    <div
      className="w-full flex flex-col p-4 rounded-md"
      style={{ border: '1px solid grey' }}
    >
      <div className="flex">
        <Badge color={props.status < 1 ? 'red' : ''} className="mb-2">
          {ORDER_STATUS_MAP[props.status + 1]}
        </Badge>
        <IconX className="ml-auto" onClick={handleCancel} />
      </div>
      {props.orderItems.map((orderItem, idx) => (
        <Item key={idx} {...orderItem} status={props.status} />
      ))}
      <div className="flex mt-4">
        <div className="flex flex-col">
          <span className="mb-2">주문 정보</span>
          <span>받는사람: {props.receiver ?? '입력필요'}</span>
          <span>주소: {props.address ?? '입력필요'}</span>
          <span>연락처: {props.phoneNumber ?? '입력필요'}</span>
        </div>
        <div className="flex flex-col ml-auto mr-4 text-right">
          <span className="font-semibold mb-2">
            합계 금액:{' '}
            <span className="text-red-500">
              {props.orderItems
                .map((item) => item.amount)
                .reduce((prev, curr) => prev + curr, 0)
                .toLocaleString('ko-kr')}{' '}
              원
            </span>
          </span>
          <span className="text-zinc-400 mt-auto mb-auto">
            주문일자:{' '}
            {format(new Date(props.createdAt), 'yyyy년 M월 d일 HH:mm:ss')}
          </span>
          <Button
            style={{ backgroundColor: 'black', color: 'white' }}
            onClick={handlePayment}
          >
            결제 처리
          </Button>
        </div>
      </div>
    </div>
  )
}

const Item = (props: OrderItemDetail & { status: number }) => {
  const router = useRouter()
  const [value, setValue] = useState<any>(props.quantity)
  const [amount, setAmount] = useState<number>(props.quantity)
  useEffect(() => {
    if (value != null) {
      setAmount(value * props.price)
    }
  }, [value, props.price])

  const handleComment = () => {
    router.push(`/comment/edit?orderItemId=${props.id}`)
  }

  return (
    <div className="w-full flex p-4" style={{ borderBottom: '1px solid grey' }}>
      <Image
        src={props.image_url}
        width={155}
        height={195}
        alt={props.name}
        onClick={() => router.push(`/products/${props.productId}`)}
      />
      <div className="flex flex-col ml-4">
        <span className="font-semibold mb-2">{props.name}</span>
        <span className="mb-auto">
          가격: {props.price.toLocaleString('ko-kr')} 원
        </span>
        <div className="flex items-center space-x-4">
          <InputNumber
            value={typeof value === 'number' ? value : 0}
            onChange={(e) => setValue(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="flex flex-col ml-auto space-x-4">
        {props.status === 5 && (
          <Button
            style={{
              backgroundColor: 'black',
              color: 'white',
              marginTop: 'auto',
            }}
            onClick={handleComment}
          >
            후기 작성
          </Button>
        )}
      </div>
    </div>
  )
}

const Row = styled.div`
  display: flex;
  * ~ * {
    margin-left: auto;
  }
`
