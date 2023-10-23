import '@/styles/globals.css'
import { MantineProvider } from '@mantine/core';
import type { AppProps } from 'next/app'
import { QueryClientProvider, QueryClient} from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google'
// import { CLIENT_ID } from '@/constants/googleAuth';
import { SessionProvider } from 'next-auth/react'


export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity },
    },
  })
  return (
  <SessionProvider session={session}>
    <QueryClientProvider client={queryClient}>
       <MantineProvider>
        <Component {...pageProps} />
      </MantineProvider>
    </QueryClientProvider>
   </SessionProvider>
  );
}