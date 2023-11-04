import {
  IconHeart,
  IconHome,
  IconShoppingCart,
  IconUser,
  IconLogout,
} from '@tabler/icons-react'
import { signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/router'

export default function Header() {
  const { data: session } = useSession()
  const router = useRouter()
  return (
    <div className="mt-12 mb-12">
      <div className="w-full flex h-50 items-center">
        <IconHome onClick={() => router.push('/')} />
        <span className="ml-2">Home</span>
        {session ? (
          <>
            <IconLogout className="icon ml-4" onClick={() => signOut()} />
            <span className="ml-2">LogOut</span>
          </>
        ) : null}
        <span className="m-auto" />
        <IconHeart onClick={() => router.push('/wishlist')} />
        <span className="ml-1">찜</span>
        <IconShoppingCart
          className="ml-3"
          onClick={() => router.push('/cart')}
        />
        <span className='mr-2'>장바구니</span>

        {session ? (
          <Image
            src={session.user?.image!}
            alt="profile"
            width={30}
            height={30}
            style={{ borderRadius: '50%' }}
            onClick={() => router.push('/my')}
          />
        ) : (
          <IconUser
            className="ml-1 "
            onClick={() => router.push('/auth/login')}
          />
        )}
        <span>MyPage</span>
      </div>
    </div>
  )
}
