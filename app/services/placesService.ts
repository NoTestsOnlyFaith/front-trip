export interface Place {
  id: number
  name: string
  lat: number
  lng: number
  category: string
}

export const usePlacesService = () => {
  const config = {
    baseURL: '/api'
  }

  const getPlaces = () => {
    return useFetch<Place[]>('places', config)
  }

  const getPlaceById = (id: string | number) => {
    return useFetch<Place>(`places/${id}`, config)
  }

  return {
    getPlaces,
    getPlaceById
  }
}
