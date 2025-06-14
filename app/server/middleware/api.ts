import { defineEventHandler, createError, getRequestURL, readBody } from 'h3'

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

  // Handle OpenTripPlanner proxy
  else if (pathname === '/api/otp/plan') {
    try {
      const body = await readBody(event);
      console.log('[OTP Proxy] Forwarding request to OTP server with body:', body);

      try {
        // Przekształcenie ciała JSON na parametry URL
        const params = new URLSearchParams();

        // Dodawanie parametrów z body do URL
        for (const [key, value] of Object.entries(body)) {
          // Jeśli wartość jest tablicą, dodaj ją jako łańcuch znaków rozdzielony znakiem |
          if (Array.isArray(value)) {
            params.append(key, value.join('|'));
          } else if (value !== undefined && value !== null) {
            params.append(key, String(value));
          }
        }

        // Dodaj domyślną wartość arriveBy jeśli nie została określona
        if (!body.hasOwnProperty('arriveBy')) {
          params.append('arriveBy', 'false');
        }

        const url = `http://localhost:2137/otp/plan?${params}`;
        console.log('[OTP Proxy] Sending GET request to:', url);

        const response = await fetch(url, {
          method: 'GET'
        });

        console.log('[OTP Proxy] Response status:', response.status, response.statusText);

        // Zawsze próbujemy pobrać ciało odpowiedzi, nawet przy błędach
        let responseBody;
        try {
          const textResponse = await response.text();
          console.log('[OTP Proxy] Raw response body:', textResponse);
          try {
            responseBody = JSON.parse(textResponse);
            console.log('[OTP Proxy] Parsed JSON response:', responseBody);
          } catch (jsonError) {
            console.log('[OTP Proxy] Response is not valid JSON');
            responseBody = { text: textResponse };
          }
        } catch (bodyError) {
          console.error('[OTP Proxy] Failed to read response body:', bodyError);
          responseBody = null;
        }

        if (!response.ok) {
          console.error(`[OTP Proxy] Error from OTP server: ${response.status} ${response.statusText}`);
          // Zwracamy błąd, ale w taki sposób, że front-end będzie wiedział, że ma użyć fallbacku
          return {
            error: true,
            statusCode: response.status,
            statusMessage: response.statusText,
            responseBody,
            useClientFallback: true
          };
        }

        console.log('[OTP Proxy] Successfully received response from OTP server');
        return responseBody || { error: true, message: 'Empty response from OTP server', useClientFallback: true };
      } catch (fetchError) {
        console.error('[OTP Proxy] Fetch error:', fetchError);
        // W przypadku błędu sieci (np. serwer OTP niedostępny) również używamy fallbacku
        return {
          error: true,
          statusCode: 503,
          statusMessage: 'OTP server unavailable',
          useClientFallback: true
        };
      }
    } catch (error: any) {
      console.error('[OTP Proxy] Error:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error while proxying to OTP'
      });
    }
  }
  // Handle Auth Register
  else if (pathname === '/api/Auth/register' && event.method === 'POST') {
    try {
      const body = await readBody(event);
      const response = await fetch('http://localhost:5252/api/Auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          statusMessage: data?.message || 'Registration failed',
          data
        });
      }
      return data;
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error during registration'
      });
    }
  }
  // Handle Auth Login
  else if (pathname === '/api/Auth/login' && event.method === 'POST') {
    try {
      const body = await readBody(event);
      const response = await fetch('http://localhost:5252/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        throw createError({
          statusCode: response.status,
          statusMessage: data?.message || 'Login failed',
          data
        });
      }
      return data;
    } catch (error: any) {
      if (error.statusCode) throw error;
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal Server Error during login'
      });
    }
  }
  // Handle Routes (Trip) API
  else if (pathname === '/api/Routes' && event.method === 'GET') {
    // Pobierz wszystkie trasy użytkownika
    const token = event.headers.get('authorization');
    try {
      const response = await fetch('http://localhost:5252/api/Routes', {
        method: 'GET',
        headers: { 'Authorization': token || '' }
      });

      // Sprawdź, czy odpowiedź jest pusta (204) lub wymaga bezpiecznego parsowania
      if (response.status === 204) {
        return []; // Zwróć pustą tablicę dla odpowiedzi 204 No Content
      }

      // Sprawdź, czy odpowiedź ma treść przed parsowaniem JSON
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.log('Empty response from /api/Routes');
        return []; // Zwróć pustą tablicę dla pustej odpowiedzi
      }

      try {
        const rawData: any[] = JSON.parse(text);
        if (!response.ok) {
          const message = rawData?.message || 'Failed to fetch routes';
          throw createError({ statusCode: response.status, statusMessage: message, data: rawData });
        }
        // Convert PascalCase properties to camelCase for frontend
        const camelData = rawData.map(r => ({
          id: r.id ?? r.Id,
          name: r.name ?? r.Name,
          notes: r.notes ?? r.Notes,
          createdAt: r.createdAt ?? r.CreatedAt,
          updatedAt: r.updatedAt ?? r.UpdatedAt,
          // Normalize routePoints
          routePoints: (r.routePoints ?? r.RoutePoints ?? []).map((rp: any) => ({
            placeId: rp.placeId ?? rp.PlaceId,
            order: rp.order ?? rp.Order,
            placeName: rp.placeName ?? rp.PlaceName
          }))
        }));
        return camelData;
      } catch (jsonError) {
        console.error('Error parsing JSON response from /api/Routes:', jsonError);
        console.error('Response text:', text);
        // Jeśli nie można sparsować JSON, zwróć pustą tablicę
        if (response.ok) {
          return [];
        }
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to parse response from backend',
          data: { responseText: text }
        });
      }
    } catch (error) {
      console.error('Network error fetching routes:', error);
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch routes from backend',
        data: { error: error.message }
      });
    }
  }
  else if (pathname === '/api/Routes' && event.method === 'POST') {
    // Utwórz nową trasę
    const token = event.headers.get('authorization');
    const body = await readBody(event);
    const response = await fetch('http://localhost:5252/api/Routes', {
      method: 'POST',
      headers: {
        'Authorization': token || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) {
      throw createError({ statusCode: response.status, statusMessage: data?.message || 'Failed to create route', data });
    }
    return data;
  }
  else if (pathname.startsWith('/api/Routes/') && pathname.split('/').length === 4) {
    const id = pathname.split('/')[3];
    const token = event.headers.get('authorization');
    if (event.method === 'GET') {
      const response = await fetch(`http://localhost:5252/api/Routes/${id}`, {
        method: 'GET',
        headers: { 'Authorization': token || '' }
      });
      const raw: any = await response.json();
      if (!response.ok) {
        const message = raw?.message || 'Failed to fetch route';
        throw createError({ statusCode: response.status, statusMessage: message, data: raw });
      }
      // Convert PascalCase to camelCase for frontend
      const camel = {
        id: raw.id ?? raw.Id,
        name: raw.name ?? raw.Name,
        notes: raw.notes ?? raw.Notes,
        createdAt: raw.createdAt ?? raw.CreatedAt,
        updatedAt: raw.updatedAt ?? raw.UpdatedAt,
        routePoints: (raw.routePoints ?? raw.RoutePoints ?? []).map((rp: any) => ({
          placeId: rp.placeId ?? rp.PlaceId,
          order: rp.order ?? rp.Order,
          placeName: rp.placeName ?? rp.PlaceName
        }))
      };
      return camel;
    } else if (event.method === 'PUT') {
      const body = await readBody(event);
      const response = await fetch(`http://localhost:5252/api/Routes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        let data;
        try { data = await response.json(); } catch { data = {}; }
        throw createError({ statusCode: response.status, statusMessage: data?.message || 'Failed to update route', data });
      }
      return { success: true };
    } else if (event.method === 'DELETE') {
      const response = await fetch(`http://localhost:5252/api/Routes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token || '' }
      });
      if (!response.ok) {
        let data;
        try { data = await response.json(); } catch { data = {}; }
        throw createError({ statusCode: response.status, statusMessage: data?.message || 'Failed to delete route', data });
      }
      return { success: true };
    }
  }

  console.warn(`[API Middleware] Pathname ${pathname} not handled by any route.`);
  throw createError({
    statusCode: 404,
    statusMessage: 'API endpoint not found in middleware'
  })
})
