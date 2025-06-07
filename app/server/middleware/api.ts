import { defineEventHandler, createError } from 'h3'

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
    name: 'Zamek Królewski na Wawelu',
    lat: 50.0540,
    lng: 19.9355,
    category: 'historic',
    description: 'Dawna rezydencja królów Polski i symbol polskiej państwowości, położony na wzgórzu Wawelskim w Krakowie.'
  },
  {
    id: 2,
    name: 'Rynek Główny w Krakowie',
    lat: 50.0614,
    lng: 19.9372,
    category: 'urban',
    description: 'Jeden z największych średniowiecznych rynków w Europie, otoczony zabytkowymi kamienicami i kościołami, w tym Kościołem Mariackim.'
  },
  {
    id: 3,
    name: 'Kopalnia Soli "Wieliczka"',
    lat: 49.9828,
    lng: 20.0540,
    category: 'historic',
    description: 'Jedna z najstarszych kopalń soli na świecie, wpisana na listę UNESCO, z podziemnymi kaplicami i rzeźbami solnymi.'
  },
  {
    id: 4,
    name: 'Auschwitz-Birkenau',
    lat: 50.0278,
    lng: 19.2039,
    category: 'historic',
    description: 'Miejsce Pamięci i Muzeum Auschwitz-Birkenau, były niemiecki nazistowski obóz koncentracyjny i zagłady.'
  },
  {
    id: 5,
    name: 'Pałac Kultury i Nauki',
    lat: 52.2319,
    lng: 21.0067,
    category: 'landmark',
    description: 'Najwyższy budynek w Polsce, symbol Warszawy, oferujący taras widokowy i mieszczący teatry, muzea i kina.'
  },
  {
    id: 6,
    name: 'Stare Miasto w Warszawie',
    lat: 52.2497,
    lng: 21.0122,
    category: 'historic',
    description: 'Zrekonstruowane po II wojnie światowej historyczne centrum Warszawy, wpisane na listę UNESCO.'
  },
  {
    id: 7,
    name: 'Muzeum Powstania Warszawskiego',
    lat: 52.2328,
    lng: 20.9810,
    category: 'museum',
    description: 'Nowoczesne muzeum poświęcone Powstaniu Warszawskiemu z 1944 roku.'
  },
  {
    id: 8,
    name: 'Zamek w Malborku',
    lat: 54.0396,
    lng: 19.0280,
    category: 'historic',
    description: 'Największy zamek ceglany na świecie, dawna siedziba wielkich mistrzów zakonu krzyżackiego, wpisany na listę UNESCO.'
  },
  {
    id: 9,
    name: 'Stare Miasto w Gdańsku',
    lat: 54.3480,
    lng: 18.6530,
    category: 'historic',
    description: 'Historyczne centrum Gdańska z Długim Targiem, Fontanną Neptuna i Żurawiem.'
  },
  {
    id: 10,
    name: 'Molo w Sopocie',
    lat: 54.4465,
    lng: 18.5799,
    category: 'landmark',
    description: 'Najdłuższe drewniane molo w Europie, popularne miejsce spacerowe i rekreacyjne.'
  },
  {
    id: 11,
    name: 'Hala Stulecia we Wrocławiu',
    lat: 51.1068,
    lng: 17.0772,
    category: 'architecture',
    description: 'Modernistyczna hala widowiskowo-sportowa, wpisana na listę UNESCO, otoczona Pergolą i Fontanną Multimedialną.'
  },
  {
    id: 12,
    name: 'Rynek we Wrocławiu',
    lat: 51.1099,
    lng: 17.0324,
    category: 'urban',
    description: 'Jeden z największych rynków w Polsce, z charakterystycznymi krasnalami i zabytkowym Ratuszem.'
  },
  {
    id: 13,
    name: 'Panorama Racławicka',
    lat: 51.1100,
    lng: 17.0450,
    category: 'museum',
    description: ' monumentalne malowidło przedstawiające bitwę pod Racławicami, eksponowane w specjalnie zbudowanej rotundzie.'
  },
  {
    id: 14,
    name: 'Tatrzański Park Narodowy',
    lat: 49.2500,
    lng: 19.9833,
    category: 'nature',
    description: 'Park narodowy obejmujący polską część Tatr, najwyższych gór między Alpami a Kaukazem, z Morskim Okiem i Doliną Kościeliską.'
  },
  {
    id: 15,
    name: 'Krupówki w Zakopanem',
    lat: 49.2940,
    lng: 19.9530,
    category: 'urban',
    description: 'Reprezentacyjna ulica Zakopanego, pełna restauracji, sklepów i regionalnych straganów.'
  },
  {
    id: 16,
    name: 'Puszcza Białowieska',
    lat: 52.7550,
    lng: 23.8310,
    category: 'nature',
    description: 'Ostatni fragment pierwotnego lasu nizinnego w Europie, dom dla największej populacji żubra europejskiego, wpisana na listę UNESCO.'
  },
  {
    id: 17,
    name: 'Zamek Książ',
    lat: 50.8425,
    lng: 16.2919,
    category: 'historic',
    description: 'Trzeci co do wielkości zamek w Polsce, położony na skalnym cyplu, z bogatą historią i tajemniczymi podziemiami.'
  },
  {
    id: 18,
    name: 'Stare Miasto w Toruniu',
    lat: 53.0100,
    lng: 18.6040,
    category: 'historic',
    description: 'Średniowieczny zespół miejski, miejsce narodzin Mikołaja Kopernika, słynący z pierników i gotyckiej architektury, wpisany na listę UNESCO.'
  },
  {
    id: 19,
    name: 'Kanał Elbląski',
    lat: 53.9000,
    lng: 19.6667,
    category: 'engineering',
    description: 'Unikalny w skali światowej system pochylni, pozwalający statkom pokonywać różnice poziomów wody na lądzie.'
  },
  {
    id: 20,
    name: 'Słowiński Park Narodowy',
    lat: 54.7500,
    lng: 17.3333,
    category: 'nature',
    description: 'Park narodowy z ruchomymi wydmami, jeziorami przymorskimi i unikalną florą i fauną.'
  },
  {
    id: 21,
    name: 'Zamek Czocha',
    lat: 51.0289,
    lng: 15.3039,
    category: 'historic',
    description: 'Malowniczo położony zamek nad Jeziorem Leśniańskim, często wykorzystywany jako plan filmowy.'
  },
  {
    id: 22,
    name: 'Błędne Skały',
    lat: 50.4780,
    lng: 16.3000,
    category: 'nature',
    description: 'Labirynt skalny w Górach Stołowych, tworzący niezwykłe formacje i wąskie przejścia.'
  },
  {
    id: 23,
    name: 'Bazylika Mariacka w Gdańsku',
    lat: 54.3498,
    lng: 18.6536,
    category: 'architecture',
    description: 'Jeden z największych ceglanych kościołów na świecie, dominujący nad panoramą Gdańska.'
  },
  {
    id: 24,
    name: 'Łazienki Królewskie w Warszawie',
    lat: 52.2128,
    lng: 21.0322,
    category: 'park',
    description: 'Zespół pałacowo-ogrodowy z Pałacem na Wyspie, Amfiteatrem i pomnikiem Chopina, popularne miejsce spacerów.'
  },
  {
    id: 25,
    name: 'Ojcowski Park Narodowy',
    lat: 50.2050,
    lng: 19.8250,
    category: 'nature',
    description: 'Najmniejszy park narodowy w Polsce, znany z malowniczych dolin, jaskiń i ostańców skalnych, w tym Maczugi Herkulesa.'
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

