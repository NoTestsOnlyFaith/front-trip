import { defineEventHandler, createError, getRequestURL } from 'h3'

interface Address {
  id: number;
  street: string;
  buildingNumber: string;
  apartmentNumber: string | null;
  postalCode: string;
  city: string;
  country: string;
  additionalInfo: string | null;
}

interface Place {
  id: number;
  name: string;
  addressId: number;
  address: Address;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  reservations: any[];
}

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)

  if (pathname === '/api/Places') {
    try {
      const response = await fetch('http://localhost:5252/api/Places')
      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          statusMessage: `Failed to fetch places from external API: ${response.statusText}`
        })
      }
      const placesData: Place[] = await response.json()
      return placesData
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error while fetching places'
      })
    }
  }
  // Handle GET place by ID
  else if (pathname.startsWith('/api/Places/') && pathname.split('/').length === 4 && pathname.split('/')[3] !== '') {
    const parts = pathname.split('/')
    const id = parts[3]
    try {
      const response = await fetch(`http://localhost:5252/api/Places/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw createError({ statusCode: 404, statusMessage: `Place with id ${id} not found (from external API)` })
        }
        throw createError({
          statusCode: response.status,
          statusMessage: `Failed to fetch place with id ${id} from external API: ${response.statusText}`,
        })
      }
      const placeData: Place = await response.json()
      return placeData
    } catch (error: any) {
      if (error.statusCode) {
        throw error;
      }
      throw createError({
        statusCode: 500,
        statusMessage: `Internal Server Error while fetching place with id ${id}`
      })
    }
  }

  console.warn(`[API Middleware] Pathname ${pathname} not handled by any route.`);
  throw createError({
    statusCode: 404,
    statusMessage: 'API endpoint not found in middleware'
  })
})
