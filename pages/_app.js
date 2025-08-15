import Layout from '@/components/Layout'
import SEO from '@/components/SEO'
import '@/styles/globals.css'
import ChatbotWidget from "@/components/ChatbotWidget";

function MyApp({ Component, pageProps }) {

  return (
    <Layout>
      <SEO 
        title={process.env.siteTitle}
      />
      <Component {...pageProps} />
      <ChatbotWidget />
    </Layout>
  )
}

export default MyApp
