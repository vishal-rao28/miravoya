/* ==========================================================================
   TERRAVOYAGE — Extended Tourist Spots & 20 Additional Iconic Destinations
   Brings total to 45 Destinations (15 TN · 14 India · 16 World) & 200+ Spots
   ========================================================================== */

(function () {
  window.TerraVoyage = window.TerraVoyage || {};
  const list = window.TerraVoyage.DESTINATIONS || [];

  // Enrich existing destinations with additional iconic tourist spots
  const EXTRA_SPOTS = {
    'ooty-coonoor': [
      { name: 'Government Botanical Garden & Rose Garden', note: '55-acre terraced garden with 20-million-year-old fossilized tree trunk & 20,000 rose varieties.' },
      { name: 'Emerald & Avalanche Lakes', note: 'Untouched crystal-blue forest reservoirs surrounded by wild orchids and silent shola woods.' }
    ],
    kodaikanal: [
      { name: 'Berijam Lake Forest Reserve', note: 'Pristine emerald lake inside protected shola forest with silent nature trails (permit required).' },
      { name: 'Silver Cascade & Bear Shola Falls', note: '180-ft roadside waterfall welcoming visitors into Kodaikanal plus a secluded forest cascade.' }
    ],
    madurai: [
      { name: 'Koodal Azhagar & Alagar Kovil Temples', note: 'Ancient Vaishnavite hill temple surrounded by lush Alagar hills and sacred springs.' },
      { name: 'Samanar Hills (Jain Caves)', note: '2,000-year-old hill rock-cut Jain carvings and sweeping sunset panoramas over Madurai.' }
    ],
    mahabalipuram: [
      { name: 'Tiger Cave & Crocodile Bank (ECR)', note: 'Sculpted yali-bordered rock shrine on the beach plus India’s famous reptile conservation park.' },
      { name: 'Muttukadu Backwater Boating', note: 'Scenic coastal lagoon on ECR offering kayaking, windsurfing, and peaceful sunset boat rides.' }
    ],
    rameswaram: [
      { name: 'Ramar Patham (Gandhamadhana Parvatham)', note: 'Highest hilltop shrine on Rameswaram island with 360° views of sea bridges and Sri Lanka’s horizon.' },
      { name: 'Villoondi Theertham Beach', note: 'Calm turquoise bay famous for its sweet-water spring rising right inside the salty ocean.' }
    ],
    kanyakumari: [
      { name: 'Our Lady of Ransom Church', note: 'Soaring Gothic pure-white seaside cathedral glowing brilliantly against the blue Arabian Sea.' },
      { name: 'Vattakottai Sea Fort & Mathoor Aqueduct', note: '18th-century coastal granite fort and Asia’s tallest heritage water-carrying bridge.' }
    ],
    'thanjavur-chettinad': [
      { name: 'Gangaikonda Cholapuram & Darasuram', note: 'UNESCO Great Living Chola Temples showcasing exquisite stone chariots and musical steps.' },
      { name: 'Chettinad Palace (Kanadukathan)', note: 'Grand pillared heritage palace featuring Italian marble, Burmese teak, and royal courtyards.' }
    ],
    'yercaud-hogenakkal': [
      { name: 'Shevaroy Temple Peak', note: 'Highest point in Yercaud (5,326 ft) featuring an ancient cave shrine and misty valley views.' },
      { name: 'Botanical Survey Orchidarium', note: 'Rare mountain orchids, pitcher plants, and cool walking pathways beneath towering silver oaks.' }
    ],
    goa: [
      { name: 'Basilica of Bom Jesus (Old Goa)', note: '16th-century UNESCO baroque church preserving historic Portuguese-era architecture.' },
      { name: 'Divar Island & Arambol Sweet Water Lake', note: 'Quiet ferry-access heritage island and a warm freshwater lagoon tucked behind golden dunes.' }
    ],
    'kerala-munnar': [
      { name: 'Mattupetty Dam & Echo Point', note: 'Misty mirror-still reservoir flanked by rolling tea hills and wild elephant corridors.' },
      { name: 'Varkala Red Cliff Beach', note: 'Dramatic red laterite ocean cliffs lined with breezy cafés and golden Arabian Sea sunsets.' }
    ],
    'jaipur-udaipur': [
      { name: 'Jal Mahal & Albert Hall Museum', note: 'Water Palace floating in Man Sagar Lake and Jaipur’s illuminated Indo-Saracenic museum.' },
      { name: 'Fateh Sagar Lake & Monsoon Palace (Udaipur)', note: 'Hilltop Sajjangarh Palace overlooking Udaipur’s interconnected lakes at dusk.' }
    ],
    'ladakh-manali': [
      { name: 'Magnetic Hill & Sangam Confluence', note: 'Optical-illusion gravity hill and the striking emerald-and-blue merger of Indus & Zanskar rivers.' },
      { name: 'Tso Moriri & Hadimba Temple (Manali)', note: 'Remote turquoise Himalayan wetland plus ancient cedar-forest pagoda temple in Manali.' }
    ],
    'varanasi-rishikesh': [
      { name: 'Ramnagar Fort & Manikarnika Ghat', note: '18th-century sandstone riverside fort across the Ganges with vintage royal car museum.' },
      { name: 'Neer Garh Waterfall & Laxman Jhula', note: 'Multi-tiered turquoise jungle pools above Rishikesh and iconic suspension bridge views.' }
    ],
    andaman: [
      { name: 'Ross Island (Netaji Subhas Chandra Bose Dweep)', note: 'Atmospheric banyan-wrapped British ruins inhabited by friendly peacocks and spotted deer.' },
      { name: 'Baratang Limestone Caves & Kala Pathar Beach', note: 'Mangrove boat cruise to natural stalactite caves and dramatic black-rock turquoise shores.' }
    ],
    'coorg-hampi': [
      { name: 'Dubare Elephant Camp & Mandalpatti Jeep Peak', note: 'Kaveri river eco-camp and misty 4x4 cloud-level mountain ridge in Coorg.' },
      { name: 'Lotus Mahal, Queen’s Bath & Elephant Stables (Hampi)', note: 'Stunning Indo-Islamic royal pavilions amid Hampi’s UNESCO ancient empire.' }
    ],
    kyoto: [
      { name: 'Kiyomizu-dera Wooden Stage Temple', note: 'UNESCO hillside temple jutting out over cherry and maple valleys without a single nail.' },
      { name: 'Nara Deer Park Day Trip', note: '45 mins away: bow to friendly roaming sacred deer and marvel at the giant Todai-ji Buddha.' }
    ],
    santorini: [
      { name: 'Pyrgos Medieval Hilltop Village', note: 'Labyrinth of quiet blue-and-white alleys crowned by a Venetian castle with island-wide views.' },
      { name: 'Kamari & Perissa Black Volcanic Beaches', note: 'Sun-warmed obsidian pebble shores backed by towering Mesa Vouno limestone cliffs.' }
    ],
    'swiss-alps': [
      { name: 'Oeschinensee Alpine Lake (Kandersteg)', note: 'UNESCO glacier-fed turquoise lake ringed by 3,000m cliffs and alpine toboggan runs.' },
      { name: 'Lucerne Chapel Bridge & Mount Pilatus', note: '14th-century wooden covered bridge and the world’s steepest cogwheel railway.' }
    ],
    bali: [
      { name: 'Lempuyang Gate of Heaven & Tirta Gangga', note: 'Sacred mountain temple framing Mount Agung volcano plus royal stepping-stone water palace.' },
      { name: 'Seminyak Beach Clubs & Tanah Lot Sea Temple', note: 'Dramatic wave-crashed offshore temple glowing in fiery sunset silhouettes.' }
    ],
    dubai: [
      { name: 'Palm Jumeirah, The View & Dubai Frame', note: '360° aerial view of the palm-shaped archipelago plus the giant golden skyline picture frame.' },
      { name: 'Miracle Garden & Global Village', note: '150 million blooming flowers in artistic installations and 90-country cultural pavilions.' }
    ],
    thailand: [
      { name: 'Railay Beach & James Bond Island (Krabi)', note: 'Boat-only emerald peninsula famous for limestone rock climbing and bioluminescent caves.' },
      { name: 'Chiang Mai Doi Suthep & Elephant Sanctuary', note: 'Golden mountaintop temple overlooking misty northern jungles and ethical elephant parks.' }
    ],
    reykjavik: [
      { name: 'Hallgrímskirkja & Blue Lagoon', note: 'Basalt-inspired iconic church spire and milky silica-blue volcanic healing waters.' },
      { name: 'Kirkjufell Mountain (Snæfellsnes)', note: 'Arrowhead coastal mountain paired with cascading waterfalls—Iceland’s most photographed peak.' }
    ],
    seoul: [
      { name: 'Lotte World Tower & Starfield COEX Library', note: '555m sky-bridge observatory and towering floor-to-ceiling illuminated library.' },
      { name: 'DMZ Peace Tour & Nami Island', note: 'Tree-lined river island famous across K-dramas and historic Korean border lookout.' }
    ],
    paris: [
      { name: 'Palace of Versailles & Hall of Mirrors', note: 'Opulent royal chateau and sprawling geometric musical fountain gardens just outside Paris.' },
      { name: 'Arc de Triomphe, Champs-Élysées & Sainte-Chapelle', note: 'Rooftop star-avenue views and breathtaking 13th-century floor-to-ceiling stained glass.' }
    ],
    queenstown: [
      { name: 'Wanaka Tree & Roy’s Peak Hike', note: 'Solitary willow rising from mirror-still Lake Wanaka plus an unforgettable alpine ridge trek.' },
      { name: 'TSS Earnslaw Vintage Steamship & Walter Peak', note: '1912 coal-fired lake steamer cruising across Lake Wakatipu to high-country sheep farms.' }
    ]
  };

  list.forEach((d) => {
    if (EXTRA_SPOTS[d.id]) {
      d.topPlaces = [...(d.topPlaces || []), ...EXTRA_SPOTS[d.id]];
    }
  });

  // 20 NEW DESTINATIONS (7 TN + 7 India + 6 International)
  const NEW_DESTINATIONS = [
    // ---------------- MORE TAMIL NADU (7 NEW -> 15 TOTAL TN) ----------------
    {
      id: 'chennai',
      scope: 'tn',
      name: 'Chennai',
      country: 'Tamil Nadu, India',
      region: 'Tamil Nadu',
      code: 'MAA',
      icon: '🏖️',
      gradient: 'linear-gradient(135deg, #0e5a6d, #d95d39)',
      coords: '13.08° N, 80.27° E',
      mapPos: { x: 412, y: 161 },
      styles: ['City', 'Beaches', 'Heritage', 'Food'],
      rating: 4.8,
      dailyUsd: 42,
      flightUsd: 80,
      flightHours: 'Major International Hub',
      bestSeason: 'Nov–Feb',
      bestDays: '3 Days',
      weather: '29°C Coastal',
      safety: 94,
      wifiMbps: 150,
      visa: 'Domestic / India e-Visa',
      highlight: 'Marina Beach, Kapaleeshwarar Temple, Mylapore & DakshinaChitra',
      description: 'Cultural gateway of South India blending the world’s second-longest urban beach, Carnatic music sabhas, heritage temples, and iconic filter coffee.',
      topPlaces: [
        { name: 'Marina Beach & Lighthouse', note: '13-km golden Bay of Bengal promenade buzzing with sunrise joggers, sundal stalls, and lighthouse views.' },
        { name: 'Kapaleeshwarar Temple (Mylapore)', note: 'Vibrant 7th-century Dravidian temple tank surrounded by silk shops and historic filter-coffee houses.' },
        { name: 'Fort St. George & Government Museum (Egmore)', note: '1644 coastal fortress museum and Asia’s finest Chola bronze sculpture gallery.' },
        { name: 'Besant Nagar (Elliot’s Beach) & Broken Bridge', note: 'Breezy café-lined coastline famous for evening walks and artisan ice-cream spots.' },
        { name: 'DakshinaChitra Living Heritage Museum (ECR)', note: '18 authentic reconstructed traditional homes from Tamil Nadu, Kerala, Karnataka & Andhra.' },
        { name: 'Santhome Cathedral & Semmozhi Poonga', note: 'Pure-white neo-Gothic seaside basilica and lush botanical park in the heart of the city.' }
      ],
      localFood: ['Mylapore Mini Tiffin & Filter Coffee', 'Marina Sundal & Bajji', 'Chettinad Meals & Biryani', 'Murugan Idli Podi Dosa'],
      howToReach: 'Chennai International Airport (MAA), Chennai Central & Egmore Railway Stations, and fast Chennai Metro Rail.',
      proTip: 'Take a morning heritage walk around Mylapore tank at 6:30 AM followed by hot pongal and brass-tumbler filter coffee at Rayar’s Mess or Ratna Café.',
      roadmap: [
        { day: 1, time: '06:00', title: 'Marina Beach Sunrise, Santhome Basilica & Mylapore Temple Walk', category: 'Culture', cost: 10, done: false },
        { day: 1, time: '16:30', title: 'Egmore Bronze Museum & Besant Nagar Beach Cafés', category: 'Food', cost: 18, done: false },
        { day: 2, time: '10:00', title: 'ECR Drive: DakshinaChitra Heritage Village & Muttukadu Boating', category: 'Explore', cost: 24, done: false }
      ]
    },
    {
      id: 'pondicherry',
      scope: 'tn',
      name: 'Pondicherry (Puducherry)',
      country: 'Tamil Nadu Coast, India',
      region: 'Tamil Nadu',
      code: 'PNY',
      icon: '🥐',
      gradient: 'linear-gradient(135deg, #eab308, #0284c7)',
      coords: '11.94° N, 79.80° E',
      mapPos: { x: 411, y: 164 },
      styles: ['Beaches', 'Heritage', 'Food', 'City'],
      rating: 4.9,
      dailyUsd: 45,
      flightUsd: 95,
      flightHours: '2h 45m drive from Chennai',
      bestSeason: 'Oct–Mar',
      bestDays: '3 Days',
      weather: '28°C Breezy',
      safety: 95,
      wifiMbps: 95,
      visa: 'Domestic / India e-Visa',
      highlight: 'White Town French Quarter, Auroville Matrimandir & Rock Beach',
      description: 'Mustard-yellow colonial French villas draped in bougainvillea, artisanal bakeries, tranquil beaches, and Auroville’s golden dome.',
      topPlaces: [
        { name: 'White Town (French Quarter)', note: 'Cobblestone tree-lined streets bursting with ochre heritage mansions, boutiques, and sunlit cafés.' },
        { name: 'Promenade (Rock) Beach', note: 'Vehicle-free oceanfront walkway ideal for breezy twilight strolls and sunrise coffee.' },
        { name: 'Auroville & Golden Matrimandir', note: 'Experimental international township centered around a geodesic gold-disc meditation sphere.' },
        { name: 'Paradise Beach & Chunnambar Backwaters', note: 'Short ferry across mangroves to a pristine golden sand island beach.' },
        { name: 'Sri Aurobindo Ashram & Manakula Vinayagar Temple', note: 'Peaceful courtyard ashram alongside a colorful 500-year-old heritage Ganesha temple.' },
        { name: 'Serenity Beach & Pichavaram Mangroves (Day Trip)', note: 'Surfing cove plus the world’s second-largest emerald mangrove forest canals.' }
      ],
      localFood: ['Warm French Croissants & Wood-Fired Pizza', 'Creole Prawn Curry', 'Artisan Gelato on Promenade', 'South Indian Filter Coffee'],
      howToReach: '150 km south of Chennai along the scenic East Coast Road (ECR) via express buses, trains, or self-drive.',
      proTip: 'Rent a bicycle or scooter in White Town at 7:00 AM to photograph the quiet yellow villas before noon heat, and book Auroville Matrimandir viewing online 2 days ahead.',
      roadmap: [
        { day: 1, time: '08:00', title: 'Cycle White Town French Streets, Ashram & Croissant Breakfast', category: 'Culture', cost: 16, done: false },
        { day: 1, time: '17:00', title: 'Rock Beach Sunset Promenade & Courtyard French-Tamil Dinner', category: 'Food', cost: 24, done: false },
        { day: 2, time: '09:00', title: 'Auroville Matrimandir Visit, Auroville Bakery & Serenity Beach', category: 'Explore', cost: 20, done: false }
      ]
    },
    {
      id: 'valparai-pollachi',
      scope: 'tn',
      name: 'Valparai & Pollachi',
      country: 'Tamil Nadu, India',
      region: 'Tamil Nadu',
      code: 'CJB',
      icon: '🐘',
      gradient: 'linear-gradient(135deg, #166534, #0d9488)',
      coords: '10.32° N, 76.95° E',
      mapPos: { x: 404, y: 168 },
      styles: ['Hills', 'Adventure'],
      rating: 4.9,
      dailyUsd: 38,
      flightUsd: 105,
      flightHours: '2h 30m from Coimbatore',
      bestSeason: 'Sep–May',
      bestDays: '3 Days',
      weather: '19°C Rainforest',
      safety: 95,
      wifiMbps: 55,
      visa: 'Domestic (No Visa for India)',
      highlight: '40 Hairpin Bends, Aliyar Dam, Nallamudi Viewpoint & Topslip Safari',
      description: 'Untouched misty rainforest plateau famous for 40 scenic hairpin bends, lion-tailed macaques, emerald tea hills, and coconut-lined Pollachi.',
      topPlaces: [
        { name: '40 Hairpin Bends & Loam’s Viewpoint', note: 'Thrilling ghat ascent offering jaw-dropping aerial views of Aliyar Dam and Nilgiri Tahr sightings.' },
        { name: 'Nallamudi Poonjolai Viewpoint', note: 'Walk through emerald tea gardens to a dramatic valley ledge overlooking Anamudi peak.' },
        { name: 'Sholayar Dam & Nirar Dam', note: 'Mirror-calm rainforest reservoirs surrounded by misty mountain ridges and waterfalls.' },
        { name: 'Aliyar Dam & Monkey Falls', note: 'Foothill reservoir park and refreshing natural rock cascade along the Valparai road.' },
        { name: 'Topslip (Anamalai Tiger Reserve)', note: 'Guided forest van safaris through bamboo groves home to elephants, gaurs, and hornbills.' },
        { name: 'Balaji Temple & Koolangal River', note: 'Tranquil hilltop estate temple and crystal-clear pebble stream.' }
      ],
      localFood: ['Pollachi Tender Coconut & Elaneer Payasam', 'Kongunadu Chicken Pallipalayam', 'Arisi Paruppu Sadam', 'Fresh Estate Tea'],
      howToReach: '105 km from Coimbatore Airport (CJB) via Pollachi’s palm-lined highways; stay inside a working tea bungalow.',
      proTip: 'Drive slowly along the 40 hairpin bends around sunrise or late afternoon—Nilgiri Tahrs and giant Malabar squirrels frequently appear right along the rock ledges.',
      roadmap: [
        { day: 1, time: '08:00', title: 'Pollachi Coconut Groves, Aliyar Dam & 40-Hairpin Ascent to Valparai', category: 'Adventure', cost: 22, done: false },
        { day: 2, time: '07:30', title: 'Nallamudi Viewpoint, Sholayar Dam & Tea Estate Trail', category: 'Explore', cost: 18, done: false }
      ]
    },
    {
      id: 'coimbatore-isha',
      scope: 'tn',
      name: 'Coimbatore & Adiyogi',
      country: 'Tamil Nadu, India',
      region: 'Tamil Nadu',
      code: 'CJB',
      icon: '🕉️',
      gradient: 'linear-gradient(135deg, #1e293b, #0e7490)',
      coords: '11.01° N, 76.95° E',
      mapPos: { x: 405, y: 166 },
      styles: ['Heritage', 'Hills', 'City', 'Food'],
      rating: 4.8,
      dailyUsd: 35,
      flightUsd: 90,
      flightHours: '1h (from Chennai/Bengaluru)',
      bestSeason: 'Sep–Mar',
      bestDays: '2–3 Days',
      weather: '25°C Foothill Breeze',
      safety: 96,
      wifiMbps: 130,
      visa: 'Domestic (No Visa for India)',
      highlight: '112-ft Adiyogi Shiva Statue, Marudhamalai, Siruvani Falls & Gedee Museum',
      description: 'Clean, breezy Western Ghats gateway home to the colossal Adiyogi statue beneath Velliangiri hills and iconic Kongunadu cuisine.',
      topPlaces: [
        { name: '112-ft Adiyogi Shiva & Dhyanalinga (Isha)', note: 'Guinness-record steel bust nestled at Velliangiri foothills with an electrifying evening light & sound show.' },
        { name: 'Marudhamalai Hill Murugan Temple', note: '12th-century hilltop temple framed by misty Western Ghats slopes.' },
        { name: 'Siruvani Waterfalls & Dam', note: 'Forest trek to one of India’s sweetest-tasting mountain reservoirs and cool jungle falls.' },
        { name: 'Gedee Car Museum', note: 'World-class private collection of 100+ rare vintage classic cars from Germany, UK, USA & India.' },
        { name: 'Kovai Kutralam Waterfalls', note: 'Refreshing seasonal forest cascade inside Siruvani foothills.' },
        { name: 'Perur Pateeswarar Temple & Brookefields', note: 'Ancient Chola sculpted pillars paired with vibrant local shopping and cafés.' }
      ],
      localFood: ['Annapoorna Ghee Roast & Sambar', 'Kongu Mutton Biryani', 'Kalan (Roadside Mushroom Masala)', 'Fresh Siruvani Filter Coffee'],
      howToReach: 'Coimbatore International Airport (CJB) and Coimbatore Junction (CBE) connect directly across India & Singapore/Sharjah.',
      proTip: 'Reach Adiyogi by 4:30 PM to experience Dhyanalinga meditation in silence, watch sunset over Velliangiri peaks, and stay for the 7:00 PM Divya Darshanam laser show.',
      roadmap: [
        { day: 1, time: '08:00', title: 'Marudhamalai Hill Temple, Annapoorna Tiffin & Gedee Vintage Car Museum', category: 'Culture', cost: 16, done: false },
        { day: 1, time: '16:30', title: 'Velliangiri Foothills: Dhyanalinga & Adiyogi Night Laser Show', category: 'Explore', cost: 12, done: false }
      ]
    },
    {
      id: 'tiruvannamalai',
      scope: 'tn',
      name: 'Tiruvannamalai & Gingee',
      country: 'Tamil Nadu, India',
      region: 'Tamil Nadu',
      code: 'MAA',
      icon: '🔥',
      gradient: 'linear-gradient(135deg, #9a3412, #d97706)',
      coords: '12.22° N, 79.07° E',
      mapPos: { x: 409, y: 163 },
      styles: ['Heritage', 'Hills', 'Adventure'],
      rating: 4.9,
      dailyUsd: 28,
      flightUsd: 88,
      flightHours: '3h 30m drive from Chennai',
      bestSeason: 'Oct–Mar',
      bestDays: '2 Days',
      weather: '27°C Sacred Hills',
      safety: 95,
      wifiMbps: 70,
      visa: 'Domestic (No Visa for India)',
      highlight: 'Arunachaleswarar Temple, Girivalam Hill, Ramana Ashram & Gingee Fort',
      description: 'Mystical volcanic sacred hill crowned by one of India’s grandest temple complexes, tranquil ashrams, and the dramatic three-hill Gingee fortress.',
      topPlaces: [
        { name: 'Arunachaleswarar (Annamalaiyar) Temple', note: 'Sprawling 25-acre Chola-Vijayanagara fire-element shrine with towering 217-ft Rajagopuram.' },
        { name: '14-km Girivalam Sacred Hill Circumambulation', note: 'Peaceful tree-lined path circling Mount Arunachala dotted with 8 ancient Ashtalingam shrines.' },
        { name: 'Sri Ramana Maharshi Ashram & Skandashram', note: 'Serene peacock-filled ashram and hillside meditation caves overlooking the temple towers.' },
        { name: 'Gingee Fort (Troy of the East)', note: 'Breathtaking 13th-century citadel spanning three steep granite peaks 38 km away.' },
        { name: 'Virupaksha Cave Trail', note: 'Scenic rocky hill climb to the ancient Om-shaped meditation cave.' },
        { name: 'Sathanur Dam & Gardens', note: 'Picturesque Pennaiyar River dam surrounded by lush hillocks and crocodile park.' }
      ],
      localFood: ['Traditional Temple Pongal & Puliyodarai', 'Organic Ashram-Road Cafés', 'Crisp Medu Vada & Sambar', 'Tiruvannamalai Sweet Adhirasam'],
      howToReach: '190 km from Chennai & 200 km from Bengaluru via smooth NH highways and frequent state express buses.',
      proTip: 'Climb up to Skandashram early at 6:30 AM for an unforgettable sunrise view straight down onto the massive temple towers.',
      roadmap: [
        { day: 1, time: '06:00', title: 'Arunachaleswarar Temple Darshan, Ramana Ashram & Skandashram Cave Walk', category: 'Culture', cost: 10, done: false },
        { day: 2, time: '07:30', title: 'Gingee Hill Fort Climb (Rajagiri Citadel) & Sathanur Dam', category: 'Adventure', cost: 16, done: false }
      ]
    },
    {
      id: 'courtallam-meghamalai',
      scope: 'tn',
      name: 'Courtallam & Meghamalai',
      country: 'Tamil Nadu, India',
      region: 'Tamil Nadu',
      code: 'IXM',
      icon: '💧',
      gradient: 'linear-gradient(135deg, #047857, #0369a1)',
      coords: '8.93° N, 77.27° E',
      mapPos: { x: 405, y: 173 },
      styles: ['Hills', 'Adventure'],
      rating: 4.8,
      dailyUsd: 30,
      flightUsd: 105,
      flightHours: '2h 30m from Madurai',
      bestSeason: 'Jun–Jan (Falls Peak Jun–Sep)',
      bestDays: '3 Days',
      weather: '22°C Misty Shower',
      safety: 94,
      wifiMbps: 50,
      visa: 'Domestic (No Visa for India)',
      highlight: 'Courtallam Herbal Waterfalls, Five Falls & Meghamalai Cloud Hills',
      description: 'Spa of South India famous for herbal Western Ghats waterfalls paired with Meghamalai’s untouched High Wavy cloud-forest tea ridges.',
      topPlaces: [
        { name: 'Courtallam Main Falls & Five Falls', note: 'Invigorating herbal-mineral waterfalls cascading through lush Podhigai mountains.' },
        { name: 'Old Courtallam & Tiger Falls', note: 'Quieter natural rock cascades nestled inside cool forest groves.' },
        { name: 'Meghamalai (Highwavys) Tea & Cloud Estates', note: 'Offbeat misty mountain sanctuary dotted with turquoise dams and whistling thrushes.' },
        { name: 'Suruli Waterfalls (Theni)', note: 'Two-stage 150-ft forest waterfall beside ancient rock-cut Kailasanathar caves.' },
        { name: 'Palaruvi & Tenkasi Kasi Viswanathar Temple', note: 'Towering stone temple spire in Tenkasi and scenic border waterfall trails.' },
        { name: 'Manalar & Venniyar Dam Viewpoints', note: 'Breathtaking mist-draped valley ridges overlooking Cumbum grape farms.' }
      ],
      localFood: ['Courtallam Border Parotta & Kozhi Salna', 'Tenkasi Tirunelveli Iruttu Kadai Halwa', 'Fresh Cumbum Black Grapes', 'Hot Pepper Rasam'],
      howToReach: 'Tenkasi Railway Station (TSI) is 5 km from Courtallam; Madurai Airport (IXM) is the closest hub for Meghamalai & Theni.',
      proTip: 'Visit Courtallam during the Southwest Monsoon (July–August) for the famous cool "Saaral" mist drizzle, and never miss Tenkasi Border Parotta!',
      roadmap: [
        { day: 1, time: '07:00', title: 'Main Falls & Five Falls Herbal Bath + Border Parotta Feast', category: 'Adventure', cost: 14, done: false },
        { day: 2, time: '08:00', title: 'Drive up to Meghamalai Highwavys Dams, Tea Estates & Suruli Falls', category: 'Explore', cost: 22, done: false }
      ]
    },
    {
      id: 'kolli-trichy',
      scope: 'tn',
      name: 'Kolli Hills & Trichy',
      country: 'Tamil Nadu, India',
      region: 'Tamil Nadu',
      code: 'TRZ',
      icon: '⛰️',
      gradient: 'linear-gradient(135deg, #15803d, #92400e)',
      coords: '11.24° N, 78.33° E',
      mapPos: { x: 408, y: 165 },
      styles: ['Hills', 'Heritage', 'Adventure'],
      rating: 4.8,
      dailyUsd: 30,
      flightUsd: 90,
      flightHours: 'Direct Airport at Trichy (TRZ)',
      bestSeason: 'Sep–Mar',
      bestDays: '2–3 Days',
      weather: '24°C Hills & River',
      safety: 95,
      wifiMbps: 70,
      visa: 'Domestic (No Visa for India)',
      highlight: '70 Hairpin Bends, Agaya Gangai Falls, Srirangam & Rockfort Temple',
      description: 'Thrilling 70-hairpin biker’s paradise leading to a 300-ft canyon waterfall, paired with Trichy’s colossal island temple and 2,000-year-old dam.',
      topPlaces: [
        { name: 'Kolli Hills 70 Hairpin Bends', note: 'India’s most legendary winding ghat drive climbing through dense spice and medicinal forests.' },
        { name: 'Agaya Gangai Waterfalls', note: 'Dramatic 300-ft rainforest cascade reached via 1,000 scenic stone steps near Arapaleeswarar Temple.' },
        { name: 'Srirangam Sri Ranganathaswamy Temple', note: 'World’s largest functioning temple complex spanning 156 acres and 21 towering gopurams.' },
        { name: 'Rockfort Ucchi Pillayar Temple (Trichy)', note: 'Ancient fortress temple perched atop an 83m monolith with sweeping Kaveri River sunset views.' },
        { name: 'Kallanai (Grand Anicut Dam)', note: 'Built by Karikala Chola ~2,000 years ago—one of the world’s oldest still-working irrigation dams.' },
        { name: 'Seekuparai Viewpoint & Masila Falls', note: 'Quiet valley sunset ridge and family-friendly natural falls in Kolli Hills.' }
      ],
      localFood: ['Kolli Hills Wild Honey, Pepper & Jackfruit', 'Trichy Banana-Leaf Meals', 'Manapparai Murukku', 'Hot Jaggery Paniyaram'],
      howToReach: 'Fly directly into Tiruchirappalli International Airport (TRZ); Kolli Hills is a scenic 2.5-hour drive northwest via Namakkal.',
      proTip: 'Carry good grip sneakers and water for the 1,000-step descent to Agaya Gangai Falls, and climb Trichy Rockfort around 5:00 PM for golden twilight views.',
      roadmap: [
        { day: 1, time: '07:30', title: 'Srirangam Island Temple, Kallanai Ancient Dam & Rockfort Sunset', category: 'Culture', cost: 12, done: false },
        { day: 2, time: '07:00', title: 'Climb 70 Hairpin Bends to Kolli Hills & Agaya Gangai Waterfall Trek', category: 'Adventure', cost: 20, done: false }
      ]
    },

    // ---------------- MORE INDIA (7 NEW -> 14 TOTAL INDIA) ----------------
    {
      id: 'agra-delhi',
      scope: 'india',
      name: 'Agra & New Delhi',
      country: 'North India',
      region: 'India',
      code: 'DEL',
      icon: '🕌',
      gradient: 'linear-gradient(135deg, #be123c, #d97706)',
      coords: '27.17° N, 78.04° E',
      mapPos: { x: 403, y: 136 },
      styles: ['Heritage', 'City', 'Food'],
      rating: 4.9,
      dailyUsd: 56,
      flightUsd: 135,
      flightHours: '2h 45m (from Chennai)',
      bestSeason: 'Oct–Mar',
      bestDays: '4 Days',
      weather: '21°C Crisp',
      safety: 86,
      wifiMbps: 140,
      visa: 'Domestic / India e-Visa',
      highlight: 'Taj Mahal Sunrise, Red Fort, Qutub Minar, India Gate & Chandni Chowk',
      description: 'India’s iconic Mughal & capital heritage corridor uniting the ivory-marble Taj Mahal with Delhi’s monuments and legendary street food.',
      topPlaces: [
        { name: 'Taj Mahal (Sunrise Entry)', note: 'Wonder of the World glowing soft pink and gold along the Yamuna River at dawn.' },
        { name: 'Agra Fort & Fatehpur Sikri', note: 'Colossal red sandstone Mughal citadels overlooking the Taj Mahal.' },
        { name: 'Qutub Minar & Humayun’s Tomb (Delhi)', note: 'UNESCO sandstone victory minaret and serene Persian-style garden mausoleum.' },
        { name: 'Red Fort & Chandni Chowk Food Walk', note: 'Historic walled city spice lanes, Paranthe Wali Gali, and Jama Masjid.' },
        { name: 'India Gate, Kartavya Path & Lotus Temple', note: 'Grand illuminated boulevards and tranquil petal-shaped Bahá’í House of Worship.' },
        { name: 'Akshardham Temple & Hauz Khas Village', note: 'Intricately hand-carved cultural complex plus lakeside medieval ruins & art cafés.' }
      ],
      localFood: ['Old Delhi Chole Bhature & Jalebi', 'Agra Petha & Bedai', 'Butter Chicken & Kebabs', 'Aloo Tikki Chaat'],
      howToReach: 'Fly into Indira Gandhi International (DEL); take the 100-minute Gatimaan Express train to Agra Cantt.',
      proTip: 'Note that the Taj Mahal is closed on Fridays—enter via the East Gate at 6:00 AM with online tickets for crystal-clear photos.',
      roadmap: [
        { day: 1, time: '06:00', title: 'Taj Mahal Sunrise, Agra Fort & Mehtab Bagh River Sunset', category: 'Culture', cost: 28, done: false },
        { day: 2, time: '09:30', title: 'Delhi Tour: Qutub Minar, Humayun’s Tomb, India Gate & Chandni Chowk', category: 'Food', cost: 26, done: false }
      ]
    },
    {
      id: 'kashmir',
      scope: 'india',
      name: 'Kashmir (Srinagar & Gulmarg)',
      country: 'Jammu & Kashmir, India',
      region: 'India',
      code: 'SXR',
      icon: '❄️',
      gradient: 'linear-gradient(135deg, #0369a1, #4338ca)',
      coords: '34.08° N, 74.79° E',
      mapPos: { x: 398, y: 124 },
      styles: ['Hills', 'Adventure', 'Food'],
      rating: 4.9,
      dailyUsd: 70,
      flightUsd: 165,
      flightHours: '1h 20m (from Delhi)',
      bestSeason: 'Apr–Oct · Dec–Feb (Snow)',
      bestDays: '5–6 Days',
      weather: '14°C Alpine',
      safety: 90,
      wifiMbps: 65,
      visa: 'Domestic / India e-Visa',
      highlight: 'Dal Lake Shikara, Gulmarg Gondola, Pahalgam & Sonamarg Glaciers',
      description: 'Paradise on Earth featuring carved cedar houseboats on mirror-calm Dal Lake, snow-powder gondola peaks, and saffron valleys.',
      topPlaces: [
        { name: 'Dal Lake Shikara Ride & Houseboats', note: 'Glide past floating lotus gardens and wooden markets beneath snow-capped Zabarwan hills.' },
        { name: 'Gulmarg Gondola (Phase 1 & 2)', note: 'One of the world’s highest cable cars soaring to 13,400 ft Apharwat snowfields.' },
        { name: 'Pahalgam, Betaab Valley & Aru Valley', note: 'Pine-clad meadows, rushing turquoise Lidder River, and glacial pony trails.' },
        { name: 'Sonamarg & Thajiwas Glacier', note: 'Meadow of Gold framed by shimmering silver glaciers and alpine streams.' },
        { name: 'Shalimar Bagh, Nishat Bagh & Tulip Garden', note: 'Terraced 17th-century Mughal gardens bursting with spring tulips and chinars.' },
        { name: 'Shankaracharya Hill & Old Srinagar Craft Bazaars', note: 'Panoramic valley temple and authentic Pashmina & walnut-wood workshops.' }
      ],
      localFood: ['Saffron Kashmiri Kahwa Tea', 'Traditional Wazwan & Rogan Josh', 'Crisp Nadru Monje', 'Hot Noon Chai & Sheermal'],
      howToReach: 'Direct flights to Srinagar International Airport (SXR) from Delhi, Mumbai & Bengaluru.',
      proTip: 'Book Gulmarg Gondola Phase 1 & 2 tickets online weeks ahead on the official J&K Cable Car site—walk-up slots sell out fast!',
      roadmap: [
        { day: 1, time: '16:00', title: 'Dal Lake Sunset Shikara Ride & Cedar Houseboat Stay', category: 'Stay', cost: 65, done: false },
        { day: 2, time: '08:30', title: 'Gulmarg Gondola Phase 2 Snow Summit & Alpine Meadow Walk', category: 'Adventure', cost: 48, done: false },
        { day: 3, time: '09:00', title: 'Pahalgam Betaab Valley, Aru Valley & Kashmiri Kahwa', category: 'Explore', cost: 38, done: false }
      ]
    },
    {
      id: 'meghalaya',
      scope: 'india',
      name: 'Meghalaya (Shillong & Dawki)',
      country: 'Northeast India',
      region: 'India',
      code: 'GAU',
      icon: '🌿',
      gradient: 'linear-gradient(135deg, #065f46, #0284c7)',
      coords: '25.57° N, 91.89° E',
      mapPos: { x: 426, y: 140 },
      styles: ['Hills', 'Adventure'],
      rating: 4.9,
      dailyUsd: 52,
      flightUsd: 155,
      flightHours: '2h 30m (to Guwahati)',
      bestSeason: 'Oct–May',
      bestDays: '5 Days',
      weather: '19°C Cloud Forest',
      safety: 95,
      wifiMbps: 60,
      visa: 'Domestic / India e-Visa',
      highlight: 'Double-Decker Living Root Bridge, Dawki Glass River & Nohkalikai Falls',
      description: 'Abode of Clouds home to centuries-old living root bridges, floating glass-clear rivers, turquoise canyons, and Asia’s cleanest village.',
      topPlaces: [
        { name: 'Double-Decker Living Root Bridge (Nongriat)', note: '3,500-step jungle hike to living rubber-fig tree bridges woven over roaring turquoise pools.' },
        { name: 'Dawki (Umngot River) Crystal Boating', note: 'Water so transparent that wooden boats appear to float in mid-air above river pebbles.' },
        { name: 'Nohkalikai & Seven Sisters Waterfalls (Sohra)', note: 'India’s tallest plunge waterfall dropping 1,115 ft into an emerald forest amphitheater.' },
        { name: 'Mawlynnong Village & Balancing Rock', note: 'Flower-lined bamboo walkways in Asia’s cleanest community village.' },
        { name: 'Laitlum Canyons & Umiam Lake (Shillong)', note: 'Dramatic cliff-edge views called the End of Hills plus pine-rimmed lake kayaking.' },
        { name: 'Krang Suri Blue Waterfall & Mawsmai Caves', note: 'Surreal electric-blue swimming lagoon and illuminated limestone caverns.' }
      ],
      localFood: ['Khasi Jadoh Spiced Rice', 'Bamboo Shoot Curries', 'Smoky Shillong Café Momos', 'Fresh Wild Sohiong Berry'],
      howToReach: 'Fly to Guwahati (GAU), then enjoy a scenic 3-hour drive up past Umiam Lake into Shillong.',
      proTip: 'Visit Dawki between November and March when river clarity is at its famous glass-clear peak (avoid muddy monsoon flows).',
      roadmap: [
        { day: 1, time: '09:00', title: 'Umiam Lake, Shillong Police Bazar & Laitlum Canyons Sunset', category: 'Explore', cost: 34, done: false },
        { day: 2, time: '07:00', title: 'Cherrapunji Nohkalikai Falls & Nongriat Double-Decker Root Bridge Trek', category: 'Adventure', cost: 42, done: false },
        { day: 3, time: '08:00', title: 'Dawki Umngot Crystal River Boat & Krang Suri Blue Waterfall', category: 'Adventure', cost: 40, done: false }
      ]
    },
    {
      id: 'darjeeling-sikkim',
      scope: 'india',
      name: 'Darjeeling & Sikkim',
      country: 'Eastern Himalayas, India',
      region: 'India',
      code: 'IXB',
      icon: '🚂',
      gradient: 'linear-gradient(135deg, #1d4ed8, #0f766e)',
      coords: '27.04° N, 88.26° E',
      mapPos: { x: 421, y: 138 },
      styles: ['Hills', 'Heritage', 'Adventure'],
      rating: 4.9,
      dailyUsd: 48,
      flightUsd: 145,
      flightHours: '2h 30m (to Bagdogra)',
      bestSeason: 'Mar–May · Oct–Dec',
      bestDays: '5–6 Days',
      weather: '14°C Himalayan',
      safety: 96,
      wifiMbps: 65,
      visa: 'Domestic (Sikkim Permit Online)',
      highlight: 'Kanchenjunga Sunrise, Himalayan Toy Train, Tsomgo Lake & Gangtok',
      description: 'Misty First-Flush tea slopes, UNESCO steam trains, prayer-flag monasteries, and towering snow views of Mount Kanchenjunga.',
      topPlaces: [
        { name: 'Tiger Hill Kanchenjunga Sunrise', note: 'Watch the world’s 3rd-highest peak ignite in molten gold above a sea of clouds.' },
        { name: 'Darjeeling Himalayan Toy Train & Batasia Loop', note: 'UNESCO spiral railway garden with sweeping 360° Himalayan panoramas.' },
        { name: 'Tsomgo (Changu) Glacial Lake & Nathula Pass', note: 'High-altitude alpine lake (12,313 ft) and historic Silk Road Himalayan border pass.' },
        { name: 'MG Marg Promenade & Rumtek Monastery (Gangtok)', note: 'Spotless pedestrian avenue lined with cafés plus Sikkim’s grandest Tibetan monastery.' },
        { name: 'Happy Valley Tea Estate & Peace Pagoda', note: 'Tour century-old Orthodox Darjeeling tea plucking and sip fresh Muscatel blends.' },
        { name: 'Yumthang Valley (Valley of Flowers) & Zero Point', note: 'Rhododendron-carpeted alpine paradise surrounded by snow peaks in North Sikkim.' }
      ],
      localFood: ['Authentic Darjeeling First-Flush Tea', 'Steaming Tibetan Momos & Phaley', 'Thukpa Noodle Soup', 'Glenary’s Fresh Bakery'],
      howToReach: 'Fly to Bagdogra (IXB) or take train to New Jalpaiguri (NJP)—3 hrs scenic mountain climb to Darjeeling or Gangtok.',
      proTip: 'Carry passport photos & government ID for quick same-day Tsomgo Lake / Nathula Pass permits arranged through Gangtok agencies.',
      roadmap: [
        { day: 1, time: '04:30', title: 'Tiger Hill Kanchenjunga Sunrise, Batasia Loop & Happy Valley Tea', category: 'Explore', cost: 28, done: false },
        { day: 3, time: '08:00', title: 'Gangtok Excursion to Tsomgo Glacial Lake, Baba Mandir & MG Marg', category: 'Adventure', cost: 46, done: false }
      ]
    },
    {
      id: 'shimla-spiti',
      scope: 'india',
      name: 'Shimla, Kasol & Spiti',
      country: 'Himachal Pradesh, India',
      region: 'India',
      code: 'IXC',
      icon: '🏔️',
      gradient: 'linear-gradient(135deg, #0f766e, #4338ca)',
      coords: '31.10° N, 77.17° E',
      mapPos: { x: 403, y: 129 },
      styles: ['Hills', 'Adventure'],
      rating: 4.8,
      dailyUsd: 50,
      flightUsd: 145,
      flightHours: '2h 30m (to Chandigarh)',
      bestSeason: 'Mar–Jun · Oct–Feb (Snow)',
      bestDays: '6 Days',
      weather: '13°C Cedar Cool',
      safety: 94,
      wifiMbps: 60,
      visa: 'Domestic / India e-Visa',
      highlight: 'Kalka-Shimla Train, Key Monastery, Chandratal Lake & Parvati Valley',
      description: 'Colonial hill ridges and deodar forests giving way to bohemian riverside Kasol and Spiti’s raw Tibetan-Himalayan moonscapes.',
      topPlaces: [
        { name: 'Kalka–Shimla Toy Train & The Ridge', note: 'UNESCO 102-tunnel mountain railway arriving at Shimla’s Gothic church square and Mall Road.' },
        { name: 'Key Monastery & Kibber Village (Spiti)', note: '1,000-year-old hilltop monastery perched over the dramatic braided Spiti River.' },
        { name: 'Chandratal (Moon) Crescent Lake', note: 'Miraculous sky-blue high-altitude lake (14,100 ft) for unforgettable Milky Way stargazing.' },
        { name: 'Kasol, Tosh & Kheerganga Trek', note: 'Pine-scented Parvati Valley trails ending at natural steaming mountain hot springs.' },
        { name: 'Hikkim Post Office & Langza Buddha', note: 'Send a postcard from the world’s highest post office (14,567 ft) amid marine fossils.' },
        { name: 'Jakhoo Temple & Kufri Snow Ridge', note: 'Cedar-forested peak overlooking Shimla with winter snow sports and yak rides.' }
      ],
      localFood: ['Himachali Siddu & Ghee', 'Hot Israeli Shakshuka in Kasol', 'Tibetan Tingmo & Thukpa', 'Fresh Kinnaur Apples'],
      howToReach: 'Fly into Chandigarh (IXC) or Bhuntar (KUU); Volvo buses and private SUVs connect Shimla, Kasol & Kaza.',
      proTip: 'Enter Spiti Valley via the Shimla–Kinnaur route for gradual altitude gain, then exit via Kunzum Pass & Manali!',
      roadmap: [
        { day: 1, time: '09:00', title: 'Kalka–Shimla Toy Train Arrival, The Ridge & Jakhoo Peak Sunset', category: 'Explore', cost: 24, done: false },
        { day: 3, time: '08:00', title: 'Spiti Highlights: Key Monastery, Hikkim Post Office & Chandratal Camp', category: 'Adventure', cost: 58, done: false }
      ]
    },
    {
      id: 'mumbai-lonavala',
      scope: 'india',
      name: 'Mumbai & Lonavala',
      country: 'Maharashtra, India',
      region: 'India',
      code: 'BOM',
      icon: '🌃',
      gradient: 'linear-gradient(135deg, #1d4ed8, #be185d)',
      coords: '19.07° N, 72.87° E',
      mapPos: { x: 396, y: 152 },
      styles: ['City', 'Food', 'Heritage', 'Beaches'],
      rating: 4.8,
      dailyUsd: 62,
      flightUsd: 110,
      flightHours: '1h 50m (from Chennai)',
      bestSeason: 'Nov–Feb · Jul–Sep (Lonavala)',
      bestDays: '3–4 Days',
      weather: '28°C Coastal Buzz',
      safety: 91,
      wifiMbps: 155,
      visa: 'Domestic / India e-Visa',
      highlight: 'Gateway of India, Marine Drive, Elephanta Caves & Sahyadri Hills',
      description: 'India’s electric city of dreams—Art Deco ocean boulevards, Victorian spires, Bollywood heritage, and misty Sahyadri waterfalls nearby.',
      topPlaces: [
        { name: 'Gateway of India & Taj Mahal Palace', note: 'Iconic waterfront basalt arch framing Arabian Sea ferries and historic luxury architecture.' },
        { name: 'Marine Drive (Queen’s Necklace)', note: 'Sweeping 3.6-km Art Deco sea promenade sparkling like a necklace of lights after dusk.' },
        { name: 'UNESCO Elephanta Caves Ferry', note: '1-hour harbor ferry to 6th-century monolithic basalt cave sculptures of Lord Shiva.' },
        { name: 'Chhatrapati Shivaji Terminus (CST) & Kala Ghoda', note: 'UNESCO Gothic-Revival railway palace plus Mumbai’s premier art galleries and cafés.' },
        { name: 'Bandra-Worli Sea Link & Bandstand', note: 'Cable-stayed ocean bridge, hipster cafés, street murals, and sunset forts.' },
        { name: 'Lonavala Tiger’s Leap & Bhushi Dam', note: '90 mins away: dramatic Sahyadri monsoon cliffs, Karla Caves, and misty valleys.' }
      ],
      localFood: ['Authentic Vada Pav & Cutting Chai', 'Juhu Beach Pav Bhaji', 'Irani Bun Maska & Berry Pulao', 'Lonavala Maganlal Chikki'],
      howToReach: 'Chhatrapati Shivaji Maharaj International Airport (BOM) & major express trains across India.',
      proTip: 'Catch the 9:00 AM Elephanta ferry from Gateway of India, return for Irani café lunch in Fort, and watch sunset on Marine Drive.',
      roadmap: [
        { day: 1, time: '09:00', title: 'Gateway of India, Elephanta Caves Ferry & Kala Ghoda Art Walk', category: 'Culture', cost: 22, done: false },
        { day: 1, time: '18:00', title: 'Marine Drive Queen’s Necklace Sunset & Juhu Street Food', category: 'Food', cost: 20, done: false },
        { day: 2, time: '08:00', title: 'Day Escape to Lonavala: Karla Caves, Tiger’s Leap & Valley Mist', category: 'Explore', cost: 28, done: false }
      ]
    },
    {
      id: 'mysuru-chikmagalur',
      scope: 'india',
      name: 'Mysuru & Chikmagalur',
      country: 'Karnataka, India',
      region: 'India',
      code: 'MYQ',
      icon: '👑',
      gradient: 'linear-gradient(135deg, #b45309, #047857)',
      coords: '12.29° N, 76.63° E',
      mapPos: { x: 403, y: 164 },
      styles: ['Heritage', 'Hills', 'Food'],
      rating: 4.8,
      dailyUsd: 42,
      flightUsd: 95,
      flightHours: '2h 30m (from Bengaluru)',
      bestSeason: 'Sep–Mar',
      bestDays: '3–4 Days',
      weather: '23°C Royal & Misty',
      safety: 95,
      wifiMbps: 90,
      visa: 'Domestic (No Visa for India)',
      highlight: 'Illuminated Mysore Palace, Chamundi Hills, Mullayanagiri & Hebbe Falls',
      description: '100,000-bulb illuminated royal Wodeyar palace paired with Karnataka’s highest misty coffee peaks and jungle jeep waterfalls.',
      topPlaces: [
        { name: 'Mysore Amba Vilas Palace', note: 'Opulent Indo-Saracenic palace illuminated by 97,000 golden bulbs every Sunday evening.' },
        { name: 'Chamundi Hill Temple & Nandi Monolith', note: '1,000-step heritage hill overlooking all of Mysuru with a massive 16th-century granite bull.' },
        { name: 'Mullayanagiri Peak (Chikmagalur)', note: 'Karnataka’s highest mountain (6,330 ft) offering cloud-walking summit sunrises.' },
        { name: 'Hebbe Falls & Baba Budangiri Hills', note: 'Thrilling 4x4 estate jeep ride to a dual-stage medicinal mountain cascade.' },
        { name: 'Brindavan Musical Gardens & St. Philomena’s', note: 'Symmetric riverside terrace fountains and towering neo-Gothic cathedral.' },
        { name: 'Devaraja Heritage Market & Coffee Estates', note: 'Vibrant pyramids of kumkum, sandalwood, jasmine garlands, and roasted estate coffee.' }
      ],
      localFood: ['Melt-in-Mouth Mysore Pak (Guru Sweet Mart)', 'Crispy Mysore Masala Dosa', 'Malnad Akki Roti', 'Fresh Chikmagalur Filter Coffee'],
      howToReach: '2 hrs from Bengaluru via the Bengaluru–Mysuru Expressway or Shatabdi/Vande Bharat trains.',
      proTip: 'Time your Mysore Palace visit for Sunday or public holiday evenings (7:00–7:45 PM) to witness all 97,000 bulbs switch on at once!',
      roadmap: [
        { day: 1, time: '09:00', title: 'Chamundi Hills, Devaraja Market & Evening Illuminated Mysore Palace', category: 'Culture', cost: 18, done: false },
        { day: 2, time: '07:00', title: 'Chikmagalur Mullayanagiri Cloud Peak, Coffee Estate & Hebbe Falls', category: 'Adventure', cost: 34, done: false }
      ]
    },

    // ---------------- MORE INTERNATIONAL (6 NEW -> 16 TOTAL WORLD) ----------------
    {
      id: 'singapore',
      scope: 'world',
      name: 'Singapore',
      country: 'Singapore',
      region: 'Asia',
      code: 'SIN',
      icon: '🦁',
      gradient: 'linear-gradient(135deg, #0284c7, #059669)',
      coords: '1.35° N, 103.81° E',
      mapPos: { x: 448, y: 182 },
      styles: ['City', 'Food', 'Adventure'],
      rating: 4.9,
      dailyUsd: 155,
      flightUsd: 260,
      flightHours: '4h 10m (direct from Chennai)',
      bestSeason: 'Feb–Oct (Year-Round)',
      bestDays: '4 Days',
      weather: '30°C Garden City',
      safety: 99,
      wifiMbps: 240,
      visa: 'Singapore eVisa',
      highlight: 'Gardens by the Bay, Marina Bay Sands, Sentosa & Jewel Changi',
      description: 'Sci-fi garden metropolis where futuristic Supertrees, indoor waterfalls, Michelin hawker centers, and Tamil/Chinese/Malay quarters meet.',
      topPlaces: [
        { name: 'Gardens by the Bay (Cloud Forest & Supertrees)', note: 'Avatar-like illuminated vertical gardens and the world’s tallest indoor misty mountain waterfall.' },
        { name: 'Marina Bay Sands & Spectra Light Show', note: 'Iconic triple-tower SkyPark overlooking the skyline and free nightly bay laser show.' },
        { name: 'Sentosa Island & Universal Studios', note: 'Roller coasters, S.E.A. Aquarium, cable cars, and golden Palawan beach suspension bridge.' },
        { name: 'Jewel Changi Rain Vortex', note: 'Breathtaking 40-meter indoor waterfall cascading inside a glass forest dome right at the airport.' },
        { name: 'Little India, Chinatown & Haji Lane', note: 'Colorful Sri Veeramakaliamman temple, vibrant street art, and heritage shophouses.' },
        { name: 'Night Safari & Merlion Park', note: 'World’s first nocturnal wildlife park and classic harbor photo spot.' }
      ],
      localFood: ['Hainanese Chicken Rice (Maxwell Hawker)', 'Chilli Crab & Mantou', 'Laksa & Satay by the Bay', 'Teh Tarik & Kaya Toast'],
      howToReach: 'Direct 4-hour flights from Chennai, Trichy, Madurai, Bengaluru & worldwide into Changi Airport (SIN); spotless MRT subway.',
      proTip: 'Watch the free Garden Rhapsody music-and-light show beneath the Supertrees at 7:45 PM, then walk 5 mins to catch Spectra at 8:00 PM!',
      roadmap: [
        { day: 1, time: '14:00', title: 'Jewel Changi Waterfall, Merlion Park & Gardens by the Bay Light Show', category: 'Explore', cost: 42, done: false },
        { day: 2, time: '09:30', title: 'Sentosa Island: Universal Studios, Cable Car & Siloso Beach', category: 'Adventure', cost: 88, done: false },
        { day: 3, time: '10:00', title: 'Little India, Haji Lane, Maxwell Hawker Feast & Night Safari', category: 'Food', cost: 58, done: false }
      ]
    },
    {
      id: 'malaysia',
      scope: 'world',
      name: 'Kuala Lumpur & Langkawi',
      country: 'Malaysia',
      region: 'Asia',
      code: 'KUL',
      icon: '🌉',
      gradient: 'linear-gradient(135deg, #1d4ed8, #0f766e)',
      coords: '3.13° N, 101.68° E',
      mapPos: { x: 446, y: 178 },
      styles: ['City', 'Beaches', 'Food', 'Heritage'],
      rating: 4.8,
      dailyUsd: 78,
      flightUsd: 220,
      flightHours: '3h 55m (direct from Chennai)',
      bestSeason: 'Dec–Apr (Langkawi) · Year-Round',
      bestDays: '5 Days',
      weather: '29°C Tropical',
      safety: 92,
      wifiMbps: 145,
      visa: 'Visa-Free (30 Days for Many Nations)',
      highlight: 'Petronas Twin Towers, Batu Caves, Langkawi Sky Bridge & Penang',
      description: 'Gleaming twin skyscrapers, rainbow-staircase limestone cave temples, duty-free tropical islands, and unbeatable street food.',
      topPlaces: [
        { name: 'Petronas Twin Towers & KLCC Park', note: 'World’s tallest twin towers with skybridge views and nightly musical symphony fountains.' },
        { name: 'Batu Caves Rainbow Steps & Lord Murugan Statue', note: '272 vibrant steps climbing beneath a soaring 140-ft golden statue into towering cathedral caves.' },
        { name: 'Langkawi SkyCab & Curved Sky Bridge', note: 'Steep rainforest cable car leading to a dramatic suspended glass-floor bridge over Andaman islands.' },
        { name: 'Genting Highlands Awana SkyWay', note: 'Cool mountaintop theme park and cliffside Chin Swee Caves Temple above the clouds.' },
        { name: 'Jalan Alor Night Food Street & Chinatown', note: 'Sizzling woks, durian stalls, grilled satay, and historic Petaling Street.' },
        { name: 'Penang George Town Street Art (Bonus Stop)', note: 'UNESCO heritage city celebrated for whimsical wall murals and legendary hawker food.' }
      ],
      localFood: ['Nasi Lemak & Rendang', 'Flaky Roti Canai & Teh Tarik', 'Char Kway Teow', 'Banana Leaf Meals in Brickfields'],
      howToReach: 'Direct budget & full-service flights from Chennai, Trichy & India to Kuala Lumpur (KUL), plus 55-min hop to Langkawi (LGK).',
      proTip: 'Visit Batu Caves right at 7:30 AM before sun heats the 272 steps, and use Grab everywhere in Malaysia for transparent, super-cheap rides.',
      roadmap: [
        { day: 1, time: '08:00', title: 'Batu Caves Rainbow Steps, Petronas Twin Towers & Jalan Alor Night Food', category: 'Culture', cost: 34, done: false },
        { day: 3, time: '09:30', title: 'Langkawi Cable Car, Curved Sky Bridge & Cenang Beach Sunset', category: 'Adventure', cost: 48, done: false }
      ]
    },
    {
      id: 'maldives',
      scope: 'world',
      name: 'Maldives Islands',
      country: 'Maldives',
      region: 'Asia',
      code: 'MLE',
      icon: '🏝️',
      gradient: 'linear-gradient(135deg, #0284c7, #06b6d4)',
      coords: '4.17° N, 73.50° E',
      mapPos: { x: 398, y: 179 },
      styles: ['Beaches', 'Adventure'],
      rating: 4.9,
      dailyUsd: 165,
      flightUsd: 240,
      flightHours: '2h (from Kochi / Trivandrum)',
      bestSeason: 'Nov–Apr',
      bestDays: '4 Days',
      weather: '29°C Lagoon Sun',
      safety: 96,
      wifiMbps: 70,
      visa: 'Free 30-Day Visa on Arrival',
      highlight: 'Overwater Lagoons, Maafushi Coral Snorkel, Sandbanks & Bioluminescence',
      description: '1,190 emerald coral islands ringed by luminous neon-turquoise lagoons, manta rays, sandbanks, and budget or luxury island stays.',
      topPlaces: [
        { name: 'Maafushi & Fulidhoo Local Islands', note: 'Affordable island guesthouses with turquoise bikini beaches and daily reef excursions.' },
        { name: 'Overwater Lagoon Villas & Sandbank Picnics', note: 'Step straight from your wooden deck into warm glass-clear coral gardens.' },
        { name: 'Nurse Shark & Manta Ray Snorkel Safari', note: 'Swim beside gentle reef sharks, sea turtles, and gliding giant manta rays.' },
        { name: 'Vaadhoo Sea of Stars (Bioluminescence)', note: 'Magical glowing blue shoreline lit up by nocturnal marine plankton.' },
        { name: 'Sunset Dolphin Watching Cruise', note: 'Pods of spinner dolphins leaping beside traditional wooden dhoni boats at dusk.' },
        { name: 'Malé Old Friday Mosque & Local Fish Market', note: '17th-century coral-stone mosque and lively island capital waterfront.' }
      ],
      localFood: ['Mas Huni Tuna & Coconut Flatbread', 'Grilled Reef Fish & Garudhiya', 'Fresh Passionfruit & Tropical Juices', 'Maldivian Short Eats'],
      howToReach: 'Direct 1.5–2 hr flights from Kochi, Trivandrum, Bengaluru & Mumbai to Velana International Airport (MLE); speedboat transfers.',
      proTip: 'Stay on a charming local island like Maafushi or Thulusdhoo for ₹6,000–₹10,000/night and book a 1-day luxury resort day-pass for the best of both worlds!',
      roadmap: [
        { day: 1, time: '13:00', title: 'Speedboat from Malé to Island Lagoon & Sunset Dolphin Cruise', category: 'Explore', cost: 65, done: false },
        { day: 2, time: '09:00', title: 'Full-Day Sandbank Picnic, Turtle Reef & Manta Snorkel Safari', category: 'Adventure', cost: 72, done: false }
      ]
    },
    {
      id: 'italy-rome-amalfi',
      scope: 'world',
      name: 'Rome & Amalfi Coast',
      country: 'Italy',
      region: 'Europe',
      code: 'FCO',
      icon: '🍝',
      gradient: 'linear-gradient(135deg, #b45309, #be123c)',
      coords: '41.90° N, 12.49° E',
      mapPos: { x: 300, y: 109 },
      styles: ['Heritage', 'Beaches', 'Food', 'City'],
      rating: 4.9,
      dailyUsd: 175,
      flightUsd: 730,
      flightHours: '9h 40m',
      bestSeason: 'Apr–Jun · Sep–Oct',
      bestDays: '5–6 Days',
      weather: '22°C Mediterranean',
      safety: 90,
      wifiMbps: 110,
      visa: 'Schengen Visa / Visa-Free',
      highlight: 'Colosseum, Vatican City, Trevi Fountain, Positano & Pompeii',
      description: '2,000-year-old gladiatorial arenas and Renaissance art seamlessly paired with lemon-scented pastel cliff villages on the Amalfi Coast.',
      topPlaces: [
        { name: 'The Colosseum & Roman Forum', note: 'Monumental 80 AD amphitheater and ancient marble heart of the Roman Empire.' },
        { name: 'Vatican Museums, Sistine Chapel & St. Peter’s', note: 'Michelangelo’s ceiling masterpiece and soaring Renaissance dome panorama.' },
        { name: 'Trevi Fountain, Pantheon & Trastevere', note: 'Toss a coin into the Baroque fountain and dine along ivy-draped cobblestone alleys.' },
        { name: 'Positano & Amalfi Cliff Villages', note: 'Stacked pastel Mediterranean terraces cascading down to pebble coves.' },
        { name: 'Path of the Gods (Sentiero degli Dei)', note: 'World-famous clifftop hike suspended above the Tyrrhenian Sea and Capri.' },
        { name: 'Ancient Pompeii & Isle of Capri Blue Grotto', note: 'Frozen Roman city beneath Mount Vesuvius plus glowing sapphire sea caves.' }
      ],
      localFood: ['Authentic Cacio e Pepe & Carbonara', 'Wood-Fired Neapolitan Pizza', 'Pistachio Gelato', 'Amalfi Lemon Granita & Tiramisu'],
      howToReach: 'Fly into Rome Fiumicino (FCO); high-speed Frecciarossa train reaches Naples/Salerno in 70 mins for Amalfi ferries.',
      proTip: 'Visit Trevi Fountain at 6:30 AM for peaceful magic, and take scenic sea ferries between Salerno, Amalfi, and Positano to skip coastal traffic.',
      roadmap: [
        { day: 1, time: '08:30', title: 'Colosseum, Roman Forum, Pantheon & Trastevere Pasta Dinner', category: 'Culture', cost: 54, done: false },
        { day: 3, time: '09:00', title: 'High-Speed Rail South & Ferry along Amalfi Coast to Positano Cliffs', category: 'Explore', cost: 72, done: false }
      ]
    },
    {
      id: 'london',
      scope: 'world',
      name: 'London',
      country: 'United Kingdom',
      region: 'Europe',
      code: 'LHR',
      icon: '🎡',
      gradient: 'linear-gradient(135deg, #1e3a8a, #991b1b)',
      coords: '51.50° N, 0.12° W',
      mapPos: { x: 277, y: 88 },
      styles: ['City', 'Heritage', 'Food'],
      rating: 4.8,
      dailyUsd: 195,
      flightUsd: 740,
      flightHours: '10h 15m',
      bestSeason: 'May–Sep',
      bestDays: '4–5 Days',
      weather: '15°C Classic',
      safety: 91,
      wifiMbps: 150,
      visa: 'UK Standard Visitor Visa / ETA',
      highlight: 'Big Ben, Tower Bridge, British Museum, London Eye & Borough Market',
      description: 'Royal palaces, free world-class museums, double-decker red buses, West End musicals, and vibrant global food markets along the Thames.',
      topPlaces: [
        { name: 'Big Ben, Westminster Abbey & London Eye', note: 'Iconic riverside Gothic parliament clocktower and sweeping glass-capsule skyline views.' },
        { name: 'Tower of London & Tower Bridge', note: 'Home of the Crown Jewels beside London’s legendary Victorian bascule drawbridge.' },
        { name: 'British Museum & Natural History Museum', note: 'World treasures including the Rosetta Stone and soaring dinosaur halls—100% free entry!' },
        { name: 'Buckingham Palace, Hyde Park & Sky Garden', note: 'Changing of the Guard, royal parkland walks, and free 35th-floor tropical sky garden.' },
        { name: 'Borough Market, Soho & Covent Garden', note: '1,000-year-old gourmet food hall, street performers, and West End theaters.' },
        { name: 'Camden Lock, Notting Hill & Greenwich Meridian', note: 'Pastel Portobello Road houses and standing directly on 0° Longitude.' }
      ],
      localFood: ['Borough Market Artisanal Bites', 'Classic Fish & Chips', 'Brick Lane Curry & Dishoom', 'Traditional Afternoon Scones & Tea'],
      howToReach: 'London Heathrow (LHR) connected in 30 mins via the sleek Elizabeth Line directly into Central London.',
      proTip: 'Simply tap your contactless debit/credit card or phone on the Tube & red buses—TfL automatically caps your daily fare, and book free Sky Garden slots 3 weeks ahead!',
      roadmap: [
        { day: 1, time: '09:00', title: 'Big Ben, Buckingham Palace, British Museum & Covent Garden Evening', category: 'Culture', cost: 42, done: false },
        { day: 2, time: '10:00', title: 'Tower Bridge, Borough Market Feast & Sky Garden Sunset Panorama', category: 'Explore', cost: 38, done: false }
      ]
    },
    {
      id: 'new-york',
      scope: 'world',
      name: 'New York City',
      country: 'United States',
      region: 'Americas',
      code: 'JFK',
      icon: '🗽',
      gradient: 'linear-gradient(135deg, #0f172a, #0284c7)',
      coords: '40.71° N, 74.00° W',
      mapPos: { x: 158, y: 112 },
      styles: ['City', 'Food', 'Heritage'],
      rating: 4.9,
      dailyUsd: 230,
      flightUsd: 920,
      flightHours: '15h 30m',
      bestSeason: 'Apr–Jun · Sep–Dec',
      bestDays: '5 Days',
      weather: '16°C Electric',
      safety: 87,
      wifiMbps: 210,
      visa: 'US B1/B2 Visa / ESTA',
      highlight: 'Statue of Liberty, Central Park, Times Square, Brooklyn Bridge & Summit',
      description: 'The city that never sleeps—sky-piercing Art Deco observatories, Broadway lights, lush Central Park, and cuisines from every corner of Earth.',
      topPlaces: [
        { name: 'Statue of Liberty & Staten Island Ferry', note: 'Iconic copper torch in New York Harbor (plus sweeping free skyline views from the ferry).' },
        { name: 'Central Park & Metropolitan Museum of Art', note: '843-acre urban oasis of bridges and lakes beside 5,000 years of world art.' },
        { name: 'Brooklyn Bridge Walk & DUMBO Waterfront', note: 'Walk across the 1883 stone-arch suspension bridge for Manhattan’s ultimate skyline view.' },
        { name: 'Times Square, Broadway & Empire State / Top of the Rock', note: 'Dazzling neon crossroads, live Broadway musicals, and 360° golden-hour skyscrapers.' },
        { name: 'The High Line, Vessel & Chelsea Market', note: 'Elevated botanical garden built on historic rail tracks ending in an artisan food hall.' },
        { name: '9/11 Memorial, One World Observatory & SoHo', note: 'Moving reflecting pools, cast-iron architecture, and trendsetting cafés.' }
      ],
      localFood: ['Classic NY Thin-Crust Pizza Slice', 'Toasted Everything Bagel & Cream Cheese', 'Chelsea Market Tacos & Lobster Roll', 'New York Cheesecake'],
      howToReach: 'JFK, Newark (EWR) & LaGuardia (LGA) airports; 24/7 NYC Subway connects Manhattan, Brooklyn & Queens.',
      proTip: 'Walk across the Brooklyn Bridge from Brooklyn toward Manhattan just before sunset so the glowing skyline faces you the entire way!',
      roadmap: [
        { day: 1, time: '09:00', title: 'Statue of Liberty, 9/11 Memorial & Sunset Walk across Brooklyn Bridge', category: 'Explore', cost: 48, done: false },
        { day: 2, time: '10:00', title: 'Central Park, The Met Museum, High Line & Times Square Night Lights', category: 'Culture', cost: 64, done: false }
      ]
    }
  ];

  NEW_DESTINATIONS.forEach((d) => list.push(d));

  // Refresh Scope Subtitles with updated counts
  window.TerraVoyage.SCOPES = [
    { id: 'all', label: '🌐 All Destinations', sub: 'TN · India · World' },
    { id: 'tn', label: '🛕 Tamil Nadu (TN)', sub: '15 Iconic TN Places' },
    { id: 'india', label: '🇮🇳 India', sub: '14 Incredible States' },
    { id: 'world', label: '✈️ Other Countries', sub: '16 Global Wonders' }
  ];
})();
