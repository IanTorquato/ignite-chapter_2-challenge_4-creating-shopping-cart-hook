import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]

      const productAlreadyInCart = updatedCart.find(product => product.id === productId)
      
      const quantInCart = productAlreadyInCart ? productAlreadyInCart.amount : 0

      const productStock: number = (await api.get(`stock/${productId}`)).data.amount

      if (quantInCart + 1 > productStock) {
        toast.error('Quantidade solicitada fora de estoque')
        
        return
      }

      if (!productAlreadyInCart) {
        const product: Product = (await api.get(`products/${productId}`)).data

        const newProduct = { ...product, amount: 1 }

        updatedCart.push(newProduct)
      } else {
        productAlreadyInCart.amount = quantInCart + 1
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na adição do produto')
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]

      const productIndex = updatedCart.findIndex(product => product.id === productId)

      if (productIndex >= 0) {
        updatedCart.splice(productIndex, 1)

        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))

        return
      }

      throw Error()
    } catch {
      toast.error('Erro na remoção do produto')
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const updatedCart = [...cart]

      const productAlreadyInCart = updatedCart.find(product => product.id === productId)

      const quantInCart = productAlreadyInCart ? productAlreadyInCart.amount : 0

      if (quantInCart < amount) {
        const productStock: number = (await api.get(`stock/${productId}`)).data.amount

        if (quantInCart + 1 > productStock) {
          toast.error('Quantidade solicitada fora de estoque')
        
          return
        }
      }
      
      productAlreadyInCart!.amount = amount

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
