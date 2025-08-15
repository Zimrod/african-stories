import ProductSection from '@/components/ProductSection'
import { getAllProducts, getProductByHandle } from '@/lib/supabase'

function ProductPage({ productData }) {  
  return (
    <div className="min-h-screen py-12 sm:pt-20">
      <ProductSection productData={productData} />
    </div>
  )
}

// This should ONLY be in dynamic route files like [product].js
export async function getStaticPaths() {
  const products = await getAllProducts()
  
  const paths = products.map((product) => ({
    params: { product: product.handle }
  }))

  return {
    paths,
    fallback: 'blocking' // Recommended for SSG with dynamic routes
  }
}

export async function getStaticProps({ params }) {
  const productData = await getProductByHandle(params.product)

  if (!productData) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      productData,
    },
    revalidate: 60
  }
}

export default ProductPage