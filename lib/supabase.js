import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export async function getAllProducts() {
  console.log('Fetching products from Supabase...')
  const { data, error } = await supabase
    .from('books')
    .select('*')
    // .order('title', { ascending: true })
  
  if (error) {
    console.error('Supabase Error:', error)
    return []
  }
  
  console.log('Fetched products:', data.length)
  return data
}

export async function getProductByHandle(handle) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('handle', handle)
    .single()
  
  if (error) {
    console.error('Error fetching product:', error)
    return null
  }
  
  return data
}