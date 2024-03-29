import CustomEditor from '@/components/Editor'
import { Cart, OrderItem, products } from '@prisma/client'
import { convertFromRaw, EditorState } from 'draft-js'
import { format } from 'date-fns'
import { GetServerSidePropsContext } from 'next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Carousel from 'nuka-carousel'
import { useState } from 'react'
import { CATEGORY_MAP } from '@/constants/products'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { IconHeart, IconShoppingCart } from '@tabler/icons-react'
import { useSession } from 'next-auth/react'
import { CART_QUERY_KEY } from '@/pages/cart'
import { ORDER_QUERY_KEY } from '@/pages/my'
import CommentItem from '@/components/CommentItem'
import Button from '@/components/Button'
import InputNumber from '@/components/InputNumber'

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const product = await fetch(
    `${process.env.NEXTAUTH_URL}/api/get-product?id=${context.params?.id}`
  )
    .then((res) => res.json())
    .then((data) => data.items)

  const comments = await fetch(
    `${process.env.NEXTAUTH_URL}/api/get-comments?productId=${context.params?.id}`
  )
    .then((res) => res.json())
    .then((data) => data.items)

  return {
    props: {
      product: { ...product, images: [product.image_url, product.image_url] },
      comments: comments,
    },
  }
}

const WISHLIST_QUERY_KEY = '/api/get-wishlist'

export interface CommentItemType extends Comment, OrderItem {
  images: any
  contents: string
  updatedAt: string | number | Date
  rate: number
}

export default function Products(props: {
  product: products & { images: string[] }
  comments: CommentItemType[]
}) {
  const [index, setIndex] = useState(0)
  const { data: session } = useSession()
  const [value, setValue] = useState<any>(0)

  const router = useRouter()
  const queryClient = useQueryClient()
  const { id: productId } = router.query

  const [editorState] = useState<EditorState | undefined>(() =>
    props.product.contents
      ? EditorState.createWithContent(
          convertFromRaw(JSON.parse(props.product.contents))
        )
      : EditorState.createEmpty()
  )

  const { data: wishlist } = useQuery([WISHLIST_QUERY_KEY], () =>
    fetch(WISHLIST_QUERY_KEY)
      .then((res) => res.json())
      .then((data) => data.items)
  )

  const { mutate } = useMutation<unknown, unknown, string, any>(
    (productId) =>
      fetch('/api/update-wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      })
        .then((data) => data.json())
        .then((res) => res.items),
    {
      onMutate: async (productId) => {
        await queryClient.cancelQueries([WISHLIST_QUERY_KEY])

        // Snapshot the previous value
        const previous = queryClient.getQueryData([WISHLIST_QUERY_KEY])

        // Optimistically update to the new value
        queryClient.setQueryData<string[]>([WISHLIST_QUERY_KEY], (old) =>
          old
            ? old.includes(String(productId))
              ? old.filter((id) => id !== String(productId))
              : old.concat(String(productId))
            : []
        )

        // Return a context object with the snapshotted value
        return { previous }
      },
      onError: (error, _, context) => {
        queryClient.setQueryData([WISHLIST_QUERY_KEY], context.previous)
      },
      onSuccess: () => {
        queryClient.invalidateQueries([WISHLIST_QUERY_KEY])
      },
    }
  )

  const { mutate: addCart } = useMutation<
    unknown,
    unknown,
    Omit<Cart, 'id' | 'userId'>,
    any
  >(
    (item) =>
      fetch('/api/add-cart', {
        method: 'POST',
        body: JSON.stringify({ item }),
      })
        .then((data) => data.json())
        .then((res) => res.items),
    {
      onMutate: () => {
        queryClient.invalidateQueries([CART_QUERY_KEY])
      },
      onSuccess: () => {
        router.push('/cart')
      },
    }
  )

  const { mutate: addOrder } = useMutation<
    unknown,
    unknown,
    Omit<OrderItem, 'id'>[],
    any
  >(
    (items) =>
      fetch('/api/add-order', {
        method: 'POST',
        body: JSON.stringify({ items }),
      })
        .then((data) => data.json())
        .then((res) => res.items),
    {
      onMutate: () => {
        queryClient.invalidateQueries([ORDER_QUERY_KEY])
      },
      onSuccess: () => {
        router.push('/my')
      },
    }
  )

  const product = props.product

  const validate = (type: 'cart' | 'order') => {
    if (value == 0) {
      alert('최소수량을 입력하세요.')
      return
    }

    // 장바구니에 등록하는 기능
    if (type == 'cart')
      addCart({
        productId: product.id,
        quantity: value,
        amount: product.price * value,
      })
    router.push('/cart')

    if (type === 'order') {
      addOrder([
        {
          productId: product.id,
          quantity: value,
          price: product.price,
          amount: product.price * value,
        },
      ])
    }
  }

  const isWished =
    wishlist != null && productId != null
      ? wishlist.includes(String(productId))
      : false

  return (
    <>
      {product != null && productId != null ? (
        <div className="flex flex-row ">
          <div style={{ maxWidth: 700, marginRight: 100, padding: 50 }}>
            <Carousel
              animation="fade"
              withoutControls
              wrapAround
              speed={10}
              slideIndex={index}
            >
              {product.images.map((url, idx) => (
                <Image
                  key={`${url}-carousel-${idx}`}
                  src={url}
                  alt="image"
                  width={600}
                  height={600}
                  layout="fixed"
                />
              ))}
            </Carousel>
            <div className="flex space-x-4 mt-3">
              {product.images.map((url, idx) => (
                <div key={`${url}-thumbs-${idx}`} onClick={() => setIndex(idx)}>
                  <Image src={url} alt="image" width={150} height={100} />
                </div>
              ))}
            </div>
            {editorState != null && (
              <CustomEditor editorState={editorState} readOnly />
            )}
            <div>
              <p className="text-2xl font-semibold mb-3 ">후기</p>
              {props.comments &&
                props.comments.map((comment, idx) => (
                  <CommentItem key={idx} item={comment} />
                ))}
            </div>
          </div>
          <div style={{ maxWidth: 700 }} className="flex flex-col space-y-6">
            <div className="text-lg text-zinc-400">
              {CATEGORY_MAP[product.category_id - 1]}
            </div>
            <div className="text-4xl font-semibold">{product.name}</div>
            <div className="text-lg">
              {product.price.toLocaleString('ko-kr')}원
            </div>

            <div>
              수량 :{' '}
              <InputNumber
                value={typeof value === 'number' ? value : 0}
                onChange={(e) => setValue(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex space-x-3">
              <Button
                className="flex items-center"
                style={{ backgroundColor: 'black' }}
                onClick={() => {
                  if (session == null) {
                    alert('로그인이 필요해요')
                    router.push('/auth/login')
                    return
                  }
                  validate('cart')
                }}
              >
                <IconShoppingCart />
                장바구니
              </Button>

              <Button
                className="flex items-center"
                // loading={isLoading}
                disabled={wishlist == null}
                style={{ backgroundColor: isWished ? 'red' : 'grey' }}
                onClick={() => {
                  if (session == null) {
                    alert('로그인이 필요해요')
                    router.push('/auth/login')
                    return
                  }
                  mutate(String(productId))
                }}
              >
                <IconHeart />
                찜하기
              </Button>
            </div>
            <Button
              style={{ backgroundColor: 'black' }}
              onClick={() => {
                if (session == null) {
                  alert('로그인이 필요해요')
                  router.push('/auth/login')
                  return
                }
                validate('order')
              }}
            >
              구매하기
            </Button>

            <div className="text-sm text-zinc-300">
              등록:{format(new Date(product.createdAt), 'yyyy년 M월 d일')}
            </div>
          </div>
        </div>
      ) : (
        <div> 로딩중</div>
      )}
    </>
  )
}
