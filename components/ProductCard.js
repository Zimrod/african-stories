import Image from 'next/image'
import Link from 'next/link'
import Price from '@/components/Price'

function ProductCard({ product }) {
  // Safely destructure with default values
  const { 
    handle = '', 
    title = '', 
    description = '', 
    price = '0.00', 
    image_src = '', 
    image_alt = '' 
  } = product || {}

  // Truncate description to 100 characters
  const truncatedDescription = description.length > 100 
    ? description.substring(0, 80) + '...' 
    : description

  return (
    <Link
      href={`/products/${handle}`}
      passHref
      className="h-120 w-72 rounded shadow-lg mx-auto border border-palette-lighter"
    >
      <div className="h-72 border-b-2 border-palette-lighter relative">
        {image_src && (
          <Image
            src={image_src}
            alt={image_alt || title}
            layout="fill"
            className="transform duration-500 ease-in-out hover:scale-110"
            objectFit="cover"
          />
        )}
      </div>
      <div className="h-48 relative">
        <div className="font-primary text-palette-primary text-2xl pt-4 px-4 font-semibold">
          {title}
        </div>
        <div className="text-lg text-gray-600 p-4 font-primary font-light">
          {truncatedDescription}
        </div>
        <div className="text-palette-dark font-primary font-medium text-base absolute bottom-0 right-0 mb-4 pl-8 pr-4 pb-1 pt-2 bg-palette-lighter rounded-tl-sm triangle">
          <Price
            currency="$"
            num={price}
            numSize="text-lg"
          />
        </div>
      </div>
    </Link>
  )
}

export default ProductCard