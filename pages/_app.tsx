import '@/styles/globals.css'
import { MantineProvider } from '@mantine/core';
import type { AppProps } from 'next/app'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';


export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity },
    },
  })
  return (
   <QueryClientProvider client={queryClient}>
     <MantineProvider>
      <Component {...pageProps} />
     </MantineProvider>
   </QueryClientProvider>
  );
}