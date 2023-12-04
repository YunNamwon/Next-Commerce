import '@/styles/globals.css'
import { MantineProvider } from '@mantine/core';
import type { AppProps } from 'next/app'
import { QueryClientProvider, QueryClient} from 'react-query';
import { SessionProvider } from 'next-auth/react'
import Header from '@/components/Header';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity },
    },
  })
  return (
    
  <SessionProvider session={session}>
    <QueryClientProvider client={queryClient}>
    <Header/>
      <div className='px-36'>
       <MantineProvider>
        <Component {...pageProps} />
      </MantineProvider>
      </div>
    </QueryClientProvider>
   </SessionProvider>
  );
}