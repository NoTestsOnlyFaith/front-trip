export interface Address {
  id: number
  street: string
  buildingNumber: string
  apartmentNumber: string | null
  postalCode: string
  city: string
  country: string
  additionalInfo: string | null
}

export interface Place {
  id: number
  name: string
  addressId: number
  address: Address
  latitude: number
  longitude: number
  category: string
  description: string
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
  reservations: any[]
}

export const usePlacesService = () => {
  const config = {
    baseURL: '/api'
  }

  const getPlaces = () => {
    return useFetch<Place[]>('Places', config)
  }

  const getPlaceById = (id: string | number) => {
    return useFetch<Place>(`Places/${id}`, config)
  }

  return {
    getPlaces,
    getPlaceById
  }
}
