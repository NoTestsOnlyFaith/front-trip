import { defineEventHandler, createError } from 'h3'
import type { IncomingMessage, ServerResponse } from 'http'

// Define the Place type
interface Place {
  id: number
  name: string
  lat: number
  lng: number
  category: string
  description: string // Added description field
}

// Mock data for places
const places: Place[] = [
  { 
    id: 1, 
    name: 'Eiffel Tower', 
    lat: 48.8584, 
    lng: 2.2945, 
    category: 'landmark',
    description: 'Iconic iron tower built in 1889 that defines the Paris skyline. Standing at 330 meters tall, it offers breathtaking views of the city from its observation decks.'
  },
  { 
    id: 2, 
    name: 'Colosseum', 
    lat: 41.8902, 
    lng: 12.4922, 
    category: 'historic',
    description: 'Ancient Roman amphitheater completed in AD 80, once used for gladiatorial contests and public spectacles. It remains one of the greatest works of Roman architecture and engineering.'
  },
  { 
    id: 3, 
    name: 'Grand Canyon', 
    lat: 36.1069, 
    lng: -112.1129, 
    category: 'nature',
    description: 'Steep-sided canyon carved by the Colorado River in Arizona. With its layered bands of red rock revealing millions of years of geological history, it\'s one of the most spectacular natural wonders of the world.'
  },
  { 
    id: 4, 
    name: 'Times Square', 
    lat: 40.7580, 
    lng: -73.9855, 
    category: 'urban',
    description: 'Iconic commercial intersection in Midtown Manhattan, characterized by bright digital billboards, Broadway theaters, and constant crowds. Often called "The Crossroads of the World" and "The Center of the Universe".'
  },
  { 
    id: 5, 
    name: 'Sydney Opera House', 
    lat: 33.8568, 
    lng: 151.2153, 
    category: 'architecture',
    description: 'Multi-venue performing arts center recognized by its distinctive sail-shaped shells. Completed in 1973, it\'s one of the 20th century\'s most famous and distinctive buildings, and a UNESCO World Heritage Site.'
  }
]

export default defineEventHandler(async (event) => {
  const url = event.node.req.url || ''
  
  // Handle GET /api/places - list all places
  if (url === '/api/places' && event.node.req.method === 'GET') {
    return places
  }

  // Handle GET /api/places/:id - get a single place
  if (url.match(/^\/api\/places\/\d+$/) && event.node.req.method === 'GET') {
    const id = parseInt(url.split('/').pop() || '0')
    const place = places.find(p => p.id === id)
    
    if (!place) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Place not found'
      })
    }
    
    return place
  }

  // If no routes match, continue to the next handler
})

