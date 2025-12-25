import type { AppProps, NextWebVitalsMetric } from 'next/app.js'
import type { NextPage } from 'next/types/index.js'
import { useReportWebVitals } from 'next/web-vitals.js'

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: React.ReactElement) => React.ReactNode
}

const reportWebVitals = (metric: NextWebVitalsMetric) => {
  return {
    category: metric.label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value), // values must be integers
    label: metric.id, // id unique to current page load
    nonInteraction: true, // avoids affecting bounce rate.
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  useReportWebVitals(reportWebVitals)

  return <Component {...pageProps} />
}

export default MyApp
