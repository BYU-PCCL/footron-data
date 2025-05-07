const allInfo = {
  sun: {
    title: "Sun",
    description: {
      blurb: [
        "The Sun—the heart of our solar system—is a yellow dwarf star, a hot ball of glowing gases.",
      ],
      more: [
        "Its gravity holds the solar system together, keeping everything from the biggest planets to the smallest particles of debris in its orbit. Electric currents in the Sun generate a magnetic field that is carried out through the solar system by the solar wind—a stream of electrically charged gas blowing outward from the Sun in all directions.",
        "The connection and interactions between the Sun and Earth drive the seasons, ocean currents, weather, climate, radiation belts and aurorae. Though it is special to us, there are billions of stars like our Sun scattered across the Milky Way galaxy. The Sun, and everything that orbits it, is located in the Milky Way galaxy. More specifically, our Sun is in a spiral arm called the Orion Spur that extends outward from the Sagittarius arm. From there, the Sun orbits the center of the Milky Way Galaxy, bringing the planets, asteroids, comets and other objects along with it. Our solar system is moving with an average velocity of 450,000 miles per hour (720,000 kilometers per hour). But even at this speed, it takes us about 230 million years to make one complete orbit around the Milky Way.",
        "The Sun rotates as it orbits the center of the Milky Way. Its spin has an axial tilt of 7.25 degrees with respect to the plane of the planets’ orbits. Since the Sun is not a solid body, different parts of the Sun rotate at different rates. At the equator, the Sun spins around once about every 25 days, but at its poles the Sun rotates once on its axis every 36 Earth days.",
      ],
    },
    related: [
      "sc_ulysses",
      "sc_parker_solar_probe",
      "sc_soho",
      "sc_stereo_ahead",
      "sc_stereo_behind",
      "sc_sdo",
      "sc_acrimsat",
    ],
  },
  mercury: {
    title: "Mercury",
    description: {
      blurb: [
        "The smallest planet in our solar system and nearest to the Sun, Mercury is only slightly larger than Earth's Moon.",
      ],
      more: [
        "Mercury's surface temperatures are both extremely hot and cold. Because the planet is so close to the Sun, day temperatures can reach highs of 800°F (430°C). Without an atmosphere to retain that heat at night, temperatures can dip as low as -290°F (-180°C). From the surface of Mercury, the Sun would appear more than three times as large as it does when viewed from Earth, and the sunlight would be as much as seven times brighter. Despite its proximity to the Sun, Mercury is not the hottest planet in our solar system – that title belongs to nearby Venus, thanks to its dense atmosphere. But Mercury is the fastest planet, zipping around the Sun every 88 Earth days. Mercury's surface resembles that of Earth's moon, scarred by many impact craters resulting from collisions with meteoroids and comets. The first spacecraft to visit Mercury was Mariner 10, which imaged about 45 percent of the surface. NASA's MErcury Surface, Space ENvironment, GEochemistry, and Ranging (MESSENGER) mission flew by Mercury three times in 2008-2009 and orbited the planet from 2011 to 2015, mapping the entire surface.",
      ],
    },
    related: ["sc_messenger"],
    data: {
      distance: 57909227,
      radius: 2439.7,
      volume: 60827208742,
      density: 5.427,
      mass: 3.30104e23,
      area: 74797000,
      gravity: 3.7,
      eccentricity: 0.20563593,
      inclination: 0,
      velocity: 15300,
      circumference: 15329.1,
    },
  },
  venus: {
    title: "Venus",
    description: {
      blurb: [
        "Similar in size and structure to Earth, Venus has been called Earth's twin. These are not identical twins, however – there are radical differences between the two worlds.",
      ],
      more: [
        "Venus and Earth are similar in size, mass, density, composition, and gravity. There, however, the similarities end. Venus has a thick, toxic atmosphere filled with carbon dioxide and it’s perpetually shrouded in thick, yellowish clouds of mostly sulfuric acid that trap heat, causing a runaway greenhouse effect. It’s the hottest planet in our solar system, even though Mercury is closer to the Sun. Venus has crushing air pressure at its surface – more than 90 times that of Earth – similar to the pressure you'd encounter a mile below the ocean on Earth. Venus was the first planet to be explored by a spacecraft – NASA’s Mariner 2 successfully flew by and scanned the cloud-covered world on Dec. 14, 1962. Since then, numerous spacecraft from the U.S. and other space agencies have explored Venus, including NASA’s Magellan, which mapped the planet's surface with radar. The former Soviet Union is the only nation to land on the surface of Venus to date, though the spacecraft did not survive long in the harsh environment.",
      ],
    },
    related: ["sc_magellan", "sc_galileo", "sc_cassini", "sc_messenger"],
  },
  earth: {
    title: "Earth",
    description: {
      blurb: [
        "Earth—our home planet—is the only place we know of so far that’s inhabited by living things. It's also the only planet in our solar system with liquid water on the surface.",
      ],
      more: [
        "Earth is only the fifth largest planet in the solar system, just slightly larger than nearby Venus. Earth is the biggest of the four planets closest to the Sun, all of which are made of rock and metal. NASA has the most missions of all operating on our home planet. NASA’s Earth Observing System (EOS) is a coordinated series of polar-orbiting and low inclination satellites for long-term global observations of the land surface, biosphere, solid Earth, atmosphere, and oceans.",
      ],
    },
    related: ["sc_iss", "sc_eo_1", "sc_acrimsat", "moon"],
  },
  mars: {
    title: "Mars",
    description: {
      blurb: [
        "The fourth planet from the Sun, Mars is a dusty, cold, desert world with a very thin atmosphere.",
      ],
      more: [
        "Mars was named by the ancient Romans for their god of war because its reddish color was reminiscent of blood. The Red Planet is actually many colors. At the surface we see colors such as brown, gold and tan. The reason Mars looks reddish is due to oxidization—or rusting—of iron in the rocks, regolith (Martian “soil”), and dust of Mars. This dust gets kicked up into the atmosphere and from a distance makes the planet appear mostly red. Mars is home to the largest volcano in the solar system, Olympus Mons. It's three times taller than Earth's Mt. Everest with a base the size of the state of New Mexico.",
        "Mars appears to have had a watery past, with ancient river valley networks, deltas and lakebeds, as well as rocks and minerals on the surface that could only have formed in liquid water. Some features suggest that Mars experienced huge floods about 3.5 billion years ago. There is water on Mars today, but the Martian atmosphere is too thin for liquid water to exist for long on the surface. Today, water on Mars is found in the form of water-ice just under the surface in the polar regions as well as in briny (salty) water, which seasonally flows down some hillsides and crater walls.",
        "No planet beyond Earth has been studied as intensely as Mars. Today, a science fleet of robotic spacecraft study Mars from all angles.",
      ],
    },
    data: {
      distance: 227943824,
      radius: 3389.5,
      volume: 163115609799,
      density: 3.934,
      mass: 6.41693e23,
      area: 144371391,
      gravity: 3.71,
      eccentricity: 0.0933941,
      inclination: 25.2,
      velocity: 18108,
      circumference: 21296.9,
    },
    related: ["sc_mars_global_surveyor"],
  },
  jupiter: {
    title: "Jupiter",
    description: {
      blurb: [
        "Jupiter is the fifth planet from our Sun and is, by far, the largest planet in the solar system – more than twice as massive as all the other planets combined.",
      ],
      more: [
        "Jupiter's stripes and swirls are actually cold, windy clouds of ammonia and water, floating in an atmosphere of hydrogen and helium. Jupiter’s iconic Great Red Spot is a giant storm bigger than Earth that has raged for hundreds of years. Jupiter is surrounded by dozens of moons. Jupiter also has several rings, but unlike the famous rings of Saturn, Jupiter’s rings are very faint and made of dust, not ice. Jupiter has the shortest day in the solar system. One day on Jupiter takes only about 10 hours (the time it takes for Jupiter to rotate or spin around once), and Jupiter makes a complete orbit around the Sun (a year in Jovian time) in about 12 Earth years (4,333 Earth days). Its equator is tilted with respect to its orbital path around the Sun by just 3 degrees. This means Jupiter spins nearly upright and does not have seasons as extreme as other planets do. Jupiter took shape when the rest of the solar system formed about 4.5 billion years ago, when gravity pulled swirling gas and dust in to become this gas giant. Jupiter took most of the mass left over after the formation of the Sun, ending up with more than twice the combined material of the other bodies in the solar system. In fact, Jupiter has the same ingredients as a star, but it did not grow massive enough to ignite.",
      ],
    },
    related: [
      "sc_juno",
      "sc_cassini",
      "sc_voyager_1",
      "sc_voyager_2",
      "sc_galileo",
      "sc_pioneer_10",
      "sc_ulysses",
      "sc_new_horizons",
    ],
  },
  saturn: {
    title: "Saturn",
    description: {
      blurb: [
        "Saturn is the sixth planet from the Sun and the second largest planet in our solar system. Adorned with thousands of beautiful ringlets, Saturn is unique among the planets. It is not the only planet to have rings—made of chunks of ice and rock—but none are as spectacular or as complicated as Saturn's. Like fellow gas giant Jupiter, Saturn is a massive ball made mostly of hydrogen and helium.",
      ],
      more: [
        "Surrounded by more than 140 known moons, Saturn is home to some of the most fascinating landscapes in our solar system. From the jets of water that spray from Enceladus to the methane lakes on smoggy Titan, the Saturn system is a rich source of scientific discovery and still holds many mysteries.The farthest planet from Earth discovered by the unaided human eye, Saturn has been known since ancient times. The planet is named for the Roman god of agriculture and wealth, who was also the father of Jupiter. Saturn's rings are thought to be pieces of comets, asteroids or shattered moons that broke up before they reached the planet, torn apart by Saturn's powerful gravity. They are made of billions of small chunksof ice and rock coated with another material such as dust. The ring particles mostly range from tiny, dust-sized icy grains to chunks as big as a house. A few particles are as large as mountains. The rings would look mostly white if you looked at them from the cloud tops of Saturn, and interestingly, each ring orbits at a different speed around the planet.",
      ],
    },
    related: ["sc_cassini", "sc_voyager_1", "sc_voyager_2", "sc_pioneer_11"],
  },
  neptune: {
    title: "Neptune",
    description: {
      blurb: [
        "Dark, cold and whipped by supersonic winds, ice giant Neptune is the eighth and most distant planet in our solar system.",
      ],
      more: [
        "More than 30 times as far from the Sun as Earth, Neptune is the only planet in our solar system not visible to the naked eye. In 2011 Neptune completed its first 165-year orbit since its discovery in 1846.",
        'Neptune is so far from the Sun that high noon on the big blue planet would seem like dim twilight to us. The warm light we see here on our home planet is roughly 900 times as bright as sunlight on Neptune. Neptune is one of two ice giants in the outer solar system (the other is Uranus). Most (80 percent or more) of the planet\'s mass is made up of a hot dense fluid of "icy" materials — water, methane and ammonia — above a small, rocky core. Of the giant planets, Neptune is the densest.',
        "Scientists think there might be an ocean of super hot water under Neptune's cold clouds. It does not boil away because incredibly high pressure keeps it locked inside. Neptune's atmosphere is made up mostly of hydrogen and helium with just a little bit of methane. Neptune's neighbor Uranus is a blue-green color due to such atmospheric methane, but Neptune is a more vivid, brighter blue, so there must be an unknown component that causes the more intense color.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  uranus: {
    title: "Uranus",
    description: {
      blurb: [
        "The seventh planet from the Sun with the third largest diameter in our solar system, Uranus is very cold and windy.",
      ],
      more: [
        "The ice giant is surrounded by 13 faint rings and 27 small moons as it rotates at a nearly 90-degree angle from the plane of its orbit. This unique tilt makes Uranus appear to spin on its side, orbiting the Sun like a rolling ball. Uranus is the only planet whose equator is nearly at a right angle to its orbit, with a tilt of 97.77 degrees—possibly the result of a collision with an Earth-sized object long ago. This unique tilt causes the most extreme seasons in the solar system. For nearly a quarter of each Uranian year, the Sun shines directly over each pole, plunging the other half of the planet into a 21-year-long, dark winter.",
        "Uranus is also one of just two planets that rotate in the opposite direction than most of the planets (Venus is the other one), from east to west.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  "134340_pluto": {
    title: "Pluto",
    description: {
      blurb: [
        "Pluto – which is smaller than Earth’s Moon – has a heart-shaped glacier that’s the size of Texas and Oklahoma. This fascinating dwarf planet has blue skies, spinning moons, mountains as high as the Rockies, and it snows – but the snow is red.",
      ],
      more: [
        "Pluto is a complex and mysterious world with mountains, valleys, plains, craters, and maybe glaciers. Discovered in 1930, Pluto was long considered our solar system's ninth planet. But after the discovery of similar intriguing worlds deeper in the distant Kuiper Belt, icy Pluto was reclassified as a dwarf planet.",
        ' Pluto is orbited by five known moons, the largest of which is Charon. Charon is about half the size of Pluto itself, making it the largest satellite relative to the planet it orbits in our solar system. Pluto and Charon are often referred to as a "double planet". On July 14, 2015, NASA’s New Horizons spacecraft made its historic flight through the Pluto system – providing the first close-up images of Pluto and its moons and collecting other data that has transformed our understanding of these mysterious worlds on the solar system’s outer frontier.',
        "In the years since that groundbreaking flyby, nearly every conjecture about Pluto possibly being an inert ball of ice has been thrown out the window or flipped on its head.",
      ],
    },
    related: ["sc_new_horizons"],
  },
  earth_system: {
    title: "Earth System",
    description: {
      blurb: [
        "Earth is orbited by one moon known simply as 'The Moon' or less commonly 'Luna'. The moon completes its orbit around the earth every 27.5 days.",
      ],
    },
    data: {
      "Number of moons": 1,
    },
    related: ["earth", "moon"],
  },
  mars_system: {
    title: "Mars System",
    description: {
      blurb: [
        "Mars is orbited by two small moons Phobos and Deimos named for the Greek gods of fear and terror respectively.",
      ],
    },
    data: {
      "Number of moons": 2,
    },
    related: ["mars", "phobos", "deimos"],
  },
  jupiter_system: {
    title: "Jupiter System",
    description: {
      blurb: [
        "Jupiter is orbited by many moons. 95 are currently known, but more likely exist.",
      ],
      more: [
        "Many of these moons are small, less than 10km across, but several are among the largest and most interesting in the Solar System.",
        "Jupiter's Gallilean moons (Io, Europa, Ganymede) are also notable for their orbits forming a resonance pattern. For every single orbit of Ganymede, Europa will orbit twice and Io will orbit four times.",
      ],
    },
    data: {
      "Number of moons": "95+",
    },
    related: ["jupiter", "callisto", "europa", "ganymede", "io"],
  },
  saturn_system: {
    title: "Saturn System",
    description: {
      blurb: [
        "Saturn, in addition to its thousands of rings, has the most moons in the solar system by far; over 140 have been found so far.",
      ],
      more: [
        "Saturn's largest moon Titan has the densest atmosphere of any moon. Consisting of nitrogen and methane Titan's atmosphere is even thicker than Earth's."
      ]
    },
    data: {
      "Number of moons": "140+",
    },
    related: [
      "saturn",
      "dione",
      "enceladus",
      "iapetus",
      "mimas",
      "rhea",
      "tethys",
      "titan",
    ],
  },
  uranus_system: {
    title: "Uranus System",
    description: {
      blurb: [
        "While most moons in the Solar System are named for characters from ancient mythology, Uranus's moons are named after characters written by Shakespeare and Alexander Pope.",
      ],
    },
    data: {
      "Number of moons": 24,
    },
    related: ["uranus", "miranda", "oberon", "titania", "umbriel"],
  },
  neptune_system: {
    title: "Neptune System",
    description: {
      blurb: [
        "Neptune has several moons, but the largest by far is Triton. Triton is roughly half the diameter of earths moon, but over 500 times more massive than Neptunes next largest moon, Proteus",
      ],
    },
    data: {
      "Number of moons": 16,
    },
    related: ["neptune", "triton"],
  },
  "134340_pluto_barycenter": {
    title: "Pluto system",
    description: {
      blurb: [
        "The Pluto system's barycenter, or the center of mass of two or more bodies that orbit one another, is not inside Pluto. It is between Pluto and Charon.",
      ],
      more: [""],
    },
    related: [
      "pluto",
      "charon",
      "hydra",
      "kerberos",
      "nix",
      "styx",
    ],
  },
  "134340_pluto_barycenter": {
    title: "Pluto system",
    description: {
      blurb: [
        "The Pluto system's barycenter, or the center of mass of two or more bodies that orbit one another, is not inside Pluto. It is between Pluto and Charon.",
      ],
      more: [""],
    },
    related: [
      "pluto",
      "charon",
      "hydra",
      "kerberos",
      "nix",
      "styx",
    ],
  },
  "617_patroclus_barycenter": {
    title: "Patroclus and Menoetius",
    description: {
    },
    related: [
      "617_patroclus",
      "menoetius"
    ],
  },
  "65803_didymos_system": {
    title: "Didymos and Dimorphos",
    description: {
    },
    related: [
      "617_patroclus",
      "menoetius",
      "sc_dart"
    ],
  },
  "21_lutetia": {
    title: "Lutetia",
    description: {
      blurb: [
        "Lutetia is a large asteroid that was visited by Europe's Rosetta space probe in 2010.",
      ],
      more: [""],
    },
    related: ["sc_rosetta"],
    stats: {
      discovery:
        "Discovered in 1852, the asteroid was visited by the European space probe Rosetta in July of 2010.",
      rotation: 8.1655,
    },
  },
  "253_mathilde": {
    title: "Mathilde",
    description: {
      blurb: [
        "The asteroid Mathilde was visited by the NEAR Shoemaker mission in 1997.",
      ],
      more: [""],
    },
    related: ["sc_near_shoemaker"],
  },
  "11351_leucus": {
    title: "Leucus",
    description: {
      blurb: [
        'Leucus is an asteroid located in the orbit of Jupiter, always orbiting "ahead" of Jupiter by sixty degrees. Referred to as a Trojan asteroid, it will be visited by the Lucy mission in April of 2028.',
      ],
      more: [
        "The Lucy mission will also fly by Leucus. This 40 km (25 mile) D-type asteroid rotates extremely slowly. Its day is 446 hours! This slow rotation period means that it will likely get hotter during the day and colder at night than the other asteroids, so by comparing it with other D-type asteroids we should learn more about the materials that make up these asteroids. Also, as it rotates its brightness as observed from Earth varies a lot, suggesting that it is quite elongated. Lucy will know for sure when it flies by on April 18, 2028.",
      ],
    },
    related: [
      "sc_lucy",
      "55246_donaldjohanson",
      "3548_eurybates",
      "15094_polymele",
      "21900_orus",
      "617_patroclus",
    ],
    stats: {
      discovery:
        "Discovered in 1997, Leucus is a Trojan Asteroid that will be visited by the Lucy mission in April of 2028.",
      rotation: 445.73,
    },
  },
  "15094_polymele": {
    title: "Polymele",
    description: {
      blurb: [
        'Polymele is an asteroid located in the orbit of Jupiter, always orbiting "ahead" of Jupiter by sixty degrees. Referred to as a Trojan asteroid, it will be visited by the Lucy mission in September of 2027.',
      ],
      more: [
        "Polymele is the smallest of Lucy's Trojan targets at 21 km (13 miles) in diameter. It is a P-type asteroid, the same type as the much larger Patroclus and Menoetius binary. This will be the first time a spacecraft has ever flown by this dark, reddish class of asteroid that is believed to be rich in organics. Scientists think that Polymele is a collisional fragment of a larger P-type asteroid, and thus it will be very interesting to compare to its larger brethren. Lucy will fly by on September 15, 2027.",
      ],
    },
    related: [
      "sc_lucy",
      "jupiter",
      "52246_donaldjohanson",
      "3548_eurybates",
      "11351_leucus",
      "21900_orus",
      "617_patroclus",
    ],
    stats: {
      discovery:
        "Discovered in 1999, Polymele is a Trojan Asteroid that will be visited by the Lucy mission in September of 2027.",
      rotation: 5.86,
    },
  },
  "21900_orus": {
    title: "Orus",
    description: {
      blurb: [
        'Orus is an asteroid located in the orbit of Jupiter, always orbiting "ahead" of Jupiter by sixty degrees. Referred to as a Trojan asteroid, It will be visited by the Lucy mission in November of 2028.',
      ],
      more: [
        "The Lucy mission will fly by Orus in November of 2028. Lucy will be able to compare this larger 51 km (31.7 mile) diameter Trojan to both the smaller Leucus, which is of the same type of very dark, very red objects thought to be rich in organics and carbon, and to the similarly-sized, but different spectrally typed, Eurybates.",
      ],
    },
    related: [
      "sc_lucy",
      "55246_donaldjohanson",
      "3548_eurybates",
      "15094_polymele",
      "11351_leucus",
      "617_patroclus",
    ],
    stats: {
      discovery:
        "Discovered in 1999, Orus is a Trojan Asteroid that will be visited by the Lucy mission in November of 2028.",
      rotation: 13.45,
    },
  },
  "3548_eurybates": {
    title: "Eurybates",
    description: {
      blurb: [
        "Eurybates is a carbonaceous asteroid located in the orbit of Jupiter, and is referred to as a Trojan asteroid. Eurybates has a small satellite named Queta, and will be visited by the Lucy mission in August of 2027.",
      ],
      more: [
        "Eurybates is the first Trojan Asteroid that Lucy will visit, in August of 2027. In January of 2019 the Lucy team learned about the satellite Queta, which is likely around 1 km (0.5 miles) in size.",
      ],
    },
    related: [
      "sc_lucy",
      "55246_donaldjohanson",
      "15094_polymele",
      "11351_leucus",
      "21900_orus",
      "617_patroclus",
    ],
    stats: {
      discovery:
        "Discovered in 1973, Eurybates is the first Trojan Asteroid that the Lucy mission will visit in August of 2027. It has a small satellite named Queta.",
      rotation: 8.7,
    },
  },
  "5535_annefrank": {
    title: "Annefrank",
    description: {
      blurb: [
        "Annefrank is a main belt asteroid that was visited by the Stardust mission in November of 2002.",
      ],
      more: [
        "On Nov. 2, 2002, at 04:50 UT, Stardust flew by asteroid 5535 Annefrank at a range of about 1,900 miles (3,078 kilometers). This asteroid was used as a practice run by the Stardust mission for its eventual flyby of the comet Wild 2(81P/Wild). During the encounter, the spacecraft’s dust collectors collected samples while its camera returned 72 images.",
      ],
    },
    related: ["sc_stardust", "81p_wild_2"],
    stats: {
      discovery:
        "Discovered in 1942, the main belt asteroid 5535 Annefrank was used as a practice flyby target by the Stardust mission on November 2nd, 2002.",
      rotation: 15.12,
    },
  },
  "52246_donaldjohanson": {
    title: "Donaldjohanson",
    description: {
      blurb: [
        "Donaldjohanson is a carbonaceous asteroid located in the inner asteroid belt. It will be visited by the Lucy mission in April of 2025.",
      ],
      more: [
        "This object will mostly provide a test rehearsal for all of Lucy's instruments before the spacecraft heads further out towards the Trojan asteroids that share an orbit with Jupiter. The asteroid is named after the paleoanthropologist Donald Johanson, who discovered the famous Lucy fossil in Ethiopia in 1974. Just as the Lucy skeleton taught us how evolution occurred with humans, the Lucy mission will be investigating a different kind of fossil: the Trojan asteroids, which are almost as old as the solar system itself.",
      ],
    },
    related: [
      "sc_lucy",
      "617_patroclus",
      "3548_eurybates",
      "15094_polymele",
      "11351_leucus",
      "21900_orus",
    ],
    stats: {
      discovery:
        'Discovered in 1981, and named after the paleoanthropologist who discovered the "Lucy" fossil, this will be the second small body that the Lucy mission will encounter in 2025.',
      rotation: 252,
    },
  },
  "617_patroclus": {
    title: "Patroclus",
    description: {
      blurb: [
        'Patroclus is a large binary asteroid located in the orbit of Jupiter, always "trailing" the planet by 60 degrees. It is in a binary system with its slightly smaller twin, Menoetius. Referred to as a Trojan asteroid, it will be visited by the Lucy mission in 2033.',
      ],
      more: [
        "This asteroid will be the final encounter of Lucy's primary mission, in March of 2033. After a long journey from the Greek L4 swarm to the Trojan L5 swarm, Lucy will fly by the binary pair of asteroids (617) Patroclus and Menoetius. They are large P-type Trojans, with average diameters of 113 km and 104 km (about 70 and 65 miles), respectively. Scientists hypothesize that they may be primordial asteroids left over from the very early Solar System.",
      ],
    },
    related: [
      "sc_lucy",
      "55246_donaldjohanson",
      "3548_eurybates",
      "15094_polymele",
      "11351_leucus",
      "21900_orus",
      "menoetius",
    ],
    stats: {
      discovery:
        "Discovered in 1906, Patroclus is a Trojan Asteroid that will be visited by the Lucy mission in 2033. In 2001, Patroclus was found to be part of a binary asteroid system with its smaller twin, named Menoetius.",
      rotation: 102.8,
    },
  },
  "951_gaspra": {
    title: "Gaspra",
    description: {
      blurb: [
        "951 Gaspra was the first asteroid ever to be closely approached when it was visited by the Galileo spacecraft, which flew by on its way to Jupiter on 29 October 1991.",
      ],
      more: [
        "Gaspra orbits the Sun at an average distance of about 2.21 astronomical units. Gaspra completes one orbit around the Sun in 3.29 years. Galileo flew by Gaspra on 29 October 1991, passing within 1,600 km (990 mi) at a relative speed of about 8 km/s (18,000 mph). 57 images were returned to Earth, the closest taken from a distance of 5,300 km (3,300 mi). The best images have a resolution of about 54 meters per pixel (177.16 ft). The area around the southern pole was not seen during the flyby, but the remaining 80% of the asteroid was imaged.",
      ],
    },
    related: ["sc_galileo"],
    stats: {
      discovery:
        "Discovered in 1916, Gaspra is the first asteroid to be closely approached by a spacecraft, which was Galileo in 1991.",
      rotation: 7.042,
    },
  },
  "2867_steins": {
    title: "Steins",
    description: {
      blurb: [
        "Steins is an irregular-shaped asteroid that was visited by Europe's Rosetta space probe in 2008.",
      ],
      more: [""],
    },
    related: [],
  },
  ariel: {
    title: "Ariel",
    description: {
      blurb: ["Ariel is a moon of Uranus."],
      more: [
        "All of Uranus' larger moons, including Ariel, are thought to consist mostly of roughly equal amounts of water ice and silicate rock. Carbon dioxide has also been detected on Ariel.",
        "Ariel's surface appears to be the youngest of all the moons of Uranus. It has few large craters and many small ones, indicating that fairly recent low-impact collisions wiped out the large craters that would have been left by much earlier, bigger strikes. Ariel is also thought to have had the most recent geologic activity of Uranus' larger moons. It is transected by grabens, which are fault-bounded valleys.",
        "Ariel has the brightest surface of the five largest Uranian moons, but none of them reflect more than about a third of the sunlight that strikes them. This suggests that their surfaces have been darkened by a carbonaceous material. Ariel's brightness increases dramatically when it is in opposition―that is, when the observer is directly between it and the Sun. This indicates that its surface is porous, casting reflectivity-decreasing shadows when illuminated at other angles.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  "90377_sedna": {
    title: "Sedna",
    description: {
      blurb: [
        "Sedna is a possible dwarf planet well beyond the orbit of Neptune. It has an exceptionally long and elongated orbit, taking approximately 11,400 years to complete.",
      ],
      more: [""],
    },
    related: [],
  },
  "99942_apophis": {
    title: "Apophis",
    description: {
      blurb: [
        "Asteroid 99942 Apophis is a near-Earth asteroid more than 1000 feet (over 300 meters) in size that will harmlessly pass close to Earth on April 13, 2029.",
      ],
      more: [
        "When it was discovered in 2004, the asteroid caused a stir because initial calculations indicated a small possibility it would impact Earth in 2029. After searching through some older astronomical images, scientists ruled out the possibility of a 2029 impact. It’s now predicted the asteroid will safely pass about 19,800 miles (31,900 kilometers) from our planet’s surface. While that’s a safe distance, it’s close enough that the asteroid will come between Earth and our Moon, which is about 238,855 miles (384,400 kilometers) away. It’s also within the distance that some spacecraft orbit Earth.",
      ],
    },
    related: [],
    stats: {
      discovery:
        "Discovered on June 19, 2004 at the Kitt Peak National Observatory in Arizona.",
      rotation: 30.4,
    },
    approach: {
      fact: "On April 13, 2029, the asteroid Apophis will pass less than 23,239 miles (37,399 kilometers) from our planet’s surface – just outside the distance of geosynchronous satellites, and closer to Earth than any similarly sized PHO (potentially hazardous object) in recorded history. At that time, Apophis will be visible to observers on the ground in the Eastern Hemisphere without the aid of a telescope or binoculars.",
    },
  },
  "486958_arrokoth": {
    title: "Arrokoth",
    description: {
      blurb: [
        "The small Kuiper Belt object officially known as Arrokoth is the most distant and most primitive object ever explored by a spacecraft.",
      ],
      more: [
        "Arrokoth is in a region of space beyond Neptune called the Kuiper Belt that is swarming with small, icy and ancient objects. Because they are so far from the Sun, Kuiper Belt objects have only been slightly heated since forming, and are thought to be well-preserved, frozen samples of what the outer solar system was like after its birth more than 4.5 billion years ago.",
        "It was discovered in 2014 by NASA’s New Horizons science team, using the Hubble Space Telescope. New Horizons flew by Arrokoth on Jan. 1, 2019, snapping images that showed a double-lobed object that looked like a partially flattened snowman. It’s also very red — even redder than Pluto. The object's strange shape — unlike any ever seen — was the biggest surprise of the flyby. Arrokoth means means “sky” in the Powhatan/Algonquian language.",
      ],
    },
    related: ["sc_new_horizons"],
  },
  "101955_bennu": {
    title: "Bennu",
    description: {
      blurb: [
        "An ancient relic of our solar system’s early days, Bennu has seen more than 4.5 billion years of history. Scientists think that within 10 million years of our solar system’s formation, Bennu’s present-day composition was already established.",
      ],
      more: [
        "Bennu likely broke off from a much larger carbon-rich asteroid about 700million to 2 billion years ago. It likely formed in the Main Asteroid Belt between Mars and Jupiter, and has drifted much closer to Earth since then. Because its materials are so old, Bennu may contain organic molecules similar to those that could have been involved with the start of life on Earth. NASA’s OSIRIS-REx mission, which launched in 2016, performed the most in-depth exploration of Bennu to date and returned a sample of its material to Earth in 2023. This spacecraft’s data will also help scientists better understand the likelihood of Bennu striking Earth someday.",
      ],
    },
    related: ["sc_osiris_rex"],
    stats: {
      discovery:
        "Discovered in September of 1999, Bennu was the subject of the OSIRIS-REx mission, which touched down on the asteroid and collected a sample of the surface on October 20th, 2020. OSIRIS-REx departed Bennu in 2021, and delivered the capsule with pieces of the asteroid to Earth on September 24, 2023.",
      rotation: 4.296,
    },
    approach: {
      fact: "Bennu is a PHO (potentially hazardous object), and will have multiple close approaches with Earth over time. The next close approach will be in 2023, at a distance of 0.497 AU (astronomical units)",
    },
  },
  "152830_dinkinesh": {
    title: "Dinkinesh",
    description: {
      blurb: [
        "Dinkinesh is a main belt asteroid that was visited by the Lucy mission on November 1st, 2023.",
      ],
      more: [
        "Dinkinesh was discovered in 1999 and is 700 meters (2,300 feet) in diameter. Dinkinesh was Lucy's first and smallest flyby target, and the smallest main-belt asteroid ever visited by a spacecraft. Dinkinesh is the Ethiopian name for the Lucy fossil, for which the Lucy mission is named.",
      ],
    },
    related: [
      "sc_lucy",
      "jupiter",
      "52246_donaldjohanson",
      "3548_eurybates",
      "11351_leucus",
      "21900_orus",
      "617_patroclus",
    ],
    stats: {
      discovery:
        "Discovered in 1999, Dinkinesh will be the Lucy mission's first flyby target in early November of 2023. It will become the smallest main-belt asteroid ever visited.",
    },
  },
  "16_psyche": {
    title: "Psyche",
    description: {
      blurb: [
        "Psyche is one of the largest asteroids in the solar system, and is mostly made of metal.",
      ],
      more: [
        "One of the most intriguing targets in the main asteroid belt, 16 Psyche is a giant metal asteroid, about three times farther away from the sun than is the Earth. Its average diameter is about 140 miles (226 kilometers) — about one-sixteenth the diameter of Earth’s Moon or about the distance between Los Angeles and San Diego. Unlike most other asteroids that are rocky or icy bodies, scientists think the M-type (metallic) asteroid 16 Psyche is comprised mostly of metallic iron and nickel similar to Earth’s core. Scientists wonder whether Psyche could be an exposed core of an early planet, maybe as large as Mars, that lost its rocky outer layers due to a number of violent collisions billions of years ago. This intriguing asteroid is now the primary target of the Psyche mission. The Psyche spacecraft launched on October 13th, 2023, and will arrive at the asteroid in 2029.",
      ],
    },
    related: ["sc_psyche"],
    stats: {
      discovery:
        "Discovered in 1852, the Psyche asteroid is the subject of the upcoming Psyche mission which will launch no earlier than 2023.",
      rotation: 4.196,
    },
  },
  "1_ceres": {
    title: "Ceres",
    description: {
      blurb: [
        "Dwarf planet Ceres is the largest object in the asteroid belt between Mars and Jupiter and the only dwarf planet located in the inner solar system.",
      ],
      more: [
        "Ceres was the first member of the asteroid belt to be discovered when Giuseppe Piazzi spotted it in 1801. And when Dawn arrived in 2015, Ceres became the first dwarf planet to receive a visit from a spacecraft.",
        "Called an asteroid for many years, Ceres is so much bigger and so different from its rocky neighbors that scientists classified it as a dwarf planet in 2006. Even though Ceres comprises 25 percent of the asteroid belt's total mass, tiny Pluto is still 14 times more massive.",
        "Ceres is named for the Roman goddess of corn and harvests. The word cereal comes from the same name.",
      ],
    },
    related: ["sc_dawn"],
    stats: {
      discovery:
        "Discovered in January of 1801, Ceres was the first asteroid ever found, though it was initially classified as a planet. It remained an asteroid until 2006, when it was reclassified as a dwarf planet.",
      rotation: 9.0741,
    },
  },
  "2_pallas": {
    title: "Pallas",
    description: {
      blurb: [
        "2 Pallas is the second asteroid to have been discovered, after 1 Ceres.",
      ],
      more: [
        "Pallas is the third-largest asteroid in the Solar System by both volume and mass, and is a likely remnant protoplanet. At 513 km in diameter, Pallas is slightly smaller than Vesta. The mass of Pallas is 79%±1% that of Vesta, 22% that of Ceres, and a quarter of one percent that of the Moon. Even so, Pallas by itself makes up 7% of the mass of the entire asteroid belt.",
      ],
    },
    related: [],
  },
  "3_juno": {
    title: "Juno",
    description: {
      blurb: [
        "3 Juno is a large asteroid in the asteroid belt, and the third asteroid ever to be discovered.",
      ],
      more: [
        "Juno is one of the larger asteroids, perhaps tenth by size and containing approximately 1% the mass of the entire asteroid belt. Even so, Juno has only 3% the mass of Ceres. Juno was originally considered a planet, along with 1 Ceres, 2 Pallas, and 4 Vesta, but its small size and irregular shape preclude it from being designated a dwarf planet.",
      ],
    },
    related: [],
  },
  "216_kleopatra": {
    title: "Kleopatra",
    description: {
      blurb: [
        "216 Kleopatra is a metallic, ham-bone-shaped asteroid approximately 120 kilometers (75 miles) in diameter.",
      ],
      more: [
        "Kleopatra is a relatively large asteroid, measuring 217 × 94 × 81 km, and has two moons of its own. Calculations from its radar albedo and the orbits of its moons show it to be a rubble pile, a loose amalgam of metal, rock, and 30–50% empty space by volume, likely due to a disruptive impact prior to the impact that created its moons.",
      ],
    },
    related: [],
  },
  "243_ida": {
    title: "Ida",
    description: {
      blurb: [
        "243 Ida is an asteroid in the Koronis family of the asteroid belt, with a mean radius of 15.7 kilometers.",
      ],
      more: [
        "243 Ida is the second asteroid visited by a spacecraft and the first found to have its own moon. Its close encounter happened on Aug. 29, 1993 as Galileo flew by at a distance of about 1,500 miles (about 2,400 kilometers) en route to Jupiter. (The spacecraft flew by another asteroid, Gaspra, on Oct. 29, 1991.) A little more than five months later, scientists studying the images Galileo sent back to Earth noticed that a tiny moon accompanied the asteroid, which was named Dactyl.",
      ],
    },
    related: ["sc_galileo"],
    stats: {
      discovery:
        "Discovered in 1884, Ida was visited by the Galileo spacecraft in August of 1993.",
      rotation: 4.634,
    },
  },
  "1566_icarus": {
    title: "Icarus",
    description: {
      blurb: [
        "1566 Icarus is an extremely eccentric asteroid, approximately 1.4 km (0.87 mi) in diameter.",
      ],
      more: [
        "It is a near-Earth object and potentially hazardous, but has a closest possible intersection with Earth at 13.7 lunar distances, or 13.7 times the distance from the Earth to the moon. In 1968 it became the first asteroid ever observed by radar.",
      ],
    },
    related: [],
  },
  "1620_geographos": {
    title: "Geographos",
    description: {
      blurb: [
        "1620 Geographos is a highly elongated asteroid with a mean-diameter of approximately 2.5 km (1.6 mi).",
      ],
      more: [
        "In 1994, NASA's Goldstone radar telescope in the California desert revealed that asteroid Geographos had the largest length-to-width ratio of any solar system object imaged to date. As a potentially hazardous asteroid, Geographos has a minimum orbital intersection distance with Earth of less than 0.05 AU and a diameter of greater than 150 meters. It is currently 0.0301 AU (4,500,000 km), which translates into 11.7 lunar distances.",
      ],
    },
    related: [],
  },
  "1862_apollo": {
    title: "Apollo",
    description: {
      blurb: [
        "1862 Apollo is a stony asteroid, approximately 1.5 kilometers in diameter.",
      ],
      more: [
        "Apollo is the namesake and the first recognized member of the Apollo asteroids, a subgroup of near-Earth objectss which are Earth-crossers, that is, they cross the orbit of the Earth. 1862 Apollo is a potentially hazardous asteroid  because its minimum orbit intersection distance (MOID) is less than 0.05 AU and its diameter is greater than 150 meters. It can cross Earth's orbit as close as about 10 lunar distances.",
      ],
    },
    related: [],
  },
  "1981_midas": {
    title: "Midas",
    description: {
      blurb: [
        "1981 Midas is an asteroid approximately 2 kilometers in diameter that is classified as a near-Earth object.",
      ],
      more: [
        "Midas has a low minimum orbit intersection distance with Earth of 0.0036 AU (540,000 km; 330,000 mi), which corresponds to 1.5 lunar distance (Earth–Moon distance). However, it does not pose an impact risk for the foreseeable future.",
      ],
    },
    related: [],
  },
  "2063_bacchus": {
    title: "Bacchus",
    description: {
      blurb: [
        "2063 Bacchus is a near-Earth object of the Apollo group, approximately 1 kilometer in diameter.",
      ],
      more: [
        "Bacchus has an Earth minimum orbital intersection distance of 0.0677 AU (10,130,000 km), which corresponds to 26.4 lunar distances. On March 31st, 1996, it passed 0.0677525 AU (10,135,600 km) from Earth.",
      ],
    },
    related: [],
  },
  "2101_adonis": {
    title: "Adonis",
    description: {
      blurb: [
        "2101 Adonis is classified as potentially hazardous asteroid and near-Earth object of the Apollo group, approximately 1 kilometer in diameter.",
      ],
      more: [
        "Its Earth minimum orbit intersection distance is 0.0116 AU (1,740,000 km), or 4.5 lunar distances. It also makes close approaches of Venus and Mars.",
      ],
    },
    related: [],
  },
  "2102_tantalus": {
    title: "Tantalus",
    description: {
      blurb: ["2102 Tantalus is an Apollo asteroid about 2–4 km in diameter."],
      more: [
        "2102 Tantalus is a potentially hazardous asteroid (PHA) because its minimum orbit intersection distance (MOID) is less than 0.05 AU and its diameter is greater than 150 meters. The Earth-MOID is 0.0439 AU (6,570,000 km; 4,080,000 mi), or about 17.2 lunar distances.",
      ],
    },
    related: [],
  },
  "2135_aristaeus": {
    title: "Aristaeus",
    description: {
      blurb: [
        "2135 Aristaeus is an Apollo asteroid discovered on April 17, 1977 at Palomar Observatory. It is named for Aristaeus, the son of Apollo and the nymph Cyrene.",
      ],
      more: [
        "2135 Aristaeus is a potentially hazardous asteroid because its minimum orbit intersection distance is less than 0.05 AU and its diameter is greater than 150 meters. The Earth-MOID is 0.0100 AU (1,500,000 km; 930,000 mi), or about 3.9 lunar distances.",
      ],
    },
    related: [],
  },
  "2340_hathor": {
    title: "Hathor",
    description: {
      blurb: [
        "2340 Hathor is an eccentric stony asteroid, classified as near-Earth object and potentially hazardous asteroid. It belongs to the Aten group of asteroids and measures approximately 210 meters in diameter.",
      ],
      more: [
        "Hathor has an Earth orbit intersection distance of 0.0069 AU (1,030,000 km), which corresponds to 2.7 lunar distances.",
      ],
    },
    related: [],
  },
  "3122_florence": {
    title: "Florence",
    description: {
      blurb: [
        "3122 Florence is an asteroid withi two moons of its own. It is classified as a near-Earth object and potentially hazardous asteroid, measuring approximately 5 kilometers in diameter.",
      ],
      more: [
        "On September 1st, 2017, Florence passed 0.047237 AU (7,066,600 km; 4,391,000 mi) from Earth, approximately eighteen times the average distance of the Moon. As seen from Earth, it brightened to apparent magnitude 8.5, and was visible in small telescopes for several nights as it moved south to north through the constellations Piscis Austrinus, Capricornus, Aquarius, and Delphinus. This was the asteroid's closest approach since 1890 and the closest until after 2500. The asteroid is named after Florence Nightingale, the founder of modern nursing.",
      ],
    },
    related: [],
  },
  "3200_phaethon": {
    title: "Phaethon",
    description: {
      blurb: [
        "3200 Phaethon is an active Apollo asteroid with an orbit that brings it closer to the Sun than any other named asteroid. It is also the parent body of the Geminids meteor shower in mid-December.",
      ],
      more: [
        "The Earth minimum orbit intersection distance (E-MOID) is 0.01945 AU (2,910,000 km; 1,808,000 mi, about 7.5 lunar distances), which is defined by the shortest distance between the orbit of Phaethon and the orbit of Earth. With a 30+ year observation arc, the orbit of Phaethon is very well understood with very small uncertainties. Close approaches of Phaethon are well constrained for the next 400 years.",
      ],
    },
    related: [],
  },
  "3362_khufu": {
    title: "Khufu",
    description: {
      blurb: ["3362 Khufu is a near-Earth asteroid discovered in 1984."],
      more: [
        "3362 Khufu is a potentially hazardous asteroid because its minimum orbit intersection distance (MOID) is less than 0.05 AU and its diameter is greater than 150 meters. The Earth-MOID is 0.0135 AU (2,020,000 km; 1,250,000 mi, or about 5.23 lunar distances). Its orbit is well-determined for the next several hundred years.",
      ],
    },
    related: [],
  },
  "4015_wilson-harrington": {
    title: "Wilson-Harrington",
    description: {
      blurb: [
        "4015 Wilson–Harrington is an active asteroid known both as comet 107P/Wilson–Harrington and as asteroid 4015 Wilson–Harrington.",
      ],
      more: [
        "This near-Earth object is considered both an Apollo asteroid with the designation 4015 Wilson–Harrington and a periodic comet known as Comet Wilson–Harrington or 107P/Wilson–Harrington. It was initially discovered in 1949 as a comet and then lost to further observations. Thirty years later it was rediscovered as an asteroid, after which it took over a decade to determine that these observations were of the same object. Therefore, it has both a comet designation and an asteroid designation, and with a name length of 17 characters it is currently the asteroid with the longest name, having one more character than the 16-character limit imposed by the IAU.",
      ],
    },
    related: [],
  },
  "4179_toutatis": {
    title: "Toutatis",
    description: {
      blurb: [
        "4179 Toutatis is an elongated asteroid and slow rotator, classified as near-Earth object and potentially hazardous asteroid of the Apollo and Alinda group, approximately 2.5 kilometers in diameter.",
      ],
      more: [
        "Toutatis is not a monolith, but most likely a coalescence of shattered fragments. This bifurcated asteroid is shown to be mainly consisting of a head (small lobe) and a body (large lobe).The Chinese lunar probe Chang'e 2 departed from the Sun–Earth L2 point in April of 2012and made a flyby of Toutatis on December 13th, 2012, with the closest approach being 3.2 kilometers and a relative velocity of 10.73 km/s, exactly when Toutatis was near its closest approach to Earth. It took several pictures of the asteroid, revealing it to be a dusty red/orange color.",
      ],
    },
    related: [],
  },
  "4183_cuno": {
    title: "Cuno",
    description: {
      blurb: [
        "4183 Cuno is an eccentric, rare-type asteroid, classified as near-Earth object, roughly 4 kilometers in diameter.",
      ],
      more: [
        "The asteroid has an Earth minimum orbital intersection distance of 0.0283 AU (4,230,000 km), which translates into 11 lunar distances. Cuno approaches the Earth to within 40 million kilometers six times in the 21st century. On May 20th, 2012, it made its closest Earth approach at a distance of 0.122 AU (18,000,000 km). It will not make a closer approach until 2093 when it will pass Earth at 0.084 AU (13,000,000 km).",
      ],
    },
    related: [],
  },
  "4450_pan": {
    title: "Pan",
    description: {
      blurb: [
        "4450 Pan is a highly eccentric asteroid classified as a near-Earth object of the Apollo group, approximately 1.1 kilometers in diameter.",
      ],
      more: [
        "As an Apollo asteroid, it is an Earth-crosser and has a minimum orbit intersection distance with Earth of 0.0287 AU (4,290,000 km), which corresponds to 11.2 lunar distances. Due to its extremely eccentric orbit, it is also a Venus- and Mars-crosser and approaches Mercury as well.",
      ],
    },
    related: [],
  },
  "4486_mithra": {
    title: "Mithra",
    description: {
      blurb: [
        "4486 Mithra is an eccentric asteroid , classified as near-Earth object approximately 2 kilometers in diameter.",
      ],
      more: [
        "As a potentially hazardous asteroid, it has a low minimum orbit intersection distance with Earth of 0.0463 AU (6,930,000 km) or 18 lunar distances. On 14 August 2000, it passed 0.0465 AU (6,960,000 km) from Earth.",
      ],
    },
    related: [],
  },
  "4769_castalia": {
    title: "Castalia",
    description: {
      blurb: [
        "4769 Castalia is a near-Earth object and potentially hazardous asteroid of the Apollo group, approximately 1.4 kilometers (0.87 miles) in diameter and was the first asteroid to be modeled by radar imaging.",
      ],
      more: [
        "Castalia has a peanut shape, suggesting two approximately 800-meter-diameter pieces held together by their weak mutual gravity. Castalia is a potentially hazardous asteroid because its minimum orbit intersection distance (MOID) is less than 0.05 AU and its diameter is greater than 150 meters. The Earth-MOID is 0.0204 AU (3,050,000 km; 1,900,000 miles, or about 8 lunar distances). Its orbit is well-determined for the next several hundred years.",
      ],
    },
    related: [],
  },
  "5011_ptah": {
    title: "Ptah",
    description: {
      blurb: [
        "5011 Ptah is a near-Earth object and potentially hazardous asteroid of the Apollo group. It has an eccentric oribt measures approximately 1.6 kilometers (1 mile) in diameter.",
      ],
      more: [
        "The potentially hazardous asteroid has a minimum orbit intersection distance with Earth of 0.0256 AU (3,830,000 km) or 10 lunar distances. It passes within that distance of Earth 15 times between 1900 and 2100, most recently on 21 January 2007, at 29.6 million kilometers.",
      ],
    },
    related: [],
  },
  "6239_minos": {
    title: "Minos",
    description: {
      blurb: [
        "6239 Minos is an asteroid that is classified as a near-Earth object.",
      ],
      more: [
        "Approximately half kilometer in length and with a rotation period of 3.6 hours, Minos was discovered in 1989 by astronomers Carolyn and Eugene Shoemaker at Palomar Observatory in California.",
      ],
    },
    related: [],
  },
  "6489_golevka": {
    title: "Golevka",
    description: {
      blurb: [
        "6489 Golevka is a small Apollo-class asteroid discovered in 1991.",
      ],
      more: [
        "Its name has a complicated origin. In 1995, Golevka was studied simultaneously by three radar observatories across the world: Goldstone in California, Yevpatoria RT-70 radio telescope in Ukraine (Yevpatoria is sometimes romanized as Evpatoria) and Kashima in Japan. 'Golevka' comes from the first few letters of each observatory's name.",
      ],
    },
    related: [],
  },
  "9969_braille": {
    title: "Braille",
    description: {
      blurb: [
        "9969 Braille is an eccentric, rare-type and elongated asteroid from the innermost regions of the asteroid belt, classified as Mars-crosser and slow rotator, approximately 1–2 kilometers in diameter.",
      ],
      more: [
        "It was discovered in 1992 by astronomers at Palomar Observatory and later named after Louis Braille, the inventor of the writing system for the blind. It was photographed in closeup by the spacecraft Deep Space 1 in 1999, but a malfunction resulted in indistinct images.",
      ],
    },
    related: ["sc_deep_space_1"],
    stats: {
      discovery:
        "Discovered in 1992, Braille was visited by the Deep Space 1 mission on July 29th, 1999. The spacecraft passed within 26 km (16 miles) of the asteroid, which was the closest asteroid flyby ever at that time.",
      rotation: 226.4,
    },
  },
  "12923_zephyr": {
    title: "Zephyr",
    description: {
      blurb: [
        "12923 Zephyr is a stony asteroid, classified as potentially hazardous asteroid and near-Earth object of the Apollo group, approximately 2 kilometers (1.2 miles) in diameter.",
      ],
      more: [
        "Zephyr was discovered in 1999 by the Lowell Observatory Near-Earth Object Search at the Anderson Mesa Station in Arizona. The word zephyr derives from the name of the ancient Greek god of the west wind, Zephyros. This near-Earth asteroid has an Earth minimum orbital intersection distance of 3,160,000 km, which corresponds to 8.2 lunar distances. This short distance as well as its sufficiently large size makes it a potentially hazardous asteroid. On September 2010, the asteroid approached Earth at 38,100,000 km; it will make close encounters with Earth again in 2021, 2032 and 2043.",
      ],
    },
    related: [],
  },
  "14827_hypnos": {
    title: "Hypnos",
    description: {
      blurb: [
        "14827 Hypnos is a highly eccentric, sub-kilometer-sized carbonaceous asteroid that is thought to be an extinct comet.",
      ],
      more: [
        "Discovered in 1986, Hypnos is classified as a near-Earth object that can potentially approach Earth as close as 5.7 lunar distances.",
      ],
    },
    related: [],
  },
  "25143_itokawa": {
    title: "Itokawa",
    description: {
      blurb: [
        "25143 Itokawa is a sub-kilometer near-Earth object, and is the first asteroid from which samples were retrieved and brought to Earth.",
      ],
      more: [
        "The asteroid 25143 Itokawa was discovered on Sept. 26, 1998, by the Lincoln Laboratory Near-Earth Asteroid Research Team at Socorro, New Mexico. The Japanese spacecraft Hayabusa (Japanese for falcon) touched down twice on the asteroid and collected a small amount of dust despite the failure of the mechanism designed for the purpose. It delivered the sample to Earth on the 13th of June, 2010. tokawa belongs to the Apollo asteroids, which are Earth-crossing asteroids and the largest dynamical group of near-Earth objects with nearly 10,000 known members. Itokawa orbits the Sun at a distance of 0.95–1.70 AU once every 18 months, and can pass by Earth as close as 5.1 lunar distances (the distance from the Earth to the moon).",
      ],
    },
    stats: {
      discovery:
        "Discovered in 1998, Itokawa was the first asteroid to be the target of a sample return mission. The Japanese space probe Hayabusa took a sample from the comet in November of 2005.",
      rotation: 12.132,
    },
    approach: {
      fact: "Itokawa is classified as a PHO (potentially hazardous object), and will next approach the Earth on March 6th, 2030, at a distance of 0.376 AU (astronomical units).",
    },
  },
  "37655_illapa": {
    title: "Illapa",
    description: {
      blurb: [
        "37655 Illapa is a carbonaceous asteroid, classified as a near-Earth object and iapproximately 1.5 kilometers in diameter.",
      ],
      more: [
        "Discovered in 1994, Illapa has a short rotation period of 2.6556 hours. On 16 August 2003, Illapa made a close approach to Earth of 0.025037 AU (3,750,000 km; 2,330,000 mi, or about 10 lunar distances).",
      ],
    },
    related: [],
  },
  "65803_didymos": {
    title: "Didymos",
    description: {
      blurb: [
        "65803 Didymos is a sub-kilometer asteroid classified as both a potentially hazardous asteroid and a near-Earth object of both the Apollo and Amor group.",
      ],
      more: [
        'The asteroid was discovered in 1996, by the Spacewatch survey at Kitt Peak, and its small 160-metre minor-planet moon was discovered in 2003, named Dimorphos. Due to its binary nature, it was then named "Didymos", the Greek word for twin. The Didymos binary system was the target of the DART mission, which was designed to impact with Dimorphos. The collision occurred on September 26th, 2022, and was a resounding success, changing the orbital period of the smaller moon by approximately thirty minutes.',
      ],
    },
    related: ["sc_dart"],
    stats: {
      discovery:
        "Discovered in 1996, Didymos is part of a binary asteroid system with its smaller partner, Dimorphos. The DART mission targeted this system, successfully crashing a probe into Dimorphos on September 26th, 2022.",
      rotation: 2.2593,
    },
    approach: {
      fact: "Didymos is a PHO (potentially hazardous object), and approached Earth at a distance of 0.07123 AU (astronomical units) on October 4th, 2022.",
    },
  },
  "69230_hermes": {
    title: "Hermes",
    description: {
      blurb: [
        "69230 Hermes is a sub-kilometer sized asteroid and binary system, classified as a potentially hazardous asteroid and near-Earth object. It passed Earth at approximately twice the distance of the Moon on October 30th, 1937.",
      ],
      more: [
        "The asteroid has an Earth minimum orbital intersection distance of 0.0041 AU (610,000 km) which translates into 1.6 lunar distances. In retrospect it turned out that Hermes came even closer to the Earth in 1942 than in 1937, within 1.7 lunar distances; the second pass was unobserved due to the events of World War 2. It was originally lost after its discovery in 1937, but was discovered again in 2003. Radar observations in October and November 2003 showed Hermes to be a binary asteroid. The primary and secondary components have nearly identical radii of 315 m (1,033 ft) and 280 m (920 ft), respectively, and their orbital separation is only 1,200 metres.",
      ],
    },
    related: [],
  },
  "136199_eris": {
    title: "Eris",
    description: {
      blurb: [
        "Eris is one of the largest known dwarf planets in our solar system. It's about the same size as Pluto, but is three times farther from the Sun.",
      ],
      more: [
        "Eris first appeared to be larger than Pluto. This triggered a debate in the scientific community that led to the International Astronomical Union's decision in 2006 to clarify the definition of a planet. Pluto, Eris and other similar objects are now classified as dwarf planets.",
        "Originally designated 2003 UB313 (and nicknamed for the television warrior Xena by its discovery team), Eris is named for the ancient Greek goddess of discord and strife. The name fits since Eris remains at the center of a scientific debate about the definition of a planet.",
      ],
    },
    related: [],
  },
  "136108_haumea": {
    title: "Haumea",
    description: {
      blurb: [
        "Located in the Kuiper Belt beyond Neptune’s orbit, the dwarf planet Haumea is an oval-shaped object about the same size as Pluto.",
      ],
      more: [
        "Haumea is an oval-shaped object with a radius of about 385 miles. It has two moons, Namaka and Hi’iaka. Aday on Haumea lasts only four Earth hours, making it one of the fastest rotating large objects in our solar system.",
      ],
    },
    related: [],
  },
  "136472_makemake": {
    title: "Makemake",
    description: {
      blurb: [
        "Along with fellow dwarf planets Pluto, Eris and Haumea, Makemake is located in the Kuiper Belt, a region outside the orbit of Neptune.",
      ],
      more: [
        "Slightly smaller than Pluto, Makemake is the second-brightest object in the Kuiper Belt as seen from Earth (while Pluto is the brightest). It takes about 305 Earth years for this dwarf planet to make one trip around the sun.",
        "Makemake holds an important place in the history of solar system studies because it—along with Eris—was one of the objects whose discovery prompted the International Astronomical Union to reconsider the definition of a planet and to create the new group of dwarf planets.",
        "Makemake was named after the Rapanui god of fertility.",
      ],
    },
    related: [],
  },
  "162173_ryugu": {
    title: "Ryugu",
    description: {
      blurb: [
        "Ryugu is an asteroid whose orbit could bring it very near to Earth. It was visited by the Hayabusa2 mission in 2018, where it sampled the surface and returned the asteroid material to Earth in December of 2020.",
      ],
      more: [
        "Ryugu measures approximately 1 kilometre (0.62 mi) in diameter and orbits the earth every 1.3 years. The Japanese space agency JAXA launched the Hayabusa2 mission to Ryugu in 2014, and arrived in 2018. The spacecraft spent a year and a half in orbit around the asteroid before returning to Earth to drop off samples of the surface. The spacecraft had multiple objects land on the asteroid and collect data, including two small rovers. The samples of the surface were returned to Earth in December of 2020.",
      ],
    },
    related: [],
    stats: {
      discovery:
        "Discovered in 1999, Ryugu was the target of the Hayabusa2 mission, which orbited the asteroid for a year and a half, landed small rovers on it, and collected samples that were returned to Earth in December of 2020.",
      rotation: 7.63,
    },
    approach: {
      fact: "Ryugu is a PHO (potentially hazardous object), and will next approach Earth at a distance of 0.373 AU (astronomical units)s on June 3rd, 2025.",
    },
  },
  "4_vesta": {
    title: "Vesta",
    description: {
      blurb: [
        "Vesta is one of the largest objects in the asteroid belt, and was visited for over a year by NASA's Dawn Spacecraft.",
      ],
      more: [
        "The asteroid's official name is 4 Vesta because it was the fourth asteroid discovered. About the length of Arizona, it appears to have a surface of basaltic rock - frozen lava - which oozed out of the asteroid's presumably hot interior shortly after its formation 4.5 billion years ago, and has remained largely intact ever since. Telescopic observations reveal mineralogical variations across its surface.",
        "Vesta has a unique surface feature which scientists look forward to peering into. At the asteroid's south pole is a giant crater - 460 kilometers (285 miles) across and 13 kilometers (8 miles) deep. The massive collision that created this crater gouged out one percent of the asteroid's volume, blasting over one-half million cubic miles of rock into space. What happened to the one percent that was propelled from its Vesta home? The debris, ranging in size from sand and gravel to boulder and mountain, was ejected into space where it began its own journey through the solar system. Scientist believe that about 5 percent of all meteorites we find on Earth are a result of this single ancient crash in deep space.",
      ],
    },
    related: ["sc_dawn"],
    stats: {
      discovery:
        "One of the largest and earliest known asteroids, Vesta was discovered on March 29th, 1807, and was visited by the Dawn mission in 2011.",
      rotation: 5.342,
    },
  },
  "433_eros": {
    title: "Eros",
    description: {
      blurb: [
        "Eros is famous as the first asteroid to be orbited by a spacecraft, and as the first one on which a spacecraft landed.",
      ],
      more: [
        "The NEAR spacecraft first flew by Eros on Dec. 23, 1998 at a distance of about 2,400 miles (about 3,800 kilometers) and found that the asteroid was smaller than expected and had two medium-sized craters, a long surface ridge and a density similar to that of Earth's crust. Afterseveral trajectory adjustments, NEAR finally moved into orbit around Eros on Valentine's Day (befitting an asteroid named for the Greek god of love), Feb. 14, 2000.",
        'After nearly a year in orbit, during which time the spacecraft was renamed "NEAR Shoemaker" in honor of astrogeology pioneer Eugene Shoemaker, the mission carried out humanity\'s first asteroid landing on Feb. 12, 2001. Eros was 196 million miles (315 million kilometers) from Earth at the time.',
      ],
    },
    related: ["sc_near_shoemaker"],
    stats: {
      discovery:
        "Discovered on August 13th, 1898, Eros was the first near-Earth Object (NEO (near earth object)) ever found, and the first asteroid ever orbited by a spacecraft, NEAR-Shoemaker.",
      rotation: 5.27,
    },
    approach: {
      fact: "Eros will approach Earth within 0.39765 AU (astronomical units) on November 30th, 2025.",
    },
  },
  callisto: {
    title: "Callisto",
    description: {
      blurb: [
        "Callisto is Jupiter’s second largest moon and the third largest moon in our solar system.",
      ],
      more: [
        "Callisto is about the same size as Mercury. In the past, some scientists thought of Callisto as a boring “ugly duckling moon” and a “hunk of rock and ice.” That’s because the crater-covered world didn’t seem to have much going on—no active volcanoes or shifting tectonic plates. But data from NASA’s Galileo spacecraft in the 1990s revealed Callisto may have a secret: a salty ocean beneath its surface. That finding put the once seemingly dead moon on the list of worlds that could possibly harbor life.",
      ],
    },
    related: ["sc_voyager_1", "sc_voyager_2", "sc_galileo", "sc_cassini"],
  },
  sc_chandra: {
    title: "Chandra X-ray Observatory",
    description: {
      blurb: [
        "Chandra allows scientists from around the world to obtain X-ray images of exotic environments to help understand the structure and evolution of the universe.",
      ],
      more: [
        'The Chandra X-ray Observatory is part of NASA\'s ﬂeet of "Great Observatories" along with the Hubble Space Telescope, Spitizer Space Telescope and the now deorbited Compton Gamma Ray Observatory.',
        "The Chandra X-ray Observatory, which was launched by Space Shuttle Columbia in 1999, can better define the hot, turbulent regions of space. This increased clarity can help scientists answer fundamental questions about the origin, evolution, and destiny of the universe.",
      ],
    },
    dates: {
      start: "1999-07-23T04:30:59.984",
      end: "2014-01-09T07:35:59.984", // Coercing chandra to load; not actual end date
      landing: "",
      highlight: "2014-01-09T07:35:59.984",
    },
    parent: "earth",
    related: ["sc_hubble_space_telescope", "sc_spitzer"],
  },
  charon: {
    title: "Charon",
    description: {
      blurb: [
        "At half the size of Pluto, Charon is the largest of Pluto's moons and the largest known satellite relative to its parent body.",
      ],
      more: [
        "The little moon is so big that Pluto and Charon are sometimes referred to as a double dwarf planet system. The distance between them is 19,640 km (12,200 miles). Pluto-Charon is our solar system's only known double planetary system. The same surfaces of Charon and Pluto always face each other, a phenomenon called mutual tidal locking. Charon orbits Pluto every 6.4 Earth days.",
      ],
    },
    related: ["sc_new_horizons"],
  },
  "67p_churyumov_gerasimenko": {
    title: "Churyumov Gerasimenko",
    description: {
      blurb: [
        "Comet 67P/ Churyumov-Gerasimenko made history as the first comet to be orbited and landed upon by robots from Earth.",
      ],
      more: [
        "Churyumov-Gerasimenko loops around the Sun in an orbit that crosses those of Jupiter and Mars, approaching but not reaching Earth's orbit. Like most Jupiter Family comets, it is thought to have fallen from the Kuiper Belt, a region beyond Neptune's orbit, as a result of one or more collisions or gravitational tugs. The Rosetta spacecraft, carrying the Philae lander, rendezvoused with this comet in August 2014 and to escorted it on its journey to the inner solar system and back out again. Rosetta is a mission of the European Space Agency (ESA) for which NASA is providing key instruments and support.",
      ],
    },
    related: ["sc_rosetta"],
    stats: {
      discovery:
        "Discovered in 1969, this comet was the first to be landed upon by a robotic mission from Earth, the European Space Agency's Rosetta mission. The Philae lander touched down in November of 2014.",
      rotation: 12.76,
    },
    approach: {
      fact: "The comet approached Earth within 0.418 AU (astronomical units) on November 12th, 2021, and then will approach again in November of 2034 at a distance of 0.4523 AU (astronomical units).",
    },
  },
  "1p_halley": {
    title: "P/Halley",
    description: {
      blurb: [
        "Halley's Comet or Comet Halley, officially designated 1P/Halley, is a short-period comet visible from Earth every 75–76 years. Halley is the only known short-period comet that is regularly visible to the naked eye from Earth, and the only naked-eye comet that can appear twice in a human lifetime.",
      ],
      more: [
        "Halley's dimensions are about 9.3 by 5 miles (15 kilometers by 8 kilometers). It is one of the darkest, or least reflective, objects in the solar system. It has an albedo of 0.03, which means that it reflects only 3% of the light that falls on it. In 1986, an international fleet spacecraft met the comet for an unprecedented study from a variety of vantage points. The science fleet included Japan's Suisei and Sakigake spacecraft, the Soviet Union's Vega 1 and Vega 2,the international ISEE-3 (ICE) spacecraft and the European Space Agency's Giotto. NASA's Pioneer 7 and Pioneer 12 also contributed the the bounty of science data collected.",
      ],
    },
    related: [],
  },
  "103p_hartley_2": {
    title: "Hartley 2",
    description: {
      blurb: [
        "Comet Hartley 2 is a small, oval-shaped comet -- its nucleus measures approximately one mile (1.6 kilometers) in diameter. It takes Hartley 2 about 6.47 years to orbit the Sun once.n  It was visited by NASA's Deep Impact (EPOXI) mission in 2010.",
      ],
      more: [
        "Comet 103P/Hartley 2 was discovered by Malcolm Hartley in 1986 at the Siding Springs Observatory in Australia. The Deep Impact spacecraft flew past Hartley 2 in its extended mission called EPOXI in November 2010.",
        "During the spacecraft's flyby of the comet - with closest approach of 694 kilometers - carbon-dioxide-driven jets were seen at the ends of the comet, with most occurring at the small end. In the middle region, or waist of the comet, water was released as vapor with very little carbon dioxide or ice. The latter findings indicate that material in the waist likely came off the ends of the comet and was redeposited.",
      ],
    },
    related: ["sc_deep_impact"],
    stats: {
      discovery:
        "Discovered in 1986, Comet Hartley 2 was the target of the Deep Impact/EPOXI mission, which flew by in November of 2010.",
      rotation: 18.1,
    },
    approach: {
      fact: "103p/Hartley 2 is classified as an NEO (near earth object), and will approach Earth within 0.3826 AU (astronomical units) on September 26th, 2023.",
    },
  },
  "1i_oumuamua": {
    title: "Oumuamua",
    description: {
      blurb: [
        "ʻOumuamua is the first known interstellar object detected passing through the Solar System.",
      ],
      more: [
        "The first confirmed object from another star to visit our solar system, this interstellar interloper appears to be a rocky, cigar-shaped object with a somewhat reddish hue. The object, named ‘Oumuamua by its discoverers, is up to one-quarter mile (400 meters) long and highly-elongated—perhaps 10 times as long as it is wide. That aspect ratio is greater than that of any asteroid or comet observed in our solar system to date. Its elongated shape is quite surprising, and unlike objects seen in our solar system, it may provide new clues into how other solar systems formed. The observations suggest this unusual object had been wandering through the Milky Way, unattached to any star system, for hundreds of millions of years before its chance encounter with our star system.",
      ],
    },
    related: [],
  },
  "9p_tempel_1": {
    title: "Tempel 1",
    description: {
      blurb: [
        "Comet 9P/Tempel 1 orbits the sun within the asteroid belt, which lies between the orbits of Mars and Jupiter. Tempel 1 last reached perihelion (closest approach to the sun) in 2016.",
      ],
      more: [
        "Two missions have encountered this comet: Deep Impact in 2005 and Stardust NExT in in 2011. Deep Impact sent an impactor into Tempel 1, becoming the first spacecraft to eject material from the surface of a comet. Changes in the surface of Tempel 1 were obscured by all the material ejected during and after the collision.",
      ],
    },
    related: ["sc_deep_impact", "sc_deep_impact_impactor", "sc_stardust"],
    stats: {
      discovery:
        "Discovered in 1867, comet Tempel 1 was the target of the Deep Impact mission, which physically collided with the comet on July 4th, 2005.",
      rotation: 40.7,
    },
  },
  "19p_borrelly": {
    title: "Borrelly",
    description: {
      blurb: [
        "19P/Borrelly is a periodic comet, which was visited by the spacecraft Deep Space 1 in 2001.",
      ],
      more: [
        'With a shape resembling a chicken leg, the nucleus of comet 19P/Borrelly is approximately 5 miles (8 kilometers) long. The nucleus is inside a much larger cloud of gas and dust known as the "coma." Borrelly follows an elliptical orbit around the Sun, looping from inside the orbit of Mars to outside the orbit of Jupiter and back again. It is a "Jupiter-family comet," with an orbit period of less than 20 years and one ds1that has been significantly modified by the gravity of the gas giant planet through close passages. It takes 6.9 years for Borrelly to orbit the Sun once. The comet last reached perihelion (closest approach to the Sun) in 2015.',
        "Deep Space 1 encountered comet Borrelly on Sept. 22, 2001. Flying by a speed of 10.3 miles (16.6 kilometers) per second (more than 37,000 mph, or almost 60,000 kph), Deep Space 1 traveled just 1,349 miles (2,171 kilometers) from Borrelly's nucleus. This spacecraft captured the best pictures of any comet's nucleus at the time and collected other valuable scientific data as well.",
      ],
    },
    related: ["sc_deep_space_1"],
    stats: {
      discovery:
        "Discovered in 1904, comet Borrelly was the target of the Deep Space 1 mission, which flew by in September of 2001.",
    },
  },
  "81p_wild_2": {
    title: "Wild 2",
    description: {
      blurb: [
        "81P/Wild (Wild 2) (Wild is pronounced vilt) is a small comet with the shape of a flattened sphere. NASA made use of this special comet, when in 2004 it sent the Stardust mission to fly by it and gather particles.",
      ],
      more: [
        "Comet 81P/Wild-2 is a fresh periodic comet. Until September 10, 1974, when it passed within 0.006 AU of Jupiter, its orbit lay between Jupiter and a point near Uranus. That encounter with Jupiter, at only 10 times the distance which fragmented P/Shoemaker-Levy 9 in 1994, brought it into the inner solar system, where its perihelion now lies just beyond the distance of Mars and its aphelion near Jupiter.",
      ],
    },
    related: ["sc_stardust"],
    stats: {
      discovery:
        "This comet was discovered on January 6th, 1978, and was visited by the Stardust mission in January of 2004.",
    },
  },
  adrastea: {
    title: "Adrastea",
    description: {
      blurb: [
        "Adrastea was discovered in July 1979 by the Voyager science team.",
      ],
      more: [
        "Orbiting within Io's orbit, which is the innermost of the four largest moons of Jupiter (called the Galilean moons), are four smaller moons named Metis, Adrastea, Amalthea, and Thebe.",
        "All the moons within this grouping are oddly shaped, lacking either the mass and/or fluidity of composition to pull themselves into a reasonably spherical shape. The Galileo spacecraft has revealed some surface features, including impact craters, hills and valleys.",
        "Adrastea is the smallest within this group having a mean radius of about 8.2 &#177; 2.0 km. Adrastea orbits 129,000 km from its parent planet Jupiter and it takes 0.298 Earth days for Adrastea to complete one orbit. We do not know the rotational period for Adrastea, but its orbital period is 7 hours.",
        "Since Io orbits about 422,000 km above Jupiter and, at this close distance, is subjected to extreme tidal flexing from Jupiter's gravity, one would imagine that this even closer satellite would be pulled to pieces. However, because it is so small Adrastea is relatively immune to the effects of tidal forces. Adrastea is one of the two closest moons (the other is Metis) that orbit inside what is called the synchronous orbit radius of Jupiter. That is, Adrastea orbits Jupiter faster than Jupiter rotates on its axis. At this distance, Adrastea's orbit will eventually decay and it will fall into the planet.",
        "Adrastea and Metis also orbit inside Jupiter's main ring and are undoubtedly the source of the material for this ring. Amalthea and Thebe provide the material for the Gossamer ring.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  aegaeon: {
    title: "Aegaeon",
    description: {
      blurb: [
        "Aegaeon is the smallest known moon of Saturn and scientists imaged it on Aug. 15, 2008, and then confirmed its presence by finding it in two earlier images.",
      ],
      more: [
        "The moonlet is too small to be resolved by Cassini's cameras, so its size cannot be measured directly. However, Cassini scientists estimated the moonlet's size by comparing its brightness to another small Saturnian moon, Pallene. It has also been found that the moonlet's orbit is being disturbed by the larger, nearby moon Mimas, which is responsible for keeping the ring arc together. Aegaeon is embedded within a partial ring, or ring arc, previously found by Cassini, the G ring. Debris knocked off the moon forms a bright arc near the inner edge, which in turn spreads to form the rest of the ring. Based on its interaction with the dust particles that make up the G ring arc Aegaeon is embedded in, this small moon most likely has a density around half that of water ice. But unlike ice, Aegaeon is very dark. It's the least reflective of any Saturnian moon inward of Titan. Originally designated S/2008 S1, Aegaeon is named for a fierce giant with many heads and arms who helped conquer the Titans.",
      ],
    },
    related: ["sc_cassini"],
  },
  aegir: {
    title: "Aegir",
    description: {
      blurb: [
        "Aegir was discovered on Dec. 12, 2004 (one of 12 Saturnian moons found that day) using a wide-field camera on Mauna Kea, Hawaii.",
      ],
      more: [
        "Aegir has a mean radius of 1.9 miles (3 km), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 167 degrees and an eccentricity of 0.25. At a mean distance of 12.9 million miles (20.7 million km) from Saturn, the moon takes about 1,118 Earth days to complete one orbit. Aegir is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn—traveling around in the opposite direction from the planet's rotation. Aegir and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Aegir is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2004 S10, Aegir was named for a giant in Norse mythology who personified the ocean.",
      ],
    },
    related: [],
  },
  aitne: {
    title: "Aitne",
    description: {
      blurb: [
        "Aitne was discovered on December 9, 2001 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Aitne is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99% of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color -- light red -- except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. Originally called S/2001 J11, Aitne was named for a Sicilian nymph said to have been raped by the Roman god Jupiter, while he was in the form of a vulture.",
      ],
    },
    related: [],
  },
  albiorix: {
    title: "Albiorix",
    description: {
      blurb: [
        "Albiorix was discovered on Nov. 9, 2000 on Mt. Hopkins, near Amado, Ariz.",
      ],
      more: [
        "Albiorix is one of the four known members of the Gallic group of moons. These moons have prograde orbits (they travel around Saturn in the same direction as the planet's rotation), but their egg-shaped, angled orbits classify them as \"irregular\" moons. Like Saturn's other irregular moons, they are thought to be objects that were captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet, as the regular moons are thought to have done. The other members of this group are Bebhionn, Erriapus, and Tarvos. Observations by Tommy Grav and James Bauer using telescopes on Mauna Kea, Hawaii in 2006 found that the color of Albiorix varies over its surface. They hypothesize that Tarvos and Erriapus, which were both seen to be light red, are the largest fragments from an impact on Albiorix, leaving a less-red crater (these observations did not include Bebhionn). Originally called S/2000 S11, Albiorix was named for a Gallic deity who may have been equivalent to the Roman god Mars.",
      ],
    },
    related: [],
  },
  amalthea: {
    title: "Amalthea",
    description: {
      blurb: [
        "Amalthea was discovered Sept. 9, 1892 by Edward Emerson Barnard.",
      ],
      more: [
        "Orbiting within Io's orbit, which is the innermost of the four largest moons of Jupiter (called the Galilean moons), are four smaller moons named Metis, Adrastea, Amalthea, and Thebe.",
        "All the moons within this grouping are oddly shaped, lacking either the mass and/or fluidity of composition to pull themselves into a reasonably spherical shape. The Galileo spacecraft has revealed some surface features, including impact craters, hills and valleys.",
        "Amalthea is the largest within this grouping with a mean radius of about 83.5 &#177; 2.4 km. Amalthea orbits 181,400 km from its parent planet Jupiter. Amalthea takes 0.498 Earth days to complete one orbit.",
        "Amalthea is the reddest object in the solar system and it appears to give out more heat than it receives from the sun. This may be because, as it orbits within Jupiter's powerful magnetic field, electric currents are included in the moon's core. Alternatively, the heat could be from tidal stresses.",
        "Amalthea and Thebe rotate on their axes once for each orbit around Jupiter, always keeping the same side facing the planet. This orbit takes about one-half an Earth day for Amalthea and two-thirds an Earth day for Thebe.",
        "Amalthea and the moon Thebe provide the material for the Gossamer ring.",
        "Since Io orbits about 422,000 km above Jupiter and, at this close distance, is subjected to extreme tidal flexing from Jupiter's gravity, one would imagine that this even closer satellite would be pulled to pieces. However, because it is so small (Amalthea's diameter is 1/19th that of Io's diameter) it is relatively immune to the effects of tidal forces. Since Amalthea is so close to its parent planet its orbit will eventually decay and it will fall into the planet.",
      ],
    },
    related: [],
  },
  ananke: {
    title: "Ananke",
    description: {
      blurb: [
        "Ananke was discovered on Sept. 28, 195 on a photograph made with the 100-inch (2.5 m) Hooker telescope at the Mount Wilson Observatory in California.",
      ],
      more: [
        "Ananke is the largest member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Ananke was probably an asteroid that was captured by Jupiter's gravity and then suffered a collision which broke off a number of pieces. Those pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. Ananke's observed color is somewhere between gray and light red. Ananke was named for the mother of Adrastea by Zeus, the Greek equivalent of the Roman god Jupiter. In other accounts, Adrastea is described as a nymph of Crete who was one of the nursemaids of the infant Zeus. Ananke is the personification of fate or necessity in ancient Greek literature, who rewards or punishes people for their deeds.​",
      ],
    },
    related: [],
  },
  anthe: {
    title: "Anthe",
    description: {
      blurb: [
        "Anthe was discovered on May 30, 2007, although a check back revealed Anthe in Cassini images as early as June 2004. Anthe is the 60th confirmed moon of Saturn.",
      ],
      more: [
        "Anthe is a tiny moon with a mean radius of 0.6 miles (0.9 km) that orbits between Mimas and Enceladus at about of 122,800 miles (197,700 km) from Saturn. Anthe and two other tiny moons, Methone and Pallene, may have split from either Mimas or Enceladus, or all five moons may be the remains of a larger swarm that traveled in that area close to Saturn. Anthe circles Saturn in approximately 25 hours. Because these three tiny moons orbit at very similar distances from Saturn, they are in a dynamical relationship. The vastly more massive Mimas has the greatest effect on Anthe, causing the Methone orbit to vary by as much as 12.4 miles (20 km), and has a slightly smaller effect on Pallene. Together, these three moons may also be contributing particles to Saturn's E ring. Material blasted off Anthe by micrometeoroid impacts is believed to the source of the Anthe Ring Arc, a faint partial ring arout Saturn that is co-orbital with the moon first detected in June 2007. The name Anthe comes from the name in Greek mythology of one of seven Alkyonides—daughters of the god (or Titan) Alkyoneus. Astronomers also refer to Anthe as Saturn XLIX, and before it was confirmed, it was known as S/2007 S4.​",
      ],
    },
    related: ["sc_cassini"],
  },
  aoede: {
    title: "Aoede",
    description: {
      blurb: [
        "Aoede was discovered Feb. 8, 2003 at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Aoede is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Most or all of the Pasiphae satellites are thought to have begun as a single asteroid that, after being captured by Jupiter's gravity, suffered a collision which broke off a number of pieces. All of the Pasiphae moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Pasiphae satellites began as one or more captured asteroids, rather than forming as part of the original Jupiter system. Aoede has a mean radius of two km, assuming an albedo of 0.04. At a mean distance of about 14.9 million miles (24 million km) from Jupiter, the satellite takes about 761 Earth days to complete one orbit. Originally called S/2003 J7, Aoede was named for one of the Muses, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter. Aoede means song. A name ending in \"e\" was chosen for this moon in accordance with the International Astronomical Union's policy for designating outer moons with retrograde orbits.​",
      ],
    },
    related: [],
  },
  arche: {
    title: "Arche",
    description: {
      blurb: [
        "Arche was discovered Oct. 31, 2002, by Scott S. Sheppard at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Arche is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99 percent of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color—light red—except for Kalyke, which is considerably redder than the others. Arche has a mean radius of about 1 mile (1.5 km). At a mean distance of about 14.5 million miles (23.4 million) km from Jupiter, the satellite takes about 732 Earth days to complete one orbit. Originally called S/2002 J1, Arche was named for one of the Muses, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter. Her name means \"beginning.\"​",
      ],
    },
    related: [],
  },
  atlas: {
    title: "Atlas",
    description: {
      blurb: [
        "Atlas was discovered in 1980 by R. Terrile and the Voyager 1 team from photographs taken during its encounter with Saturn.",
      ],
      more: [
        "Atlas is an inner moon of Saturn, orbiting around the outer edge of Saturn's A Ring. Like Pan, Atlas has a distinctive flying saucer shape created by a prominent equatorial ridge not seen on the other small moons of Saturn. Cassini images revealed in 2004 that a temporary faint ring of material with the orbit of Atlas. The small, pointy moon has a mean radius of 9.4 miles (15.1 km). It orbits 85,544 miles (137,670 km) away from, taking 14.4 hours to complete its trip around the planet. Moons of Saturn were originally named for Greco-Roman Titans and descendants of the Titans. But as many new moons were discovered, scientists began selecting names from more mythologies including Gallic, Inuit, and Norse stories. Originally designated S/1980 S28, this moon is named after Atlas, a Titan, and a son of Iapetus. Atlas was ordered by Zeus to uphold the vault of the sky after the defeat of the Titans. Atlas was so strong that he supported the weight of the Universe on his shoulders.",
      ],
    },
    related: ["sc_voyager_1"],
  },
  autonoe: {
    title: "Autonoe",
    description: {
      blurb: [
        "Autonoe was discovered Dec. 10, 2001 by Scott S. Sheppard, David C. Jewitt, and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Autonoe is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Most or all of the Pasiphae satellites are thought to have begun as a single asteroid that, after being captured by Jupiter's gravity, suffered a collision which broke off a number of pieces. The bulk of the original asteroid survived as the moon called Pasiphae, and the other pieces became some or all of the other moons in the group. All of the Pasiphae moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Pasiphae satellites began as one or more captured asteroids, rather than forming as part of the original Jupiter system. Autonoe has a mean radius of 1.2 miles (2 km), assuming an albedo of 0.04. At a mean distance of about 14.9 million miles (24 million km) from Jupiter, the satellite takes about 761 Earth days to complete one orbit. Originally called S/2001 J1, Autonoe was named for the mother of the Graces by Jupiter, according to some authors.",
      ],
    },
    related: [],
  },
  bebhionn: {
    title: "Bebhionn",
    description: {
      blurb: [
        "Bebhionn was discovered on Dec. 12, 2004 using the wide-field camera on the 8.2-m Subaru telescope on Mauna Kea, Hawaii, with orbital elements computed by Brian Marsden.",
      ],
      more: [
        "Bebhionn has a mean radius of 1.9 miles (3 km), assuming an albedo (a measure of how reflective the surface is) of 0.04. At a mean distance of 10.6 million miles (17.1 million km) from Saturn, the moon takes about 835 Earth days to complete one orbit. Bebhionn is one of the four known members of the Gallic group of moons. These moons have prograde orbits (they travel around Saturn in the same direction as the planet's rotation), but their egg-shaped, angled orbits classify them as \"irregular\" moons. Like Saturn's other irregular moons, they are thought to be objects that were captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet, as the regular moons are thought to have done. The similarities among the orbits of moons in the Gallic group suggest a common origin—they may be fragments of a single object that shattered in a collision. The other members of this group are Albiorix, Erriapus, and Tarvos. Originally called S/2004 S11, Bebhionn was named for a beautiful giantess in Celtic mythology. In one story, she escapes from Maidens' Land—which was populated entirely by women except for the king and his three sons—only to be slain by her giant husband, who was the son of the king of the Isle of Men.​",
      ],
    },
    related: [],
  },
  belinda: {
    title: "Belinda",
    description: {
      blurb: [
        "Belinda was discovered on Jan. 13, 1986 in images taken by Voyager 2. It is one of the 10 Uranian satellites discovered by the Voyager science team.",
      ],
      more: [
        "Little is known about Belinda other than its size and orbital characteristics. Based on its low albedo, its surface probably consists of the dark, unprocessed, carbon-rich material found on the C-class of asteroids.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  bergelmir: {
    title: "Bergelmir",
    description: {
      blurb: [
        "Bergelmir was discovered on Dec. 12, 2004, one of 12 Saturnian moons found that day using wide-field camera on the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Bergelmir has a mean radius of 1.9 miles (3 km), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 159 degrees and an eccentricity of about 0.1. At a mean distance of 12 million miles (19.3 million km) from Saturn, the moon takes about 1,006 Earth days to complete one orbit. Bergelmir is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn—traveling around in the opposite direction from the planet's rotation. Bergelmir and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Bergelmir is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2004 S15, Bergelmir was named for the frost giant who, with his wife, escaped drowning in the flood of Ymir's blood that ensued when Ymir was slain by Odin and his brothers in the Norse tale of creation.​",
      ],
    },
    related: [],
  },
  bestla: {
    title: "Bestla",
    description: {
      blurb: [
        "Bestla was discovered on Dec. 12, 2004, one of 12 Saturnian moons found that day using wide-field camera on the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Bestla has a mean radius of 2.2 miles (3.5 km), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 142 degrees and an eccentricity of about 0.5. At a mean distance of 12.6 million miles (20.3 million km) from Saturn, the moon takes about 1,087 Earth days to complete one orbit. Bestla is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn—traveling around in the opposite direction from the planet's rotation. Bestla and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Bestla is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Bestla appears to be a member of a subgroup with Narvi. Originally called S/2004 S18, Bestla is named for a giantess and the mother of Odin, who is the supreme god in Norse mythology.​",
      ],
    },
    related: [],
  },
  bianca: {
    title: "Bianca",
    description: {
      blurb: [
        "Bianca was discovered Jan. 23, 1986 in images taken by Voyager 2. It is one of the 10 Uranian satellites discovered by the Voyager science team.",
      ],
      more: [
        'Bianca is one of the small, inner moons of Uranus. Little is known about it other than its size and orbital characteristics. Neither its size or albedo have been measured directly, but by analogy with Belinda and Puck, its surface probably consists of the dark, unprocessed, carbon-rich material found on the C-class of asteroids. Originally called S/1986 U9, Bianca was named after the sister of Katharina (Kate) in Shakespeare\'s play, "The Taming of the Shrew."​',
      ],
    },
    related: ["sc_voyager_2"],
  },
  c_2010_x1: {
    title: "Elenin",
    description: {
      blurb: [
        "Comet C/2010 X1 (Elenin) is an Oort cloud comet discovered on December 10, 2010.",
      ],
      more: [
        "Comet Elenin was hit by a coronal mass ejection from the sun and started disintegrating in August of 2011, and as of mid-October 2011 was not visible even using large ground-based telescopes.",
      ],
    },
    related: [],
  },
  c_2012_s1: {
    title: "ISON",
    description: {
      blurb: [
        "C/2012 S1 (ISON) bears the name of the night-sky survey program that discovered it, the International Scientific Optical Network, in 2012.",
      ],
      more: [
        "C/2012 S1 (ISON) was the subject of the most coordinated comet observing campaign in history. Over the course of a year, more than a dozen spacecraft and numerous ground-based observers collected what is believed to be the largest single cometary dataset in history as ISON plunged toward a close encounter with the Sun.Just prior to its closest approach to the sun on Nov. 28, 2013, Comet ISON went through a major heating event, and was torn to pieces. What remained of Comet ISON appeared to brighten and spread out, then fade.",
      ],
    },
    related: ["sc_deep_impact"],
  },
  caliban: {
    title: "Caliban",
    description: {
      blurb: [
        "Caliban orbits Uranus in the opposite direction from the regular moons and the rotation of the planet itself (called a retrograde orbit). Its orbit is also somewhat inclined and eccentric, and very far from the planet -- more than 10 times farther than Oberon, the farthest regular moon. These characteristics suggest that Caliban was an independent body that was captured by Uranus' gravity. It is thought to be about 72 km in diameter, and to be the second largest irregular satellite of Uranus (about half the size of Sycorax). The size estimate is based on the brightness of the moon and an assumed albedo of 0.04, typical of captured asteroids in the outer solar system.",
      ],
    },
    related: [],
  },
  callirrhoe: {
    title: "Callirrhoe",
    description: {
      blurb: [
        "Callirrhoe was discovered Oct. 19, 1999 via the 36-inch telescope on Kitt Peak, in the course of observations by the Spacewatch program of the University of Arizona.",
      ],
      more: [
        "Initially thought to be an asteroid, Callirrhoe is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. All of the Pasiphae moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Pasiphae satellites began as one or more captured asteroids, rather than forming as part of the original Jupiter system. Compared to Jupiter's other satellite groups, confidence is lower that all the moons in the Pasiphae group originated in a single collision. This is due to differences in color (varying from red to gray), and differences in orbital eccentricity and inclination among the members of the Pasiphae group. Sinope, in particular, is suspected of starting out as an independent asteroid. Callirrhoe has a mean radius of 2.7 miles (4.3 km), assuming an albedo of 0.04. At a mean distance of about 15 million miles (24.1 million km) from Jupiter, the satellite takes about 759 Earth days to complete one orbit. This object was originally called asteroid 1999 UX18 and then renamed S/1999 J1 upon discovery that it is a satellite of Jupiter. Ultimately, it was named \"Callirrhoe\" after the daughter of the river god, Achelous, who persuaded Zeus (the Greek equivalent of the Roman god Jupiter) to instantly change her young sons into grown men so they could avenge the murder of their father.",
      ],
    },
    related: [],
  },
  calypso: {
    title: "Calypso",
    description: {
      blurb: [
        "Calypso was discovered by D. Pascu, P.K. Seidelmann, W. Baum, and D. Currie in March 1980 using a ground-based telescope.",
      ],
      more: [
        'Calypso is a Trojan (trailing moon) of the larger moon Tethys, orbiting 183,000 miles (295,000 km) from Saturn, completing one orbit in 45 hours. Calypso follows Tethys in its orbit by 60 degrees. (Telesto is the other Tethys Trojan, orbiting Saturn 60 degrees ahead of Tethys.) Together, Calypso and Telesto are known as the "Tethys Trojans" and were discovered in the same year. Calypso has a mean radius of 6.6 miles (10.7 km) across. Like many other small Saturnian moons and small asteroids, Calypso is irregularly shaped by overlapping large craters. This moon appears to also have loose surface material capable of smoothing the appearance of craters. Its surface is one of the most reflective (at visual wavelengths) in the solar system, with a visual geometric albedo (a measure of how reflective the surface is) of 1.34. This very high reflectiveness could be the result of particles from Saturn\'s E-ring, which is composed of small ice particles generated by Enceladus\' south polar geysers. Moons of Saturn were originally named for Greco-Roman Titans and descendants of the Titans. But as many new moons were discovered, scientists began selecting names from more mythologies, including Gallic, Inuit, and Norse stories. Originally called S/1980 S25, Calypso is named for a nymph whose name means "I hide." A daughter of the Titans, Oceanus and Tethys, she lived alone on her island until she fell in love with the explorer Odysseus (called Ulysses by the Romans; his name means "one who suffers"). Calypso helped Odysseus find his way home after his long voyage and dangerous adventures.​',
      ],
    },
    related: [],
  },
  carme: {
    title: "Carme",
    description: {
      blurb: [
        "Carme was discovered on July 30, 1938 by Seth Barnes Nicholson with the 100-inch (2.5 m) Hooker telescope at the Mount Wilson Observatory in California.",
      ],
      more: [
        "With a mean radius of 14 miles (23 km), Carme is the largest member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. Carme was probably a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. Those pieces became the other 16 moons in the Carme group. Carme still retains 99 percent of the total mass of the group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color—light red—except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. At a mean distance of about 14.5 million miles (23.4 million km) from Jupiter, the satellite takes about 734 Earth days to complete one orbit. Carme is named for the mother of Britomartis by the Roman god Jupiter (or Zeus in the Greek version of the myth), who became a goddess of Crete. A name ending in \"e\" was chosen in accordance with the International Astronomical Union's policy for designating outer moons with retrograde orbits.​",
      ],
    },
    related: [],
  },
  carpo: {
    title: "Carpo",
    description: {
      blurb: [
        "Carpo was discovered on Feb. 26, 2003 using the 12-ft. (3.6-m) Canada-France-Hawaii telescope at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Carpo, some 1.9 miles (3 km) across (assuming an albedo of 0.04), orbits Jupiter at a distance of about 10.5 million miles (17 million km). It takes a little over 456 Earth days to complete one orbit. The orbit is somewhat inclined with respect to Jupiter's equatorial plane, and the direction of travel is the same as that of Jupiter's rotation (a \"prograde\" orbit). It is Jupiter's most distant known moon with a prograde orbit. There are many moons known to be further out, but they all travel around Jupiter in the opposite direction. Originally designated S/2003 J20, Carpo was named for one of the three Athenian goddesses of the flowers of spring and the fruits of summer and autumn. An annual festival in their honor was called the Horaea. According to Hesoid, a group of goddesses collectively called the Horae (with different names, which did not include Carpo) were daughters of Zeus, the Greek equivalent of the Roman god Jupiter.​",
      ],
    },
    related: [],
  },
  chaldene: {
    title: "Chaldene",
    description: {
      blurb: [
        "Chaldene was discovered Nov. 23, 2000 by Scott S. Sheppard, David C. Jewitt, Yange R. Fernandez, and Eugene Magnier at an observatory on Mauna Kea in Hawaii.",
      ],
      more: [
        "Chaldene is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99 percent of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color—light red—except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Chaldene has a mean radius of about 1 mile (1.9 km). At a mean distance of about 14.3 million miles (23.1 million km) from Jupiter, the satellite takes about 724 Earth days to complete one orbit. Originally called S/2000 J10, Chaldene was named for the mother of Solymos by Zeus, the Greek equivalent of the Roman god Jupiter. A name ending in \"e\" was chosen in accordance with the International Astronomical Union's policy for designating outer moons with retrograde orbits.​",
      ],
    },
    related: [],
  },
  cordelia: {
    title: "Cordelia",
    description: {
      blurb: [
        "Cordelia was discovered on Jan. 20, 1986 in images taken by Voyager 2. It is one of the 10 Uranian satellites discovered by the Voyager science team.",
      ],
      more: [
        "Of the moons known to orbit Uranus, Cordelia is closest to the planet. It and Ophelia are shepherd moons whose gravity keeps the particles that constitute Uranus' Epsilon ring from dispersing. Neither its size nor its albedo have been measured directly, but assuming an albedo of 0.07 like Puck, its surface probably consists of the dark, unprocessed, carbon-rich material found on the C-class of asteroids. Originally called S/1986 U7, Cordelia was named for one of the youngest daughters of King Lear in William Shakespeare's play of the same name. King Lear disowns Cordelia for her refusal to flatter him. Others think highly of her, and the King of France marries her for her virtue alone. Cordelia forgives her father in spite of his cruelty toward her and remains loyal to him.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  cressida: {
    title: "Cressida",
    description: {
      blurb: [
        "Cressida was discovered on Jan. 9, 1986 in images taken by Voyager 2. It is one of the 10 Uranian satellites discovered by the Voyager science team.",
      ],
      more: [
        'Cressida is one of the small, inner moons of Uranus. Little is known about it other than its size and orbital characteristics. Based on its low albedo, its surface probably consists of the dark, unprocessed, carbon-rich material found on the C-class of asteroids. Originally called S/1986 U3, Cressida was named for the title character in William Shakespeare\'s play, "Troilus and Cressida."',
      ],
    },
    related: ["sc_voyager_2"],
  },
  cupid: {
    title: "Cupid",
    description: {
      blurb: [
        "Cupid was discovered on Aug. 25, 2003 by M.R. Showalter and J.J. Lissauer, using the Hubble Space Telescope.",
      ],
      more: [
        "Cupid is one of the inner moons of Uranus, so small and dark that it escaped the notice of Voyager 2 during the spacecraft's visit in 1986. Originally called S/2003 U2, Cupid was named for the Roman god of love, who appears in William Shakespeare's play, \"Timon of Athens\" (in keeping with the custom of naming most of Uranus' moons after Shakespearean characters).",
      ],
    },
    related: [],
  },
  cyllene: {
    title: "Cyllene",
    description: {
      blurb: [
        "Cyllene was discovered Feb. 9, 2003 by Scott S. Sheppard and his team from the University of Hawaii at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Cyllene is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Most or all of the Pasiphae satellites are thought to have begun as a single asteroid that, after being captured by Jupiter's gravity, suffered a collision which broke off a number of pieces. The bulk of the original asteroid survived as the moon called Pasiphae, and the other pieces became some or all of the other moons in the group. All of the Pasiphae moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Pasiphae satellites began as one or more captured asteroids, rather than forming as part of the original Jupiter system. Compared to Jupiter's other satellite groups, confidence is lower that all the moons in the Pasiphae group originated in a single collision. This is due to differences in color (varying from red to gray), and differences in orbital eccentricity and inclination among the members of the Pasiphae group. Sinope, in particular, is suspected of starting out as an independent asteroid. Cyllene has a mean radius of one kilometer, assuming an albedo of 0.04. At a mean distance of about 14.8 million miles (23.8 million km) from Jupiter, the satellite takes about 752 Earth days to complete one orbit. Originally called S/2003 J13, Cyllene was named for a nymph in Greek mythology who was a daughter of Zeus, the Greek equivalent of the Roman god Jupiter. She is associated with a mountain in Arcadia on which, legend has it, the blackbirds become white and are impossible to shoot during the daytime.",
      ],
    },
    related: [],
  },
  dactyl: {
    title: "Dactyl",
    description: {
      blurb: [
        "Dactyl is a moon of the asteroid 243 Ida, discovered by the Galileo spacecraft in 1993.",
      ],
      more: [
        "Dactyl is heavily cratered, like Ida, and consists of similar materials. Its origin is uncertain. Dactyl was found on 17 February 1994 by Galileo mission member Ann Harch, while examining delayed image downloads from the spacecraft. Galileo recorded 47 images of Dactyl over an observation period of 5.5 hours in August of 1993. Dactyl's orbit around Ida is not precisely known.",
      ],
    },
    related: ["sc_galileo"],
  },
  daphnis: {
    title: "Daphnis",
    description: {
      blurb: [
        "Daphnis was discovered by the Cassini mission team on 1 May 2005. Prior to its discovery, scientists posited the existence of a moon in Daphnis' position due to the ripples observed along the edge of the Keeler Gap.",
      ],
      more: [
        "Known as the wavemaker moon, scientists posited the existence of a moon in Daphnis' position due to the ripples observed along the edge of the Keeler Gap. Daphnis has a mean radius of 2.4 miles (3.8 km) and orbits 85,000 miles (136,500 km) from Saturn, completing one orbit in 14 hours. The gravitational pull of tiny inner Saturnian moon Daphnis perturbs the orbits of particles of Saturn's A ring—and sculpting the edge of the Keeler Gap into waves. Material on the inner edge of the gap orbits faster than the moon, so the waves there lead the moon in its orbit. Material on the outer edge moves slower than the moon, so waves there trail the moon. The waves Daphnis causes cast shadows on Saturn during its equinox when the sun is in line with the plane of the rings. Formerly known as S/2005 S1, Daphnis is named for a shepherd, and pipes player who is a pastoral poet in Greek mythology. Daphnis was the son of Hermes, the brother of Pan and a descendent of the Titans.​",
      ],
    },
    related: ["sc_cassini"],
  },
  deimos: {
    title: "Deimos",
    description: {
      blurb: [
        "Deimos is the smaller of Mars' two moons. Being only 9 by 7 by 6.8 miles in size (15 by 12 by 11 kilometers), Deimos whirls around Mars every 30 hours.",
      ],
      more: [
        "Deimos is a small and lumpy, heavily cratered object. Its craters are generally smaller than 1.6 miles (2.5 kilometers) in diameter, however, and it lacks the grooves and ridges seen on Phobos. Typically when a meteorite hits a surface, surface material is thrown up and out of the resulting crater. The material usually falls back to the surface surrounding the crater. However, these ejecta deposits are not seen on Deimos, perhaps because the moon's gravity is so low that the ejecta escaped to space. Material does appear to have moved down slopes. Deimos also has a thick regolith, perhaps as deep as 328 feet (100 meters), formed as meteorites pulverized the surface. Deimos is a dark body that appears to be composed of C-type surface materials, similar to that of asteroids found in the outer asteroid belt.",
      ],
    },
    related: [],
  },
  desdemona: {
    title: "Desdemona",
    description: {
      blurb: [
        "Desdemona was discovered on Jan. 13 1986 in images taken by Voyager 2. It is one of the 10 Uranian satellites discovered by the Voyager science team.",
      ],
      more: [
        'Desdemona is one of the small, inner moons of Uranus. Little is known about it other than its size and orbital characteristics. Neither its size nor its albedo have been measured directly, but assuming an albedo of 0.07 like Puck, its surface probably consists of the dark, unprocessed, carbon-rich material found on the C-class of asteroids. Originally called S/1986 U6, Desdemona was named after the wife of Othello in William Shakespeare\'s play, "Othello, the Moor of Venice." Desdemona is the daughter of a Venetian senator.',
      ],
    },
    related: ["sc_voyager_2"],
  },
  despina: {
    title: "Despina",
    description: {
      blurb: [
        "Despina is a tiny moon located within Neptune's faint ring system. The irregularly-shaped moon orbits Neptune every eight hours, circling in the same direction as Neptune's own rotation. Despina remains close to Neptune's equatorial plane.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  dia: {
    title: "Dia",
    description: {
      blurb: [
        "Dia was discovered in 2000 by using the University of Hawaii's 2.2 m (88 inch) telescope atop Mauna Kea. The moon was then lost in Jupiter's bright glare for several years. Dia was rediscovered in images obtained by the Magellan Telescope in 2010 and 2011.",
      ],
      more: [
        'With a prograde orbit and a radius of about 1.2 miles (2 km), Dia is among the smallest member of the Himalia group (made up of Himalia, Leda, Lysithea, and Elara). Dia is a Greek name meaning "she who belongs to Zeus" (who became Jupiter in Roman mythology). Dia was the divine daughter of the seashore. The tiny moon was originally called S/2000 J11 because it is a satellite that was discovered in 2000, and was the 11th satellite of Jupiter to be found that year.​',
      ],
    },
  },
  dimorphos: {
    title: "Dimorphos",
    description: {
      blurb: [
        "Dimorphos is an asteroid that is part of a binary system with the larger asteroid Didymos, and has an orbital period of 11.9 hours.",
      ],
      more: [
        "Discovered in 2003, It measures approximately 160 metres (520 ft) in diameter compared to the larger Didymos, at 780 metres (2,560 ft). The DART mission successfully impacted Dimorphos on September 26th, 2022, in order to test the viability of redirecting the orbit of an asteroid.  The orbital period of Dimorphos around Didymos was changed by approximately half an hour.",
      ],
    },
    related: ["sc_dart"],
    stats: {
      discovery:
        "First observed in 2003 (7 years after the discovery of Didymos), Dimorphos is the smaller twin of the Didymos binary asteroid system. The DART mission intentionally crashed into Dimorphos on September 26th, 2022, and successfully altered its orbit.",
      rotation: 11.92,
    },
    approach: {
      fact: "Dimorphos and its binary system are classifed as a PHO (potentially hazardous object), and approached Earth at a distance of 0.07123 AU (astronomical units) on October 4th, 2022.",
    },
  },
  dione: {
    title: "Dione",
    description: {
      blurb: [
        "Dione is a small moon orbiting Saturn every 2.7 days at a distance roughly the same as our moon orbits around the Earth.",
      ],
      more: [
        "About 700 miles (1,100 kilometers) in diameter, Dione's density is 1.48 times that of liquid water, suggesting that about a third of Dione is made up of a dense core (probably silicate rock) with the remainder of its composition being ice. At Dione's average temperature of minus 121 degrees Fahrenheit (minus 186 degrees Celsius or 87 Kelvin), ice is hard as rock. Ice particles as fine as smoke constantly bombard Dione from Saturn's E ring, which is produced by the jets of icy material spraying from Enceladus. So while Enceladus is less than half the diameter of Dione, the smaller moon is altering the surface of the larger moon, painting it with fresh ice dust.",
      ],
    },
    related: ["sc_cassini", "sc_voyager_1", "saturn"],
  },
  sc_dscovr: {
    title: "DSCOVR",
    description: {
      blurb: [
        "DSCOVR (Deep Space Climate Observatory) is an American space weather station that monitors changes in the solar wind, providing space weather alerts and forecasts for geomagnetic storms that could disrupt power grids, satellites, telecommunications, aviation and GPS.",
      ],
      more: [
        "DSCOVR was launched on Feb.11, 2015, and 100 days later it reached the Sun–Earth L1 Lagrange point and began orbiting about 1 million miles (1.5 million kilometers) from Earth.",
        "The satellite has a continuous view of the Sun and the sunlit side of Earth. It takes full Earth pictures about every 2 hours using the Earth Polychromatic Imaging Camera (EPIC) instrument. In October 2015, a website was launched that posts at least a dozen new color images every day from EPIC.",
      ],
    },
    dates: {
      start: "2015-02-11T23:03:02",
      end: "",
      landing: "",
    },
    related: ["sun", "earth"],
  },
  eirene: {
    title: "Eirene",
    description: {
      blurb: [
        "Eirene was discovered in February 2003 by Scott Sander Sheppard at the Mauna Kea Observatory in Hawaii, and originally designated S/2003 J5.",
      ],
      more: [
        "Eirene is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Eirene has a mean radius of about 1.2 miles (2 kilometers). At a mean distance of about 15 million miles (23.5 million kilometers) from Jupiter, the satellite takes about 739 Earth days to complete one orbit. In mythology, Eirene is the goddess of peace and the daughter of Zeus and Themis.​",
      ],
    },
  },
  elara: {
    title: "Elara",
    description: {
      blurb: [
        "Elara was discovered on Jan. 5, 1905 in photographs taken with the Crossley 36-inch (0.9 meter) reflector of the Lick Observatory on Mount Hamilton at the University of California, San Jose.",
      ],
      more: [
        "Elara is the eighth largest moon of Jupiter. With a mean radius of 26.7 miles (43 km) assuming an albedo of 0.04, it's only about 2 percent the size of Europa, the smallest of the four Galilean moons. But it's about half as big as Himalia, which makes it the second biggest in the Himalia group, a family of Jovian satellites which have similar orbits and appearance, and are therefore thought to have a common origin. Elara may be a chunk of an asteroid (a C- or D-class asteroid, judging by the fact that it reflects only about 4 percent of the light it receives), which was broken apart in a collision either before or after being captured by Jupiter's gravity. In this scenario, the other pieces became the other moons in the Himalia group: Leda, Himalia (the largest), and Lysithea. A fifth moon, called S/2000 J11, only about 1.2 miles (2 km) in radius, was considered a candidate for this group. However, it was lost before its orbit could be definitively determined. It may have crashed into Himalia, reuniting two pieces of the former asteroid, and perhaps creating a faint temporary ring of Jupiter near the orbit of Himalia. At a distance of about 7.3 million miles (11.7 million km) from Jupiter, Elara takes nearly 260 Earth days to complete one orbit. Elara is named for one of the lovers of Zeus, the Greek equivalent of the Roman god Jupiter. In Greek mythology, Zeus hid her from his wife, Hera, by placing Elara deep beneath the Earth, where she gave birth to their son, a giant called Tityas.",
      ],
    },
    related: [],
  },
  enceladus: {
    title: "Enceladus",
    description: {
      blurb: [
        "One of Saturn's most surprising moons, Enceladus has altered views about where life might exist.",
      ],
      more: [
        "Few worlds in our solar system are as compelling as Saturn’s icy ocean moon Enceladus. A handful of worlds are thought to have liquid water oceans beneath their frozen shell, but Enceladus sprays its ocean out into space where a spacecraft can sample it. From these samples, scientists have determined that Enceladus has most of thechemical ingredients needed for life, and likely has hydrothermal vents spewing out hot, mineral-rich water into its ocean. About as wide as Arizona, Enceladus also has the whitest,most reflective surface in the solar system. The moon creates a ring of its own as it orbits Saturn—its spray of icy particles spreads out into the space around its orbit, circling the planet to form Saturn’s E ring. In 2005, NASA’s Cassini spacecraft discovered that icy water particles and gas gush from the moon’s surface at approximately 800 miles per hour (400 meters per second). The eruptions appear to be continuous, generating an enormous halo of fine ice dust around Enceladus, which supplies material to Saturn's E-ring. Only a small fraction of the material ends up in the ring, however, with most of it falling like snow back to the moon’s surface, which helps keep Enceladus bright white.The water jets come from relatively warm fractures in the crust, which scientists informally call the “tiger stripes.” Several gases, including water vapor, carbon dioxide, methane, perhaps a little ammonia and either carbon monoxide or nitrogen gas make up the gaseous envelope of the plume, along with salts and silica. And the density of organic materials in the plume was about 20 times denser than scientists expected. From gravity measurements based on the Doppler effect and the magnitude of the moon’s very slight wobble as it orbits Saturn, scientists determined that the jets were being supplied by a global ocean inside the moon. Scientists think that the moon’s ice shell may be as thin as half a mile to 3 miles (1 to 5 kilometers) at the south pole. The average global thickness of the ice is thought to be about 12 to 16 miles (20 to 25 kilometers). Since the ocean in Enceladus supplies the jets, and the jets produce Saturn’s E ring, to study material in the E ring is to study Enceladus’ ocean. The E ring is mostly made of ice droplets, but among them are peculiar nanograins of silica, which can only be generated where liquid water and rock interact at temperatures above about 200 degrees Fahrenheit (90 degrees Celsius). This, among other evidence, points to hydrothermal vents deep beneath Enceladus’ icy shell, not unlike the hydrothermal vents that dot Earth’s ocean floor. With its global ocean, unique chemistry and internal heat, Enceladus has become a promising lead in our search for worlds where life could exist.",
      ],
    },
    related: ["sc_cassini"],
  },
  epimetheus: {
    title: "Epimetheus",
    description: {
      blurb: [
        'Audouin Dollfus observed a moon on Dec. 15, 1966, for which he proposed the name "Janus." On Dec. 18 of the same year, Richard Walker made a similar observation, now credited as the discovery of Epimetheus.',
      ],
      more: [
        "Epimetheus is a potato-shaped moon with a mean radius of 36 miles (58 km) and dimensions of 84 x 65 x 65 miles (135 x 108 x 105 km, respectively). Its shape reflects pronounced flattening at the Epimethean South Pole associated with the remains of a large crater. Epimetheus has several craters larger than 19 miles (30 km), including Hilairea and Pollux. This oblong moon orbits 94,000 miles (151,000 km) away from Saturn, taking 17 hours to circle the planet, in the gap between the F and G rings, but it doesn't do this alone. It actually shares its orbit with a sister moon named Janus, in what is called a co-orbital condition or 1:1 resonance. Epimetheus and Janus may have formed by the break-up of one moon. If so, it would have happened early in the life of the Saturn system since both moons have ancient cratered surfaces, many with soft edges because of dust. They also have some grooves (similar to grooves on the Martian moon Phobos) suggesting some glancing blows from other bodies. Together, the moons trail enough particles to generate a faint ring. However, except for very powerful telescopes, the region of their common orbit appears as a gap between Saturn's prominent F and G rings. Epimetheus and Janus are the fifth and sixth moons in distance from Saturn. Both are phase locked with their parent; one side always faces toward Saturn. Being so close, they orbit in less than 17 hours. They are both thought to be composed of largely of water ice, but their density of less than 0.7 is much less than that of water. Thus, they are probably \"rubble piles\" — each a collection of numerous pieces held together loosely by gravity. Each moon has dark, smoother areas, along with brighter areas of terrain. One interpretation of this is that the darker material evidently moves down slopes, leaving shinier material such as water ice on the walls of fractures. Their temperature is approximately -195 degrees Celsius (-319 degrees Fahrenheit). Their reflectivity (or albedo) of 0.7 to 0.8 in the visual range again suggests a composition largely of water ice. Janus and Epimetheus share their orbits with a faint dust ring around Saturn, now called the Janus/Epimetheus Ring. This ring may be made of particles blasted off their surfaces by meteoroid impacts. The name Epimetheus comes from the Greek god (or titan) Epimetheus (or hindsight) who was the brother of Prometheus (foresight). Together, they represented humanity.",
      ],
    },
    related: ["sc_cassini"],
  },
  erinome: {
    title: "Erinome",
    description: {
      blurb: [
        "Erinome was discovered on Nov. 23, 2000 at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Erinome is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99% of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color—light red—except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped.vErinome has a mean radius of about one mile (1.6 km). At a mean distance of about 14.4 million miles (23.2 million km) from Jupiter, the satellite takes about 728 Earth days to complete one orbit. Originally called S/2000 J4, Erinome was named for a chaste young woman in Roman mythology whom Venus causes to fall in love with Jupiter. She loses her virginity to Adonis, however, after Venus throws a fog on her. This displeases the goddess Diana, who turns Erinome into a peacock. Adonis, realizing he has assaulted a love of Jupiter, flees into the woods, but is driven out by Mercury. Just as Adonis is about to defeat Mercury in a violent fight, Jupiter throws a lightning bolt and kills him.",
      ],
    },
    related: [],
  },
  erriapus: {
    title: "Erriapus",
    description: {
      blurb: [
        "Erriapus was discovered on Sept. 23, 2000 at the Mauna Kea Observatory on the island of Hawaii.",
      ],
      more: [
        "Erriapus has a mean radius of 3.1 miles (5 kilometers) assuming an albedo (a measure of how reflective the surface is) of 0.06. At a mean distance of 10.9 million miles (17.6 million kilometers) from Saturn, the moon takes about 871 Earth days to complete one orbit. Erriapus is one of the four known members of the Gallic group of moons. These moons have prograde orbits (they travel around Saturn in the same direction as the planet's rotation), but their egg-shaped, angled orbits classify them as \"irregular\" moons. Like Saturn's other irregular moons, they are thought to be objects that were captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet, as the regular moons are thought to have done. The similarities among the orbits of moons in the Gallic group suggest a common origin—they may be fragments of a single object that shattered in a collision. The other members of this group are Albiorix, Bebhionn and Tarvos. Observations by Tommy Grav and James Bauer using telescopes on Mauna Kea, Hawaii in 2006 found that the color of Albiorix varies over its surface. They hypothesize that Tarvos and Erriapus, which were both seen to be light red, are the largest fragments from an impact on Albiorix, leaving a less-red crater. (These observations did not include Bebhionn.) Moons of Saturn were originally named for Greco-Roman Titans and descendants of the Titans. But as many new moons were discovered scientists began selecting names from more mythologies, including Gallic, Inuit and Norse stories. Erriapus, originally designated S/2000 10, is named for a Gallic giant. It was named Erriapo in August 2003, but the name was changed from Erriapo to the nominative Erriapus per International Astronomical Union conventions in late 2007.​",
      ],
    },
    related: [],
  },
  ersa: {
    title: "Ersa",
    description: {
      blurb: [
        "This tiny moon of Jupiter was first spotted in 2017 and originally designated S/2018 J1.",
      ],
      more: [
        "The discovery announcement was made in July 2018. In mythology, Ersa is the sister of Pandia and, as such, also the daughter of Zeus and the Moon goddess Selene. Ersa is the goddess of dew.​",
      ],
    },
  },
  euanthe: {
    title: "Euanthe",
    description: {
      blurb: [
        "Euanthe was discovered on Dec. 11, 2001 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Euanthe is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter's gravity and then suffered a collision, which broke off a number of pieces. The largest remaining chunk was named \"Ananke,\" and the smaller pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Ananke members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Euanthe has a mean radius of just under one mile (about 1.5 kilometers), assuming an albedo of 0.04. At a mean distance of about 13 million miles (21 million kilometers) from Jupiter, it takes about 620 Earth days to complete one orbit. Originally called S/2001 J7, Euanthe was given one of the names in Greek mythology for the mother of the Graces by Zeus, the Greek equivalent of the Roman god Jupiter.",
      ],
    },
    related: [],
  },
  eukelade: {
    title: "Eukelade",
    description: {
      blurb: [
        "Eukelade was discovered on Feb. 6, 2003, by Scott S. Sheppard at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Eukelade is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99% of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color—light red —except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members are massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Eukelade has a mean radius of about 1.2 miles (2 kilometers). At a mean distance of about 14.4 million miles (23.3 million kilometers) from Jupiter, the satellite takes about 730 Earth days to complete one orbit. Originally called S/2003 J1, Eukelade was named for one of the Muses, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter. Her name means \"well sounding.\"",
      ],
    },
    related: [],
  },
  eupheme: {
    title: "Eupheme",
    description: {
      blurb: [
        "Eupheme was discovered Mar. 4, 2003 at the Mauna Kea Observatory in Hawaii, and originally designated S/2003 J3.",
      ],
      more: [
        "Eupheme has a mean radius of about less than a mile or about one kilometer, (assuming an albedo of 0.04). At a mean distance of about 13 million miles (20.2 million kilometers) from Jupiter, it takes about 584 Earth days to complete one orbit. In mythology, Eupheme is the spirit of praise and good omen, the granddaughter of Zeus, and the sister of Philophrosyne.​",
      ],
    },
  },
  euporie: {
    title: "Euporie",
    description: {
      blurb: [
        "Euporie was discovered on Dec. 11, 2001 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Euporie is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter's gravity and then suffered a collision, which broke off a number of pieces. The largest remaining chunk was named \"Ananke,\" and the smaller pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Ananke members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Euporie has a mean radius of about 0.6 miles (one kilometer), assuming an albedo of 0.04. At a mean distance of about 11.9 million miles (19.3 million kilometers) from Jupiter, it takes about 551 Earth days to complete one orbit. Originally called S/2001 J10, Euporie was named for one of the Horae (seasons), who were daughters of the Roman god Jupiter, and a Titaness named Themis. Euporie means plenty.",
      ],
    },
    related: [],
  },
  europa: {
    title: "Europa",
    description: {
      blurb: [
        "Europa may be the most promising place in our solar system to find present-day environments suitable for some form of life beyond Earth.",
      ],
      more: [
        "Scientists are almost certain that hidden beneath the icy surface of Europa is a salty-water ocean thought to contain twice as much water as Earth’s oceans combined. Slightly smaller than Earth's Moon, Europa’s water-ice surface is crisscrossed by long, linear fractures, cracks, ridges, and bands. The moon’s ice shell is probably 10 to 15 miles (15 to 25 kilometers) thick, beneath which the ocean is estimated to be 40 to 100 miles (60 to 150 kilometers) deep. Like Earth, Europa is thought to also contain a rocky mantle and iron core. Europa’s water-ice surface is crisscrossed by long, linear fractures. Based on the small number of observable craters, the surface of this moon appears to be no more than 40 to 90 million years old, which is youthful in geologic terms (the surface of Callisto, another of Jupiter’s moons, is estimated to be a few billion years old). Along Europa's many fractures, and in splotchy patterns across its surface, is a reddish-brown material whose composition is not known for certain, but likely contains salts and sulfur compounds that have been mixed with the water ice and modified by radiation. This surface composition may hold clues to the moon's potential as a habitable world.",
      ],
    },
    related: [
      "sc_pioneer_10",
      "sc_pioneer_11",
      "sc_voyager_1",
      "sc_voyager_2",
      "sc_galileo",
    ],
  },
  eurydome: {
    title: "Eurydome",
    description: {
      blurb: [
        "Eurydome was discovered on Dec. 9, 2001 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Eurydome is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Most or all of the Pasiphae satellites are thought to have begun as a single asteroid that, after being captured by Jupiter's gravity, suffered a collision which broke off a number of pieces. The bulk of the original asteroid survived as the moon called Pasiphae, and the other pieces became some or all of the other moons in the group. All of the Pasiphae moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Pasiphae satellites began as one or more captured asteroids, rather than forming as part of the original Jupiter system. Eurydome has a mean radius of about 0.9 miles (1.5 kilometers), assuming an albedo of 0.04. At a mean distance of about 14.3 million miles (23.1 million kilometers) from Jupiter, the satellite takes about 717 Earth days to complete one orbit. Originally called S/2001 J4, Eurydome was named for a character in Greek mythology who, according to some sources, was the mother of the Graces by Zeus, the Greek equivalent of the Roman god Jupiter.",
      ],
    },
    related: [],
  },
  farbauti: {
    title: "Farbauti",
    description: {
      blurb: [
        "Farbauti was discovered on Dec. 12, 2004, one of 12 Saturnian moons found that day using wide-field camera on the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Farbauti has a mean radius of about 1.6 miles (2.5 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 158 degrees and an eccentricity of about 0.2. At a mean distance of 12.7 million miles (20.4 million kilometers) from Saturn, the moon takes about 1,087 Earth days to complete one orbit. Farbauti is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn—traveling around in the opposite direction from the planet's rotation. Farbauti and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Farbauti is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Farbauti appears to be a member of a subgroup that also includes Skoll, Hyrrokkin, S/2006 S1, Bergelmir, Skathi, S/2006 S3, and Kari. Originally called S/2004 S9, Farbauti was named for a giant in Norse mythology who was the father of Loki, who was known as the disgrace of the gods.",
      ],
    },
    related: [],
  },
  fenrir: {
    title: "Fenrir",
    description: {
      blurb: [
        "Fenrir was discovered on Dec. 12, 2004, one of 12 Saturnian moons found that day using a wide-field camera on the Subaru 8.2-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Fenrir has a mean radius of 1.2 miles (2.0 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 164 degrees and an eccentricity of about 0.1. At a mean distance of 14 million miles (22.5 million kilometers) from Saturn, the moon takes about 1,260 Earth days to complete one orbit. Fenrir is a member of the Norse group of moons. Thes \"irregular\" moons have retrograde orbits around Saturn—traveling around in the opposite direction from the planet's rotation. Fenrir and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Saturn's other irregular moons, Fenrir is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2004 S16, Fenrir was named for a monstrous wolf in Norse mythology who was the offspring of Loki, the disgrace of the gods, and Angrboda, a disagreeable giantess. The gods managed to bind Fenrir using a dwarf-manufactured fetter made of the sound of a cat's footfall, a woman's beard and other hard-to-find components. According to the mythology, Fenrir is destined to break free at doomsday (the time known as Ragnarok) and kill Odin, the supreme Norse god.",
      ],
    },
    related: [],
  },
  galatea: {
    title: "Galatea",
    description: {
      blurb: [
        "Galatea is another of Neptune's tiny moons. Small and irregularly-shaped like Despina, Galatea orbits in the same direction as Neptune and is relatively close to the gas giant's equatorial plane. The small moon's gravity is believed to cause disturbances in Neptune's ring system. It was found in the same month scientists discovered ring arcs, or partial rings, that were suspected to exist around Neptune.",
        "Galatea circles Neptune every 10 hours and 18 minutes.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  ganymede: {
    title: "Ganymede",
    description: {
      blurb: [
        "Jupiter's moon Ganymede is the largest moon in our solar system and the only moon with its own magnetic field.",
      ],
      more: [
        "The magnetic field of Ganymede causes auroras, which are ribbons of glowing, electrified gas, in regions circling the moon’s north and south poles. Ganymede has large, bright regions of ridges and grooves that slice across older, darker terrains. These grooved regions are a clue that the moon experienced dramatic upheavals in the distant past. Scientists have also found strong evidence of an underground ocean on Ganymede. Ganymede was discovered by Galileo Galilei on Jan. 7, 1610. The discovery, along with three other Jovian moons, was the first time a moon was discovered orbiting a planet other than Earth. The discovery of the four Galilean satellites eventually led to the understanding that planets in our solar system orbit the sun, instead of our solar system revolving around Earth.",
      ],
    },
    related: [
      "sc_pioneer_10",
      "sc_pioneer_11",
      "sc_voyager_1",
      "sc_voyager_2",
      "sc_galileo",
      "sc_juno",
    ],
  },
  greip: {
    title: "Greip",
    description: {
      blurb: [
        "Greip was discovered on March 6, 2006 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna using the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Greip has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 173 degrees and an eccentricity of about 0.3. At a mean distance of 11.5 million miles (18.4 million kilometers) from Saturn, the moon takes about 936 Earth days to complete one orbit. Greip is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn—traveling around in the opposite direction from the planet's rotation. Greip and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Greip is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2006 S4, Greip was named for one of the nine giantesses who gave birth to Heimdall, the guard of the rainbow bridge that links our world to Asgard, home of the Norse gods.",
      ],
    },
    related: [],
  },
  c_1995_o1: {
    title: "Hale-Bopp",
    description: {
      blurb: [
        "Comet Hale-Bopp was visible to the naked eye for 18 months in 1996 and 1997. It has a large nucleus of 37 miles (60 km) and orbits the sun every 2,534 years.",
      ],
      more: [
        "On July 23, 1995, an unusually bright comet outside of Jupiter's orbit (7.15 AU) was discovered independently by Alan Hale, New Mexico and Thomas Bopp, Arizona. The new comet, designated C/1995 O1, is the farthest comet ever discovered by amateurs and appeared 1000 times brighter than Comet Halley did at the same distance. Normally, comets are inert when they are beyond the orbit of Jupiter, so it has been speculated that Comet Hale-Bopp is either a rather large comet or experienced a bright outburst (or both). The comet is the brightest comet since Comet West in 1976.",
      ],
    },
    related: [],
  },
  ferdinand: {
    title: "Ferdinand",
    description: {
      blurb: [
        "Ferdinand is a very small, dark moon which orbits Uranus at a greater distance than any other known satellite of that planet.",
      ],
    },
    related: [],
  },
  fornjot: {
    title: "Fornjot",
    description: {
      blurb: [
        "Fornjot was discovered on Dec. 12 2004, one of 12 Saturnian moons found that day using a wide-field camera on the Subaru 8.2-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Fornjot has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 170 degrees and an eccentricity of about 0.2. At a mean distance of 15.6 million miles (25.2 million kilometers) from Saturn, the moon takes about 1,494 Earth days to complete one orbit. Fornjot is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn—traveling around in the opposite direction from the planet's rotation. Fornjot and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Fornjot is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2004 S8, Fornjot was named for the giant (also called Forniot) in Norse mythology who was father to the giants and commanded the wind, the sea and fire.",
      ],
    },
    related: [],
  },
  francisco: {
    title: "Francisco",
    description: {
      blurb: [
        "Francisco is a very small, dark moon which orbits Uranus in the opposite direction from the regular moons and the planet's own rotation (a retrograde orbit).",
      ],
    },
    related: [],
  },
  halimede: {
    title: "Halimede",
    description: {
      blurb: [
        "Halimede is one of three tiny moons (ranging in size from 30 to 40 km -- or 18 to 24 miles) of Neptune discovered in 2002 using innovative ground-based telescope techniques. (The other moons discovered were Laomedeia and Sao.) The moons are so distant and so small they are about 100 million times fainter than can be seen with the unaided eye. The moons were missed by the Voyager 2 spacecraft in 1989 because they are so faint and distant from Neptune.",
        "Halimede is considered an irregular satellite because of its distant, eccentric orbit around Neptune. Like most irregular satellites of the giant planets in our outer solar system, Halimede most likely formed after a collision between a larger moon and a comet or an asteroid. Sao and Laomedeia have prograde orbits, which means they orbit in the same direction as Neptune's rotation. Halimede has a retrograde orbit, which means Halimede orbits in the opposite direction of Neptune's rotation.",
        "Very little is known about Halimede. Scientists are trying to learn more about it and its irregular sisters because they offer a glimpse of the conditions at the time the planets in our solar system were forming billions of years ago.",
      ],
    },
    related: [],
  },
  harpalyke: {
    title: "Harpalyke",
    description: {
      blurb: [
        "Harpalyke was discovered Nov. 23, 2000 by Scott S. Sheppard, David C. Jewitt, Yanga R. Fernandez, and Eugene Magnier at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Harpalyke is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter's gravity and then suffered a collision, which broke off a number of pieces. The largest remaining chunk was named \"Ananke,\" and the smaller pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Ananke members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Harpalyke has a mean radius of about 1.3 miles (2.2 kilometers), assuming an albedo of 0.04. It is colored a similar gray to two other moons in the Ananke family: Praxidike and Iocaste. At a mean distance of about 13.1 million miles (21.1 million kilometers) from Jupiter, Harpalyke takes about 623 Earth days to complete one orbit. Originally called S/2000 J5, Harpalyke was named for a woman in Greek mythology who was transformed into a night bird called Chalcis. According to one version of the story, this transformation happened after she had intercourse with Zeus, the Greek equivalent of the Roman god Jupiter. In another version, she had incestuous relations with her father. In revenge, she killed her younger brother or her son (depending on the account), carved him up, cooked the meat and served it to her father, who ultimately kills himself.",
      ],
    },
    related: [],
  },
  hati: {
    title: "Hati",
    description: {
      blurb: [
        "Hati was discovered on Dec. 12, 2004, one of 12 Saturnian moons found that day using a wide-field camera on the Subaru 8.2-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Hati has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 165 degrees and an eccentricity of about 0.4. At a mean distance of 12.3 million miles (19.8 million kilometers) from Saturn, the moon takes about 1,039 Earth days to complete one orbit. Its rotational period is just 5.5 hours, the fastest known rotation of all of Saturn's moons. Hati is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn—traveling around in the opposite direction from the planet's rotation. Hati and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Hati is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2004 S14, Hati was named for a giant wolf in Norse mythology who pursues the Moon (that is, the Moon chariot and the boy who drives it—see Mundilfari for an explanation) across the sky. According to the mythology, Hati is destined to catch and devour them at the doomsday time known as Ragnarok.",
      ],
    },
    related: [],
  },
  hegemone: {
    title: "Hegemone",
    description: {
      blurb: [
        "Hegemone was discovered on Feb. 8, 2003 by Scott S. Sheppard, David C. Jewitt, Jan T. Kleyna, Yanga R. Fernandez, and Henry H. Hsieh at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Hegemone is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Most or all of the Pasiphae satellites are thought to have begun as a single asteroid that, after being captured by Jupiter's gravity, suffered a collision which broke off a number of pieces. The bulk of the original asteroid survived as the moon called Pasiphae, and the other pieces became some or all of the other moons in the group. All of the Pasiphae moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Pasiphae satellites began as one or more captured asteroids, rather than forming as part of the original Jupiter system. Hegemone has a mean radius of about 0.93 miles (1.5 kilometers), assuming an albedo of 0.04. At a mean distance of about 14.6 million miles (23.6 million kilometers) from Jupiter, the satellite takes about 740 Earth days to complete one orbit. Originally called S/2003 J8, Hegemone was named for one of the Graces (according to the Athenians), who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter. The name means \"female leader.\"",
      ],
    },
    related: [],
  },
  helene: {
    title: "Helene",
    description: {
      blurb: [
        "Helene was discovered on March 1, 1980 during the Earth ring-plane crossing by J. Lecacheux and others.",
      ],
      more: [
        'Helene, a small and faint moon of Saturn, is referred to as a Trojan moon because it shares its orbit with another moon—Dione, a moon hundreds of times larger than Helene. This complex orbital arrangement is held steady by gravity: Helene is located at a Lagrange point, where it feels the tug of gravity equally from distant Saturn and nearby Dione. For this reason, soon after it was discovered in 1980 it was called Dione B. This irregularly shaped moon has a mean radius of 10.9 miles (17.6 kilometers) with dimensions 22 x 19 x 18.6 miles (36 x 32 x 30 km). It orbits 234,505 miles (377,400 kilometers) away from Saturn, taking 2.7 Earth days to complete one orbit. John Herschel suggested that the moons of Saturn be associated with mythical brothers and sisters of Kronus. (Kronus is the equivalent of the Roman god Saturn in Greek mythology.) The International Astronomical Union now controls the official naming of astronomical bodies. Originally designated S/1980 S6, Helene is named after the granddaughter of Kronus and is the sister of Polydeuces. Helene was born out of an egg since Zeus took the shape of a swan when he raped her mother Leda. The account of this engendering is retold in the poem "Leda and the Swan" by William Butler Yeats. This same figure in Greek mythology was the cause of the Trojan War.',
      ],
    },
    related: ["sc_cassini"],
  },
  helike: {
    title: "Helike",
    description: {
      blurb: [
        "Helike was discovered on Feb. 6, 2003 by Scott S. Sheppard at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Helike is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter's gravity and then suffered a collision, which broke off a number of pieces. The largest remaining chunk was named \"Ananke,\" and the smaller pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Ananke members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Helike has a mean radius of about 1.2 miles (2 kilometers), assuming an albedo of 0.04. At a mean distance of about 13.1 million miles (21.1 million kilometers) from Jupiter, it takes about 626 Earth days to complete one orbit. Originally called S/2003 J6, Helike was named for one of the Muses, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter. Helike is also the name of a nymph in Greek mythology who helped to nurse Zeus and was transferred to the stars as a reward. There, she became the constellation, the Great Bear.",
      ],
    },
    related: [],
  },
  hermippe: {
    title: "Hermippe",
    description: {
      blurb: [
        "Hermippe was discovered in Dec. 9, 2001 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Hermippe is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter's gravity and then suffered a collision, which broke off a number of pieces. The largest remaining chunk was named \"Ananke,\" and the smaller pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Ananke members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Hermippe has a mean radius of about 1.2 miles (2 kilometers). At a mean distance of about 13.2 million miles (21.3 million kilometers) from Jupiter, it takes about 634 Earth days to complete one orbit. Originally called S/2001 J3, Hermippe was named for one of the many lovers of Zeus, the Greek equivalent of the Roman god Jupiter. She bore him a son named Orchomenos.",
      ],
    },
    related: [],
  },
  herse: {
    title: "Herse",
    description: {
      blurb: [
        "Herse was discovered on Feb. 27, 2003 by Brett J. Gladman, John J. Kavelaars, Jean-Marc Petit, and Lynne Allen.",
      ],
      more: [
        "Herse is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99% of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color -- light red -- except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Herse has a mean radius of about 0.62 miles (one kilometer). At a mean distance of about 14.5 million miles (23.4 million kilometers) from Jupiter, the satellite takes more than 734 Earth days to complete one orbit. Originally called S/2003 J17, Herse was named for a daughter of Selene (goddess of the moon) and Zeus, the Greek equivalent of the Roman god Jupiter.",
      ],
    },
    related: [],
  },
  hiiaka: {
    title: "Hi'iaka",
    description: {
      blurb: ["Hi'iaka is a moon of the dwarf planet Haumea."],
      more: [""],
    },
    related: [],
  },
  himalia: {
    title: "Himalia",
    description: {
      blurb: [
        "Himalia was discovered on December 3, 1904 in photographs taken with the Crossley 36-inch (0.9 meter) reflector of the Lick Observatory on Mount Hamilton at the University of California, San Jose.",
      ],
      more: [
        "Himalia is the fifth largest moon orbiting Jupiter. With a mean radius of 85 km assuming an albedo of 0.04), it's only about 5% the size of the fourth largest moon, Europa. But it's by far the largest member of the Himalia group, a family of Jovian satellites which have similar orbits and appearance, and are therefore thought to have a common origin. Himalia may be the largest remaining chunk of an asteroid (a C- or D-class asteroid, judging by the fact that it reflects only about 4% of the light it receives), which had several pieces broken off in a collision either before or after being captured by Jupiter's gravity. In this scenario, those pieces became the other moons in the Himalia group: Leda, Lysithea and Elara. A fifth moon, called S/2000 J11, only about 1.2 miles (2 kilometers) in radius, was considered a candidate for this group. However, it was lost before its orbit could be definitively determined. It may have crashed into Himalia, reuniting two pieces of the former asteroid, and perhaps creating a faint temporary ring of Jupiter near the orbit of Himalia. At a distance of about 7.1 million miles (11.5 million kilometers) from Jupiter, Himalia takes about 251 Earth days to complete one orbit. Himalia was named for a nymph of the island of Rhodes in Greek mythology who was one of the lovers of Zeus (the Greek equivalent of the Roman god Jupiter). She bore him three sons: Spartaeus, Cronios and Cytus.",
      ],
    },
    related: ["sc_cassini"],
  },
  hippocamp: {
    title: "Hippocamp",
    description: {
      blurb: [
        "Hippocamp, originally designated S/2004 N1, was discovered by Mark Showalter on July 1, 2013 using Hubble Space Telescope images taken of the Neptune system between 2004 and 2009.",
      ],
      more: [
        "Hippocamp is unusually close to a much larger Neptunian moon called Proteus. Normally, a moon like Proteus should have gravitationally swept aside or swallowed the smaller moon while clearing out its orbital path. Scientists think Hippocamp is likely a chipped-off piece of the larger moon that resulted from a collision with a comet billions of years ago. The diminutive moon, only 20 miles (about 34 kilometers) across, is 1/1000th the mass of Proteus (which is 260 miles [about 418 kilometers] across). Hippocamp is much smaller than any of Neptune's previously known satellites, and below the detection threshold of the Voyager cameras sent there in 1989. The moon is so small and dim that itis roughly 100 million times fainter than the faintest star that can be seen with the naked eye. The moon orbits Neptune every 23 hours. It is nestled between the orbits of Larissa and Proteus.",
      ],
    },
    related: [],
  },
  hydra: {
    title: "Hydra",
    description: {
      blurb: [
        "Hydra was discovered in June, 2005 by Hal Weaver and a large team of astronomers using the Hubble Space Telescope.",
      ],
      more: [
        "Hydra is the outer of the two moons discovered orbiting Pluto in 2005. Nix and Hydra are roughly 5,000 times fainter than Pluto and are about two to three times farther from Pluto than its large moon, Charon, which was discovered in 1978. Nix and Hydra are roughly 20 to 70 miles (32 to 113 km) wide. They are so faint so small and so faint that scientists combined a short exposure of Pluto and Charon and a long exposure of Nix and Hydra to create images of them all together. Hydra was named for the nine-headed serpent that Hercules fought in Greek and Roman mythology.",
      ],
    },
    related: ["sc_new_horizons"],
  },
  hyperion: {
    title: "Hyperion",
    description: {
      blurb: [
        "Hyperion is the largest of Saturn's irregular, nonspherical moons.",
      ],
      more: [
        "Hyperion's mean radius is 83.9 miles (135 kilometers), but since Hyperion is rather potato-shaped, its shape can be described in terms of its diameter along its three axes: 255 x 163 x 137 miles (410 x 260 x 220 kilometers, respectively). Considering its odd shape, Hyperion is probably a remnant of a larger moon that was destroyed by a major impact. Hyperion's density is slightly more than half that of water. This could be due to water ice with gaps (porosity) of more than 40 percent. Also, lighter materials, such as frozen methane or carbon dioxide, could make up part of Hyperion. This is consistent with the concept of Hyperion accreting from a number of smaller ice and rock bodies, but not having enough gravity to compact them. Thus, Hyperion might be similar to a large rubble pile. Hyperion rotates chaotically, tumbling unpredictably through space as it orbits Saturn. The most noticeable close-up feature of Hyperion is its deeply cratered surface. Hyperion and its sister outer moons, Phoebe and Iapetus, all show extensive cratering because they are Saturn's most distant moons and have experienced very little tidal warming that might blur or erase earlier features. However, the Hyperion craters are particularly deep and do not have significant rays of ejecta (although there appears to have been slumping or landslides inside many of the bigger craters). The result is a curiously punched-in look, somewhat like the surface of a sponge or a wasp nest. Planetary geologists have theorized that Hyperion's high-porosity and low density would crater more by compression than excavation.",
      ],
    },
    related: ["sc_cassini"],
  },
  hyrrokkin: {
    title: "Hyrrokkin",
    description: {
      blurb: [
        "Hyrrokkin was discovered on Dec. 12, 2004 using the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Hyrrokkin has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 151 degrees and an eccentricity of about 0.3. At a mean distance of 11.5 million miles (18.4 million kilometers) from Saturn, the moon takes about 932 Earth days to complete one orbit. Hyrrokkin is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn -- traveling around in the opposite direction from the planet's rotation. Hyrrokkin and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Hyrrokkin is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Hyrrokkin appears to be a member of a subgroup that also includes Skathi, Skoll, S/2006 S1, Bergelmir, Farbauti, S/2006 S3, and Kari. Originally called S/2004 S19, Hyrrokkin was named for giantess in Norse mythology who launched Baldur's enormous funeral ship with one mighty push when the gods, themselves, were unable to budge it",
      ],
    },
    related: ["sc_cassini"],
  },
  iapetus: {
    title: "Iapetus",
    description: {
      blurb: [
        "Iapetus, the third largest moon of Saturn, is known for having a bright half and a dark half, with the leading hemisphere being dark.",
      ],
      more: [
        "Iapetus has been called the yin and yang of the Saturn moons because its leading hemisphere has a reflectivity (or albedo) as dark as coal (albedo 0.03-0.05 with a slight reddish tinge) and its trailing hemisphere is much brighter at 0.5-0.6.",
        "Saturn's third largest moon, Iapetus has a mean radius of 457 miles (736 kilometers) and a density only 1.2 times that of liquid water. It has been suggested that Iapetus (like Rhea) is three quarters ice and one quarter rock.Iapetus orbits at 2,213,000 miles (3,561,000 kilometers) from Saturn. The great distance from Saturn's tidal forces and from most of the other moons and ring particles has probably allowed the Iapetus surface to be largely unaffected by any melting episodes that could have caused some smoothing or \"resurfacing\" as on some of the moons closer to Saturn.",
        "However, despite the great distance, Saturn has tidally locked Iapetus. The moon always presents the same face toward Saturn. With its distant, inclined orbit, Iapetus is the only large moon from which there is a nice view of the rings of Saturn.Giovanni Cassini observed the dark-light difference of this moon's surface when he discovered Iapetus in 1671. He noted that he could only see Iapetus on the west side of Saturn. He correctly concluded that Iapetus had one side much darker than the other side, and that Iapetus was tidally locked with Saturn.",
        "Scientists have long wondered why one hemisphere of Iapetus is so dark in comparison to its other hemisphere, and in comparison to other surfaces in the Saturn system. Iapetus may be sweeping up particles from the more-distant dark moon, Phoebe. If that is the darkening mechanism, it should be steadily renewing the dark surface because very few fresh bright craters are detected within the dark terrain. An alternate theory is that there might be ice volcanism distributing darker material to the surface. Volcano-like eruptions of hydrocarbons might form the dark surfaces, particularly after chemical reactions caused by solar radiation.",
        "The September 2007 Cassini flyby of Iapetus showed that a third process, thermal segregation, is probably the most responsible for Iapetus' dark hemisphere. Iapetus has a very slow rotation, longer than 79 days. Such a slow rotation means that the daily temperature cycle is very long, so long that the dark material can absorb heat from the sun and warm up. (The dark material absorbs more heat than the bright icy material.) This heating will cause any volatile, or icy, species within the dark material to sublime out, and retreat to colder regions on Iapetus. This sublimation of volatiles causes the dark material to become even darker -- and causes neighboring bright, cold regions to become even brighter. Iapetus may have experienced a (possibly small) influx of dark material from an external source, which could have warmed up and triggered this thermal segregation process.",
        'The second most notable feature of Iapetus is its "equatorial ridge", a chain of 6-mile (10-km) high mountains girdling the moon\'s equator. On the anti-Saturnian side of Iapetus, the ridge appears to break up and distinct, partially bright mountains are observed. The Voyager I and Voyager II encounters provided the first knowledge of these mountains, and they are informally referred to as the Voyager Mountains.',
        "There are two theories on how the ridge formed. Some scientists think the ridge was formed at an earlier time when Iapetus rotated much faster than it does today; others think the ridge is made of material left from the collapse of a ring.",
      ],
    },
    related: ["sc_cassini"],
  },
  io: {
    title: "Io",
    description: {
      blurb: [
        "Jupiter's moon Io is the most volcanically active world in the Solar System, with hundreds of volcanoes, some erupting lava fountains dozens of miles (or kilometers) high.",
      ],
      more: [
        "Io’s remarkable activity is the result of a tug-of-war between Jupiter's powerful gravity and smaller but precisely timed pulls from two neighboring moons that orbit farther from Jupiter – Europa and Ganymede. A bit larger than Earth's Moon, Io is the third largest of Jupiter's moons, and the fifth one in distance from the planet. Although Io always points the same side toward Jupiter in its orbit around the giant planet, the large moons Europa and Ganymede perturb Io's orbit into an irregularly elliptical one. Thus, in its widely varying distances from Jupiter, Io is subjected to tremendous tidal forces.",
        "These forces cause Io's surface to bulge up and down (or in and out) by as much as 330 feet (100 meters). Compare these tides on Io's solid surface to the tides on Earth's oceans. On Earth, in the place where tides are highest, the difference between low and high tides is only 60 feet (18 meters), and this is for water, not solid ground.",
        "Io's orbit, keeping it at more or less a cozy 262,000 miles (422,000 kilometers) from Jupiter, cuts across the planet's powerful magnetic lines of force, thus turning Io into an electric generator. Io can develop 400,000 volts across itself and create an electric current of 3 million amperes. This current takes the path of least resistance along Jupiter's magnetic field lines to the planet's surface, creating lightning in Jupiter's upper atmosphere.",
      ],
    },
    related: [
      "sc_pioneer_10",
      "sc_pioneer_11",
      "sc_voyager_1",
      "sc_voyager_2",
      "sc_galileo",
      "sc_cassini",
    ],
  },
  ijiraq: {
    title: "Ijiraq",
    description: {
      blurb: [
        "Ijiraq is a minor moon of Saturn and was discovered on Sept. 23, 2000.",
      ],
      more: [
        "Ijiraq has a mean radius of 3.7 miles (6 kilometers) and it takes about 452 Earth days to complete one orbit. Ijiraq is one of five known members of the Inuit group of moons, which orbit Saturn at a mean distance of 7 to 11 million miles. The Inuit moons all have prograde orbits (they travel around Saturn in the same direction as the planet's rotation), but their deviations from circular orbits and from the plane of Saturn's equator classify them as \"irregular\" moons. The similarities among the Inuit group's orbits suggest a common origin -- they may be fragments of a single object that shattered in a collision. The other members of this group are Kiviuq, Paaliaq, Siarnaq, and Tarqeq. Ijiraq is redder than Kiviuq, Siarnaq and Paaliaq, and lacks the feature these other moons display at the deep red wavelength of 0.7 micrometers. Originally called S/2000 S6, Ijiraq was named for a fictional character in the children's book, \"Hide and Sneak\" by Michael Arvaarluk Kusugak.",
      ],
    },
    related: [],
  },
  iocaste: {
    title: "Iocaste",
    description: {
      blurb: [
        "Iocaste was discovered Nov. 23, 2000 by Scott S. Sheppard, David C. Jewitt, Yanga R. Fernandez, and Eugene Magnier at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Iocaste is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter's gravity and then suffered a collision, which broke off a number of pieces. The largest remaining chunk was named \"Ananke,\" and the smaller pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Ananke members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Iocaste has a mean radius of about 1.6 miles (2.6 kilometers), assuming an albedo of 0.04. It is colored a similar gray to two other moons in the Ananke family: Praxidike and Harpalyke. At a mean distance of about 13.2 million miles (21.3 million kilometers) from Jupiter, Iocaste takes about 632 Earth days to complete one orbit. Originally called S/2000 J3, Iocaste was named for the mother of Agamedes by the Roman god, Jupiter.",
      ],
    },
    related: [],
  },
  isonoe: {
    title: "Isonoe",
    description: {
      blurb: [
        "Isonoe was discovered Nov. 23, 2000, by Scott S. Sheppard, David C. Jewitt, Yanga R. Fernandez, and Eugene Magnier at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Isonoe is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99% of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Isonoe has a mean radius of about 1.1 miles (1.9 kilometers). At a mean distance of about 14.4 million miles (23.2 million kilometers) from Jupiter, the satellite takes about 726 Earth days to complete one orbit. Originally called S/2000 J6, Isonoe was named for the mother of Orchomenus by Zeus, the Greek equivalent of the Roman god Jupiter. Isonoe was one of the 50 daughters of Danaus in Greek legend. Danaus agreed to the marriage of his 50 daughters to the 50 sons of Aegyptus, his twin brother, but commanded his daughters to kill their new husbands in their sleep on their wedding night. All but one complied. For some reason, Danaus had difficulty finding suitors for his daughters after that, so he offered them as prizes in a foot race. Danaus' daughters were ultimately condemned in Hades to endlessly attempt to fill a bottomless water vessel.",
      ],
    },
    related: [],
  },
  janus: {
    title: "Janus",
    description: {
      blurb: [
        'Audouin Dollfus observed a moon on Dec. 15, 1966, for which he proposed the name "Janus."',
      ],
      more: [
        "Janus is a potato-shaped moon with a mean radius of 55.6 miles (89.5 kilometers) and dimensions of 122 x 119 x 93 miles (196 x 192 x 150 kilometers, respectively). Janus is extensively cratered with several craters larger than 19 miles (30 kilometers). Janus' prominent craters are named Castor, Phoebe, Idas and Lynceus. This oblong moon orbits 94,000 miles (151,000 kilometers) away from Saturn, taking 17 hours to complete one orbit, in the gap between the F and G rings, but it doesn't do this alone. It actually shares its orbit with a sister moon named Epimetheus, in what is called a co-orbital condition or 1:1 resonance. One moon orbits 31 miles (50 km) farther away from the planet than the other, taking more time to complete one turn around Saturn. This slight difference means the inner, faster moving moon starts to catch up to the other approximately every four Earth years. Interestingly, when this happens, the gravity interaction between the moons causes them to trade places between these inner and outer orbits. Together, the moons trail enough particles to generate a faint ring. However, except for very powerful telescopes, the region of their common orbit appears as a gap between Saturn's prominent F and G rings. Janus and Epimetheus are the fifth and sixth moons in distance from Saturn. Both are phase locked with their parent; one side always faces toward Saturn. Being so close, they orbit in less than 17 hours. They are both thought to be composed of largely of water ice, but their density of less than 0.7 is much less than that of water. Thus, they are probably \"rubble piles\" -- each a collection of numerous pieces held together loosely by gravity. Each moon has dark, smoother areas, along with brighter areas of terrain. One interpretation of this is that the darker material evidently moves down slopes, leaving shinier material such as water ice on the walls of fractures. Their temperature is approximately -195 degrees Celsius (-319 degrees Fahrenheit). Their reflectivity (or albedo) of 0.7 to 0.8 in the visual range again suggests a composition largely of water ice. Janus and Epimetheus share their orbits with a faint dust ring around Saturn, now called the Janus/Epimetheus Ring. This ring may be made of particles blasted off their surfaces by meteoroid impacts. The name Janus comes from the Roman god of gates, doors, doorways, beginnings, and endings.",
      ],
    },
    related: ["sc_pioneer_11", "sc_voyager_2", "sc_cassini"],
  },
  jarnsaxa: {
    title: "Jarnsaxa",
    description: {
      blurb: [
        "Jarnsaxa was discovered on March 6, 2006 using the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Jarnsaxa has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 163 degrees and an eccentricity of about 0.2. At a mean distance of 12.0 million miles (19.4 million kilometers) from Saturn, the moon takes about 1,007 Earth days to complete one orbit. Jarnsaxa is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn -- traveling around in the opposite direction from the planet's rotation. Jarnsaxa and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Jarnsaxa is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2006 S6, Jarnsaxa was named for one of the nine giantesses in Norse mythology who gave birth to Heimdall, the guard of the rainbow bridge that links our world to Asgard, home of the gods.",
      ],
    },
    related: [],
  },
  juliet: {
    title: "Juliet",
    description: {
      blurb: [
        "Juliet was discovered on Jan. 3, 1986 in images taken by Voyager 2. It is one of the 10 Uranian satellites discovered by the Voyager science team.",
      ],
      more: [
        'Juliet is one of the small, inner moons of Uranus. Little is known about it other than its size and orbital characteristics. Neither its size nor its albedo have been measured directly, but assuming an albedo of 0.07 like Puck, its surface probably consists of the dark, unprocessed, carbon-rich material found on the C-class of asteroids. Originally called S/1986 U2, Juliet was named for the title character in William Shakespeare\'s play, "Romeo and Juliet." Juliet is the daughter of the Capulets, who are sworn enemies to the Montagues. Nevertheless, she falls in love with Romeo, son of the Montagues.',
      ],
    },
    related: ["sc_voyager_2"],
  },
  jupiter_li: {
    title: "Jupiter LI",
    description: {
      blurb: [
        "This tiny moon is one of several discovered from Earth-based telescopes with improved search techniques. It is a little bigger than a mile (2 kilometers) across.",
      ],
      more: [
        "This moon is still awaiting an official name. Since its discovery is now confirmed, it is temporarily being called Jupiter LI, which means it is the 51st confirmed moon discovered at Jupiter. It was originally called S/2010 J1.",
      ],
    },
    related: [],
  },
  jupiter_lii: {
    title: "Jupiter LII",
    description: {
      blurb: [
        "This moon of Jupiter was discovered on Sept. 8, 2010 at the Palomer 5-m Hale telescope in California.",
      ],
      more: [
        "This tiny moon is one of several discovered from Earth-based telescopes with improved search techniques. It is a little bigger than a mile (2 kilometers) across.",
      ],
    },
    related: [],
  },
  jupiter_liv: {
    title: "Jupiter LIV",
    description: {
      blurb: [
        "Jupiter LIV, originally known as S/2016 J 1, is an outer natural satellite of Jupiter.",
      ],
      more: [
        "It was discovered by Scott S. Sheppard in 2016, but not announced until June 2, 2017 via a Minor Planet Electronic Circular from the Minor Planet Center. It is about 1 kilometer in diameter and orbits at a semi-major axis of about 20,650,845 km with an inclination of about 139.8°. It belongs to the Ananke group.",
      ],
    },
    related: [],
  },
  jupiter_lv: {
    title: "Jupiter LV",
    description: {
      blurb: [
        "Jupiter LV, originally known as S/2003 J 18, is an outer natural satellite of Jupiter.",
      ],
      more: ["Jupiter LV is about 2 kilometres in diameter."],
    },
    related: [],
  },
  jupiter_lvi: {
    title: "Jupiter LVI",
    description: {
      blurb: [
        "Jupiter LVI, provisionally known as S/2011 J 2, is a natural satellite of Jupiter. It was discovered in 2011.",
      ],
      more: [
        "The moon was lost following its discovery in 2011, but was subsequently re-discovered in 2017. It is an irregular moon with a retrograde orbit, like so many of the smaller Jupiter moons.",
      ],
    },
    related: [],
  },
  jupiter_lxi: {
    title: "Jupiter LXI",
    description: {
      blurb: [
        "Jupiter LXI, provisionally known as S/2003 J 19, is a natural satellite of Jupiter, discovered in 2003.",
      ],
      more: [
        "S/2003 J 19 is about 2 kilometres in diameter, and orbits Jupiter every 699.125 days, at an inclination of 165° to the ecliptic (164° to Jupiter's equator), in a retrograde direction and with an eccentricity of 0.1961. It belongs to the Carme group, made up of irregular retrograde moons orbiting Jupiter at an inclination of about 165°.This moon was lost following its discovery in 2003 but then re-discovered in 2018.",
      ],
    },
    related: [],
  },
  jupiter_lxiii: {
    title: "Jupiter LXIII",
    description: {
      blurb: [
        "Jupiter LXIII, provisionally known as S/2017 J 2, is an outer natural satellite of Jupiter. It was discovered in 2017.",
      ],
      more: [
        "It is a member of the Carme group, and is about 2 kilometers in diameter.",
      ],
    },
    related: [],
  },
  jupiter_lxiv: {
    title: "Jupiter LXIV",
    description: {
      blurb: [
        "Jupiter LXIV, originally known as S/2017 J 3, is an outer natural satellite of Jupiter.",
      ],
      more: [
        "It was discovered in 2017, is about two kilometers in diameter, and is a member of the Ananke group.",
      ],
    },
    related: [],
  },
  jupiter_lxix: {
    title: "Jupiter LXIX",
    description: {
      blurb: [
        "Jupiter LXIX, originally known as S/2017 J 8, is an outer natural satellite of Jupiter.",
      ],
      more: [
        "It was discovered in 2017, is about two kilometers in diameter, and is a member of the Ananke group.",
      ],
    },
    related: [],
  },
  jupiter_lxvi: {
    title: "Jupiter LXVI",
    description: {
      blurb: [
        "Jupiter LXVI, originally known as S/2017 J 5, is an outer natural satellite of Jupiter.",
      ],
      more: [
        "It was discovered in 2017, is about two kilometers in diameter, and is a member of the Carme group.",
      ],
    },
    related: [],
  },
  jupiter_lxvii: {
    title: "Jupiter LXVII",
    description: {
      blurb: [
        "Jupiter LXVII, originally known as S/2017 J 6, is an outer natural satellite of Jupiter.",
      ],
      more: [
        "It was discovered in 2017, is about two kilometers in diameter, and is a member of the Pasiphae group.",
      ],
    },
    related: [],
  },
  jupiter_lxviii: {
    title: "Jupiter LXVIII",
    description: {
      blurb: [
        "Jupiter LXVIII, provisionally known as S/2017 J 7, is an outer natural satellite of Jupiter.",
      ],
      more: [
        "It was discovered in 2017, is about two kilometers in diameter, and is a member of the Pasiphae group.",
      ],
    },
    related: [],
  },
  jupiter_lxx: {
    title: "Jupiter LXX",
    description: {
      blurb: [
        "Jupiter LXX, originally known as S/2017 J 9, is an outer natural satellite of Jupiter.",
      ],
      more: [
        "It was discovered in 2017, is about two kilometers in diameter, and is a member of the Ananke group.",
      ],
    },
    related: [],
  },
  jupiter_lxxii: {
    title: "Jupiter LXXII",
    description: {
      blurb: [
        "Jupiter LXXII, originally known as S/2011 J 1, is a natural satellite of Jupiter.",
      ],
      more: [
        "It was discovered in 2017, is about three kilometers in diameter, and is a member of the Ananke group.",
      ],
    },
    related: [],
  },
  kale: {
    title: "Kale",
    description: {
      blurb: [
        "Kale was discovered Dec. 9, 2001 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Kale is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99% of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color -- light red -- except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Kale has a mean radius of about 0.6 miles (one kilometer). At a mean distance of about 14.4 million miles (23.2 million kilometers) from Jupiter, the satellite takes about 729 Earth days to complete one orbit. Originally called S/2001 J8, Kale was named for one of the Graces, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter.",
      ],
    },
    related: [],
  },
  kallichore: {
    title: "Kallichore",
    description: {
      blurb: [
        "Kallichore was discovered on Feb. 6, 2003 by Scott S. Sheppard at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Kallichore is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99% of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color – light red – except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Kallichore has a mean radius of about 0.6 miles (one kilometer). At a mean distance of about (23.3 million kilometers) from Jupiter, the satellite takes about 728 Earth days to complete one orbit. Originally called S/2003 J11, Kallichore was named for one of the Muses, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter. Her name means \"beautiful in dance.\"",
      ],
    },
    related: [],
  },
  kalyke: {
    title: "Kalyke",
    description: {
      blurb: [
        "Kalyke was discovered on Nov. 23, 2000 by Scott S. Sheppard, David C. Jewitt, Yanga R. Fernandez, and Eugene Magnier at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Kalyke is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99% of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color – light red – except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Kalyke has a mean radius of about 1.6 miles (2.6 kilometers). At a mean distance of about 14.6 million miles (23.5 million kilometers) from Jupiter, the satellite takes about 742 Earth days to complete one orbit. Originally called S/2000 J2, Kalyke was named for the mother of Endymion by Zeus (the Greek equivalent of the Roman god Jupiter) according to some accounts in Greek mythology.",
      ],
    },
    related: [],
  },
  kari: {
    title: "Kari",
    description: {
      blurb: [
        "Kari was discovered on March 6, 2006 based on data obtained with the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii, during the months of January to April, 2006.",
      ],
      more: [
        "Kari has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 156 degrees and an eccentricity of about 0.5. At a mean distance of 13.7 million miles (22.1 million kilometers) from Saturn, the moon takes about 1,231 Earth days to complete one orbit. Its rotation period is 7 hours and 42 minutes. Kari is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn -- traveling around in the opposite direction from the planet's rotation. Kari and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Kari is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Kari appears to be a member of a subgroup that also includes Skathi, Skoll, Hyrrokkin, S/2006 S1, Farbauti, Bergelmir, and S/2006 S3. Originally called S/2006 S2, Kari was named for a wind giant in Norse mythology",
      ],
    },
    related: ["sc_cassini"],
  },
  kerberos: {
    title: "Kerberos",
    description: {
      blurb: [
        "Kerberos was discovered on June 28, 2011 by a large team led by Mark Showalter using the Hubble Space Telescope.",
      ],
      more: [
        "Pluto's tiny moon Kerberos appears to be smaller than scientists expected and has a highly-reflective surface, counter to predictions prior to the July 2015 flyby of the NASA's New Horizons spacecraft. The new data show that Kerberos appears to have a double-lobed shape, with the larger lobe approximately 5 miles (8 kilometers) across and the smaller lobe approximately 3 miles (5 kilometers) across. Scientists speculate from its unusual shape that Kerberos could have been formed by the merger of two smaller objects. The reflectivity of Kerberos' surface is similar to that of Pluto's other small moons (approximately 50 percent) and strongly suggests Kerberos, like the others, is coated with relatively clean water ice. Kerberos is located between the orbits of Nix and Hydra, which Hubble discovered in 2005. Charon was discovered in 1978 at the U.S. Naval Observatory and first resolved using Hubble in 1990 as a separate body from Pluto. Originally designated S/2011 (134340) 1 (and sometime referred to as P4), Kerberos is named after the three-headed dog of Greek mythology.",
      ],
    },
    related: ["sc_new_horizons"],
  },
  kiviuq: {
    title: "Kiviuq",
    description: {
      blurb: [
        "Kiviuq was discovered on Aug. 7, 2000 at the European Southern Observatory in La Silla, Chile.",
      ],
      more: [
        "Kiviuq has a mean radius of about 5 miles (8 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. This small, light red, irregular moon, is a dark object in a highly inclined orbit around Saturn. At a mean distance of 7.0 million miles (11.3 million kilometers) from Saturn, the moon takes about 449 Earth days to complete one orbit, while it rotates once every 21 hours and 49 minutes. Kiviuq is one of five known members of the Inuit group of moons, which orbit Saturn at a mean distance of 7 to 11 million miles (11 to 18 million kilometers), at inclinations between 40 and 50 degrees from the plane of Saturn's equator, and with eccentricities of 0.15 to 0.48. (A moon's eccentricity is a number between 0 and 1 which describes the shape of the orbit. The closer to 0, the more circular it is; the closer to 1, the more elongated.) The Inuit moons all have prograde orbits (they travel around Saturn in the same direction as the planet's rotation), but their deviations from circular orbits and from the plane of Saturn's equator classify them as \"irregular\" moons. Like Saturn's other irregular moons, they are thought to be objects that were captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet, as the regular moons are thought to have done. Originally called S/2000 S5, Kiviuq was named for the wandering hero of epic stories told by the Inuit people.",
      ],
    },
    related: [],
  },
  kore: {
    title: "Kore",
    description: {
      blurb: [
        "Kore was discovered on Feb. 8, 2003 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Kore is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Most or all of the Pasiphae satellites are thought to have begun as a single asteroid that, after being captured by Jupiter's gravity, suffered a collision which broke off a number of pieces. The bulk of the original asteroid survived as the moon called Pasiphae, and the other pieces became some or all of the other moons in the group. All of the Pasiphae moons are retrograde, so they orbit Jupiter in the opposite direction from the planet's rotation. Compared to Jupiter's other satellite groups, confidence is lower that all the moons in the Pasiphae group originated in a single collision. Kore has a mean radius of 0.6 miles (one kilometer), assuming an albedo of 0.04. At a mean distance of about 15.2 million miles (24.5 million kilometers) from Jupiter, the satellite takes about 777 Earth days to complete one orbit. Originally called S/2003 J14, Kore was named for a character in Greek mythology who was the daughter of Zeus (the Greek equivalent of the Roman god Jupiter) and Demeter, the goddess of agriculture.",
      ],
    },
    related: [],
  },
  laomedeia: {
    title: "Laomedeia",
    description: {
      blurb: [
        "Laomedeia is one of three tiny moons (ranging in size from 30 to 40 km -- or 18 to 24 miles) of Neptune discovered in 2002 using innovative ground-based telescope techniques. (The other moons discovered were Sao and Halimede.) The moons are so distant and so small they are about 100 million times fainter than can be seen with the unaided eye. The moons were missed by the Voyager 2 spacecraft in 1989 because they are so faint and distant from Neptune.",
        "Laomedeia is considered an irregular satellite because of its distant, eccentric orbit around Neptune. Like most irregular satellites of the giant planets in our outer solar system, Laomedeia most likely formed after a collision between a larger moon and a comet or an asteroid. Laomedeia and Sao have prograde orbits, which means they orbit in the same direction as Neptune's rotation. Halimede has a retrograde orbit, which means Halimede orbits in the opposite direction of Neptune's rotation.",
        "Very little is known about Laomedeia. Scientists are trying to learn more about it and its irregular sisters because they offer a glimpse of the conditions at the time the planets in our solar system were forming billions of years ago.",
      ],
    },
    related: [],
  },
  larissa: {
    title: "Larissa",
    description: {
      blurb: [
        "Larissa is another of the small moons found near Neptune's faint ring system in 1989. Like Despina and Galatea, Larissa is irregularly shaped and heavily cratered.",
        "Larissa's orbit is mostly circular, but it is slowly spiraling inward and may eventually impact Neptune's atmosphere, or the gas giant's tidal forces may break Larissa apart to form a planetary ring. The moon orbits Neptune in about 13 hours and 20 minutes.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  leda: {
    title: "Leda",
    description: {
      blurb: [
        "Leda was discovered on Sept. 14, 1974 by Charles Thomas Kowal on plates taken from Sept. 11 through 13, 1974 with the 122-cm Schmidt telescope at Mount Palomar.",
      ],
      more: [
        "With a mean radius of 6.2 miles (10 kilometers), assuming an albedo of 0.04, Leda is the smallest moon in the Himalia group, a family of Jovian satellites which have similar orbits and appearance, and are therefore thought to have a common origin. Leda may be a chunk of an asteroid (a C- or D-class asteroid, judging by the fact that it reflects only about 4% of the light it receives), which was broken apart in a collision either before or after being captured by Jupiter's gravity. In this scenario, the other pieces became the other moons in the Himalia group: Himalia (the largest), Lysithea and Elara. A fifth moon, called S/2000 J11, only about 2 km in radius, was considered a candidate for this group. However, it was lost before its orbit could be definitively determined. It may have crashed into Himalia, reuniting two pieces of the former asteroid, and perhaps creating a faint temporary ring of Jupiter near the orbit of Himalia. At a distance of about 6.9 million miles (11.2 million kilometers) from Jupiter, Leda takes nearly 241 Earth days to complete one orbit. Leda was named for a woman in Greek mythology. According to one legend, she was seduced by Zeus (the Greek equivalent of the Roman god, Jupiter), who had taken the form of a swan.",
      ],
    },
    related: [],
  },
  loge: {
    title: "Loge",
    description: {
      blurb: [
        "Loge was discovered on March 6, 2006 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna using the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Loge has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 167 degrees and an eccentricity of about 0.2. At a mean distance of 14.3 million miles (23.0 million kilometers) from Saturn, the moon takes about 1,311 Earth days to complete one orbit. Loge is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn -- traveling around in the opposite direction from the planet's rotation. Loge and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Loge is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2006 S5, Loge was named for Logi, a god who was the personification of fire in Norse mythology.",
      ],
    },
    related: [],
  },
  lysithea: {
    title: "Lysithea",
    description: {
      blurb: [
        "Lysithea was discovered on July 6, 1938 by Seth Barnes Nicholson with the 100-inch (2.5 m) Hooker telescope at the Mount Wilson Observatory.",
      ],
      more: [
        "With a mean radius of 11.1 miles (18 kilometers), assuming an albedo of 0.04, Lysithea is the second smallest moon in the Himalia group, a family of Jovian satellites which have similar orbits and appearance, and are therefore thought to have a common origin. Lysithea may be a chunk of an asteroid (a C- or D-class asteroid, judging by the fact that it reflects only about 4% of the light it receives), which was broken apart in a collision either before or after being captured by Jupiter's gravity. In this scenario, the other pieces became the other moons in the Himalia group: Leda, Himalia (the largest) and Elara. A fifth moon, called S/2000 J11, only about 1.2 miles, (2 kilometers) in radius, was considered a candidate for this group. However, it was lost before its orbit could be definitively determined. It may have crashed into Himalia, reuniting two pieces of the former asteroid, and perhaps creating a faint temporary ring of Jupiter near the orbit of Himalia. At a distance of about 7.2 million miles (11.7 million kilometers) from Jupiter, Lysithea takes about 259 Earth days to complete one orbit. Lysithea was named for one of the lovers of the Roman god Jupiter, or the Greek equivalent, Zeus.",
      ],
    },
    related: [],
  },
  mab: {
    title: "Mab",
    description: {
      blurb: [
        "Mab was discovered on Aug. 23, 2003 by Mark R. Showalter and Jack J. Lissauer, using the Hubble Space Telescope.",
      ],
      more: [
        "Mab is a small, inner moon of Uranus. It orbits at the same distance as one of the planet's rings, the Mu ring, and in fact may provide dust for that ring when the moon is struck by small meteoroids or ring particles. Because of its small size and dark color, it was overlooked in the Voyager 2 images until after it was spotted with a ground-based telescope in 2003. Mab is queen of the fairies in English folklore. She is mentioned in a speech given in William Shakespeare's play, \"Romeo and Juliet,\" so the name is at least somewhat in keeping with the practice of naming most Uranian moons after characters in Shakespeare's plays. The original designation for this moon was S/2003 U1.​",
      ],
    },
    related: [],
  },
  margaret: {
    title: "Margaret",
    description: {
      blurb: [
        "Margaret is considered an irregular moon of Uranus because of the eccentricity and inclination of its orbit, but it is the only such moon that travels in a prograde direction -- that is, in the same direction as the regular moons and the planet's rotation about its axis. Only about 20 km in diameter and very dark, it is likely an object that was captured by Uranus' gravity.",
      ],
    },
    related: [],
  },
  megaclite: {
    title: "Megaclite",
    description: {
      blurb: [
        "Megaclite was discovered on Nov. 25, 2000 by Scott S. Sheppard, David C. Jewitt, Yanga R. Fernandez, and Eugene A. Magnier at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Megaclite is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Most or all of the Pasiphae satellites are thought to have begun as a single asteroid that, after being captured by Jupiter's gravity, suffered a collision which broke off a number of pieces. The bulk of the original asteroid survived as the moon called Pasiphae, and the other pieces became some or all of the other moons in the group. Compared to Jupiter's other satellite groups, confidence is lower that all the moons in the Pasiphae group originated in a single collision. This is due to differences in color (varying from red to gray), and differences in orbital eccentricity and inclination among the members of the Pasiphae group. Sinope, in particular, is suspected of starting out as an independent asteroid. Megaclite has a mean radius of 1.6 miles (2.7 kilometers), assuming an albedo of 0.04. At a mean distance of about 14.7 million (23.8 million kilometers) from Jupiter, the satellite takes about 753 Earth days to complete one orbit. Originally called S/2000 J8, Megaclite was named for one of the adulterous conquests of the Roman god Jupiter.",
      ],
    },
    related: [],
  },
  menoetius: {
    title: "Menoetius",
    description: {
      blurb: [
        'Menoetius is part of a large binary asteroid located in the orbit of Jupiter, always "trailing" the planet by 60 degrees. It is in a binary system with its larger twin, Patroclus. Referred to as a Trojan asteroid, It will be visited by the Lucy mission in 2033.',
      ],
      more: [
        "This asteroid will be the final encounter of Lucy's primary mission, in March of 2033. After a long journey from the Greek L4 swarm to the Trojan L5 swarm, Lucy will fly by the binary pair of asteroids (617) Patroclus and Menoetius. They are large P-type Trojans, with average diameters of 113 km and 104 km (about 70 and 65 miles), respectively. Scientists hypothesize that they may be primordial asteroids left over from the very early Solar System.",
      ],
    },
    related: ["sc_lucy", "617_patroclus"],
  },
  methone: {
    title: "Methone",
    description: {
      blurb: [
        "The Cassini Imaging Team discovered Methone on June 1, 2004. Methone and nearby Pallene were the first moons discovered in Cassini images.",
      ],
      more: [
        "Methone is a tiny 1-mile (1.6-kilometer) mean radius moon that orbits between Mimas and Enceladus at a radius of 120,546 miles (194,000 kilometers) from Saturn. Scientists have two theories to explain the presence of Methone and two other tiny sister moons, Pallene and Anthe. First, the three moons may have split from either Mimas or Enceladus. Second, all five moons may be the remains of a larger swarm that traveled in that area close to Saturn. Methone orbits Saturn in 24 hours. Methone, Pallene and Anthe, all orbit at very similar distances from Saturn – they are in a dynamical relationship. Mimas strongly perturbs the three moons, all of which orbit between Mimas and Enceladus. The vastly more massive Mimas causes the Methonean orbit to vary by as much as 12.4 miles (20 km), it causes Pallene to vary by a slightly smaller amount and it has the greatest effect on Anthe. Because these three tiny moons (Methone, Pallene and Anthe) orbit at very similar distances from Saturn, they are in a dynamical relationship. The vastly more massive Mimas causes the Methone orbit to vary by as much as 12.4 miles (20 km), causes Pallene to vary by a slightly smaller amount, and has the greatest effect on Anthe. These three moons may also be contributing particles to Saturn's E-ring. John Herschel suggested that the moons of Saturn be associated with the mythical brothers and sisters of Kronus.",
      ],
    },
    related: ["sc_cassini"],
  },
  metis: {
    title: "Metis",
    description: {
      blurb: [
        "Metis was discovered in March 1979 by the Voyager science team.",
      ],
      more: [
        "Orbiting within Io's orbit, which is the innermost of the four largest moons of Jupiter (called the Galilean moons), are four smaller moons named Metis, Adrastea, Amalthea, and Thebe. Metis is the third largest within this grouping and it has a mean radius of about 13.3 miles (21.5 kilometers). Metis orbits 128,000 km from its parent planet Jupiter and it takes 0.295 Earth days to complete one orbit. We do not know the rotational period for Metis, but its orbital period is 5 hours, and it is likely to be in synchronous orbit, keeping the same face pointing towards Jupiter. Since Io orbits about 262,000 miles (422,000) kilometers above Jupiter and, at this close distance, is subjected to extreme tidal flexing from Jupiter's gravity, one would imagine that this even closer satellite would be pulled to pieces. However, because it is so small Metis is relatively immune to the effects of tidal forces. Metis is one of the two closest moons (the other is Adrastea) that orbit inside what is called the synchronous orbit radius of Jupiter. That is, Metis orbits Jupiter faster than Jupiter rotates on its axis. At this distance, Metis' orbit will eventually decay and it will fall into the planet. Metis and Adrastea also orbit inside Jupiter's main ring and are undoubtedly the source of the material for this ring. Amalthea and Thebe provide the material for the Gossamer ring. Originally designated S/1979 J 1, Metis is named for the first wife of Zeus who was swallowed by Zeus while pregnant with their first child.",
      ],
    },
    related: ["sc_voyager_1"],
  },
  mimas: {
    title: "Mimas",
    description: {
      blurb: [
        "Crater-covered Mimas is the smallest and innermost of Saturn's major moons.",
      ],
      more: [
        'Its most distinguishing feature is a giant impact crater – named Herschel after the moon\'s discoverer – which stretches a third of the way across the face of the moon, making it look like the Death Star from "Star Wars" The Herschel Crater is 80 miles (130 kilometers) across – one third of the diameter of the moon itself – with outer walls about 3 miles (5 kilometers) high and a central peak 3.5 miles (6 km) high. The impact that blasted this crater out of Mimas probably came close to breaking the moon apart. Shock waves from the Herschel impact may have caused the fractures, also called chasmata, on the opposite side of Mimas. That Mimas appears to be frozen solid is puzzling because Mimas is closer to Saturn and has a much more eccentric (elongated) orbit than Enceladus, which should mean that Mimas has more tidal heating than Enceladus. Yet Enceladus displays geysers of water, which implies internal heat, while Mimas has one of the most heavily cratered surfaces in the solar system, which suggests a frozen surface that has persisted for enough time to preserve all those craters. This paradox has prompted the "Mimas Test" by which any theory that claims to explain the partially thawed water of Enceladus must also explain the entirely frozen water of Mimas.',
      ],
    },
    related: ["sc_cassini", "sc_voyager_1", "sc_voyager_2"],
  },
  miranda: {
    title: "Miranda",
    description: {
      blurb: [
        "Miranda, a moon of Uranus, looks like it was pieced together from parts that didn't quite merge properly.",
      ],
      more: [
        "At about 500 km in diameter, it's only one-seventh as large as Earth's moon, a size that seems unlikely to support much tectonic activity.",
        "Yet Miranda sports one of the strangest and most varied landscapes among extraterrestrial bodies, including three large features known as \"coronae,\" which are unique among known objects in our solar system. They are lightly cratered collections of ridges and valleys, separated from the more heavily cratered (and presumably older) terrain by sharp boundaries like mismatched patches on a moth-eaten coat. Miranda's giant fault canyons are as much as 12 times as deep as the Grand Canyon. Due to Miranda's low gravity and large cliffs, a rock dropped off the edge of the highest cliff would take a full 10 minutes to reach the foot of the cliff. All of Uranus' larger moons, including Miranda, are thought to consist mostly of roughly equal amounts of water ice and silicate rock. Unlike the other four main Uranian satellites, Miranda's orbit is slightly inclined. Miranda was named for the daughter of Prospero in William Shakespeare's play, \"The Tempest.\"",
      ],
    },
    related: ["sc_voyager_2"],
  },
  mneme: {
    title: "Mneme",
    description: {
      blurb: [
        "Mneme was discovered on Feb. 9, 2003 by Scott S. Sheppard and Brett Joseph Gladman at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Mneme is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter's gravity and then suffered a collision, which broke off a number of pieces. The largest remaining chunk was named \"Ananke,\" and the smaller pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Ananke members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Mneme has a mean radius of about 0.6 miles (one kilometer), assuming an albedo of 0.04. At a mean distance of about 13 million miles (21 million kilometers) from Jupiter, it takes about 620 Earth days to complete one orbit. Originally called S/2003 J21, Mneme was named for one of the Muses, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter. Mneme means memory.",
      ],
    },
    related: [],
  },
  moon: {
    title: "Moon",
    description: {
      blurb: [
        "Earth's Moon is the only place beyond Earth where humans have set foot.",
      ],
      more: [
        "The brightest and largest object in our night sky, the Moon makes Earth a more livable planet by moderating our home planet's wobble on its axis, leading to a relatively stable climate. It also causes tides, creating a rhythm that has guided humans for thousands of years.",
        "Our moon is the fifth largest of the 190+ moons orbiting planets in our solar system.",
        "Earth's only natural satellite is simply called \"the Moon\" because people didn't know other moons existed until Galileo Galilei discovered four moons orbiting Jupiter in 1610. With a radius of 1,079.6 miles (1,737.5 kilometers), the Moon is less than a third the width of Earth. If Earth were the size of a nickel, the Moon would be about as big as a coffee bean.",
        "The Moon is farther away from Earth than most people realize. The Moon is an average of 238,855 miles (384,400 kilometers) away. That means 30 Earth-sized planets could fit in between Earth and the Moon.",
        ' The Moon is slowly moving away from Earth, getting about an inch farther away each year. The leading theory of the Moon\'s origin is that a Mars-sized body collided with Earth about 4.5 billion years ago. The resulting debris from both Earth and the impactor accumulated to form our natural satellite. The newly formed Moon was in a molten state, but within about 100 million years, most of the global "magma ocean" had crystallized, with less-dense rocks floating upward and eventually forming the lunar crust.',
      ],
    },
    related: [
      "sc_lcross",
      "sc_grail_a",
      "sc_grail_b",
      "sc_ladee",
      "sc_clementine",
      "sc_lunar_prospector",
    ],
  },
  mundilfari: {
    title: "Mundilfari",
    description: {
      blurb: [
        "Mundilfari was discovered in 2000 using the 3.6-m Canada-France-Hawaii reflector on Mauna Kea in Hawaii, with adaptive optics.",
      ],
      more: [
        'Mundilfari has a mean radius of 2.2 miles (3.5 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. It orbits Saturn at an inclination of about 169 degrees and an eccentricity of about 0.2. At a mean distance of 11.6 million miles (18.7 million kilometers) from Saturn, the moon takes about 953 Earth days to complete one orbit. Mundilfari is a member of the Norse group of moons. These "irregular" moons have retrograde orbits around Saturn -- traveling around in the opposite direction from the planet\'s rotation. Mundilfari and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn\'s other irregular moons, Mundilfari is thought to be an object that was captured by Saturn\'s gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2000 S9, Mundilfari was named for the father of two beautiful children in Norse mythology, a son whom he named "Moon" and a daughter whom he named "Sun."',
      ],
    },
    related: [],
  },
  naiad: {
    title: "Naiad",
    description: {
      blurb: [
        "Potato-shaped Naiad is most likely made up of fragments of Neptune's original satellites, which were smashed up by disturbances when the ice giant captured its largest moon, Triton. It is probable that Naiad has not been modified by any internal geological processes since its formation.",
        "Naiad orbits close to Neptune. The small moon circles the planet every seven hours and six minutes in a decaying orbit; Naiad may eventually crash into Neptune's atmosphere or be torn apart and form a planetary ring.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  namaka: {
    title: "Namaka",
    description: {
      blurb: ["Namaka is the smaller, inner moon of the dwarf planet Haumea."],
      more: [
        "Namaka was discovered on 30 June 2005 and announced on 29 November 2005, and is named after the goddess of the sea in Hawaiian mythology and one of the daughters of Haumea.",
      ],
    },
    related: [],
  },
  narvi: {
    title: "Narvi",
    description: {
      blurb: [
        "Narvi was discovered on April 8, 2003 by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna, from photos taken from Feb. 5 to 3 April 3.",
      ],
      more: [
        "Narvi has a mean radius of 2.2 miles (3.5 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 143 degrees and an eccentricity of about 0.4. At a mean distance of 12.1 million miles (19.4 million kilometers) from Saturn, the moon takes about 1,004 Earth days to complete one orbit. Narvi is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn -- traveling around in the opposite direction from the planet's rotation. Narvi and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Narvi is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Narvi appears to be a member of a subgroup with Bestla. Originally called S/2003 S1, Narvi was named for a son of Loki in Norse mythology.",
      ],
    },
    related: [],
  },
  nix: {
    title: "Nix",
    description: {
      blurb: [
        "Nix is the inner of the two moons discovered orbiting Pluto in 2005 by the Hubble Space Telescope.",
      ],
      more: [
        "Nix and Hydra are roughly 5,000 times fainter than Pluto and are about two to three times farther from Pluto than its large moon, Charon, which was discovered in 1978. Nix and Hydra are roughly 20 to 70 miles (32 to 113 km) wide.They are so small and so faint that scientists combined a short exposure of Pluto and Charon and a long exposure of Nix and Hydra to create images of them all together. Nix was named for the Greek goddess of darkness and night and mother of Charon.",
      ],
    },
    related: ["sc_hubble_space_telescope", "sc_new_horizons"],
  },
  nereid: {
    title: "Nereid",
    description: {
      blurb: [
        "Nereid is one of the outermost of Neptune's known moons and is among the largest.",
      ],
      more: [
        "Nereid is unique because it has one of the most eccentric orbits of any moon in our solar system. Nereid is so far from Neptune that it requires 360 Earth days to make one orbit. This odd orbit suggests that Nereid may be a captured asteroid or Kuiper Belt object or that it was greatly disturbed during the capture of Neptune's largest moon Triton.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  neso: {
    title: "Neso",
    description: {
      blurb: [
        "Very little is known about Neso, another of Neptune's extremely distant irregular moons. Neso's eccentric orbit takes it millions of kilometers from the ice giant. The moon's orbit is among the most distant from its planet than any other known moon in our solar system.",
        "The small moon shares similar orbital parameters with another moon of Neptune -- Psamathe. Both Neso and Psamathe may be fragments from the break-up of a larger moon billions of years ago.",
      ],
    },
    related: [],
  },
  oberon: {
    title: "Oberon",
    description: {
      blurb: ["Oberon is the second largest moon of Uranus."],
      more: [
        "Discovered in 1787, little was known about this moon until Voyager 2 passed it during its flyby of Uranus in January 1986. Oberon is heavily cratered―similar to Umbriel―especially when compared to three other moons of Uranus: Ariel, Titania and Miranda. Like all of Uranus' large moons, Oberon is composed of roughly half ice and half rock. Oberon has at least one large mountain that rises about 6 km off the surface. The moon was named for the king of the fairies in Shakespeare's \"A Midsummer Night's Dream.\"",
      ],
    },
    related: ["sc_voyager_2"],
  },
  ophelia: {
    title: "Ophelia",
    description: {
      blurb: [
        "Ophelia was discovered in January 1986 in images sent back by the Voyager 2 spacecraft during its flyby of Uranus.",
      ],
      more: [
        "Ophelia is one of the small inner moons of Uranus. Ophelia appears to be the outer satellite straddling Uranus' bright Epsilon ring. Ophelia and Cordelia are believed to herd the ring material into shape and keep it from drifting into space. All of Uranus' inner moons (those observed by Voyager 2) appear to be roughly half water ice and half rock. This moon was originally designated S/1986 U8, but was later renamed for the character of Ophelia in Shakespeare's \"Hamlet.\" Ophelia is the daughter of Polonius and fiance of Hamlet in the play.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  orthosie: {
    title: "Orthosie",
    description: {
      blurb: [
        "Orthosie is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin",
      ],
      more: [
        "The group probably began as an asteroid that was captured by Jupiter's gravity and then suffered a collision which broke off a number of pieces. The largest remaining chunk was named \"Ananke,\" and the smaller pieces became the other 15 moons in the Ananke group. All of the Ananke moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and rather highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Ananke satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Ananke members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Orthosie has a mean radius of about 0.6 miles (one kilometer), assuming an albedo of 0.04. At a mean distance of about 13.1 million miles (21.2 million kilometers) from Jupiter, it takes about 623 Earth days to complete one orbit. Originally called S/2001 J9, Orthosie was named for one of the Horae, who were daughters of Jupiter and Themis, a Titaness, in Roman mythology. Orthosie means luck.",
      ],
    },
    related: [],
  },
  paaliaq: {
    title: "Paaliaq",
    description: {
      blurb: [
        "Paaliaq was discovered on Aug. 7, 2000 at the European Southern Observatory in La Silla, Chile.",
      ],
      more: [
        "Paaliaq has a mean radius of 6.8 miles (11 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. At a mean distance of 9.3 million miles (15.0 million kilometers) from Saturn, the moon takes about 688 Earth days to complete one orbit. It has the most eccentric orbit around Saturn, meaning that its orbit is shaped like an oval. Paaliaq is one of five known members of the Inuit group of moons, which orbit Saturn at a mean distance of 7 to 11 million miles (11 to 18 million kilometers), at inclinations between 40 and 50 degrees from the plane of Saturn's equator, and with eccentricities of 0.15 to 0.48. (A moon's eccentricity is a number between 0 and 1 which describes the shape of the orbit. The closer to 0, the more circular it is; the closer to 1, the more elongated.) Observations by Tommy Grav and James Bauer using telescopes on Mauna Kea, Hawaii in 2006 (before the discovery of Tarqeq) found that Kiviuq, Siarnaq and Paaliaq all are light red with similar infrared features, further supporting the idea of a common origin. Originally called S/2000 S2, Paaliaq was named for a fictional Inuit shaman in the book, \"The Curse of the Shaman,\" by Michael Arvaarluk Kusugak and Vladyana Langer Krykorka.",
      ],
    },
    related: [],
  },
  pallene: {
    title: "Pallene",
    description: {
      blurb: [
        "The Cassini imaging team discovered Pallene on June 1, 2004. Pallene and nearby Methone were the first moons discovered in Cassini images.",
      ],
      more: [
        "Pallene (pronounced pal-lee-nee, adjective: Pallenean) is a tiny moon, with a mean radius of 1.6 miles (2.5 kilometers), that orbits between Mimas and Enceladus at about 132,000 miles (212,000 kilometers) from Saturn. Scientists have two theories to explain the presence of Pallene and two other tiny sister moons, Methone and Anthe. First, the three moons may have split from either Mimas or Enceladus. Second, all five moons may be the remains of a larger swarm that traveled in that area close to Saturn. Pallene circles Saturn in approximately 27.7 hours. Because Pallene and its two sister moons orbit at very similar distances from Saturn, they are in a dynamical relationship. Mimas strongly perturbs Pallene, the 2-mile (3-kilometer) diameter moon Methone and the 1-mile (2-kilometer) diameter moon Anthe, all of which orbit between Mimas and the next major moon, Enceladus. The vastly more massive Mimas causes the orbits of the tiny moons to vary by as much as 12.4 miles (20 kilometers). Together, these three moons may also be contributing particles to Saturn's E-ring. Pallene shares its orbit with a faint dust ring around Saturn, now called the Pallene Ring. This ring may be made of particles blasted off Pallene's surface by meteoroid impacts. The name Pallene comes from the name in Greek mythology of one of seven Alkyonides, daughters of the god (or Titan) Alkyoneus who was born of Gaia and the blood of Uranus.",
      ],
    },
    related: ["sc_cassini"],
  },
  pan: {
    title: "Pan",
    description: {
      blurb: [
        "Pan was discovered by M.R. Showalter in 1990 using images taken by the Voyager 2 spacecraft nine years earlier.",
      ],
      more: [
        "Pan, the innermost of Saturn's known moons, has a mean radius of 8.8 miles (14.1 kilometers) and orbits 83,000 miles (134,000 kilometers) away from Saturn, within the Encke Gap of Saturn's A-ring. As it orbits Saturn every 13.8 hours, it acts as a shepherd moon and is responsible for keeping the Encke Gap open. The gap is a 200 mile (325 kilometer) opening in Saturn's A ring. Pan creates stripes, called \"wakes,\" in the ring material on either side of it. Since ring particles closer to Saturn than Pan move faster in their orbits, these particles pass the moon and receive a gravitational \"kick\" from Pan as they do. This kick causes waves to develop in the gap and also throughout the ring, extending hundreds of miles into the rings. These waves intersect downstream to create the wakes, places where ring material has bunched up in an orderly manner thanks to Pan's gravitational kick. Pan, like Saturn's moon Atlas, has a prominent equatorial ridge that gives it a distinctive flying saucer shape. Moons of Saturn were originally named for Greco-Roman Titans and descendants of the Titans. But as many new moons were discovered scientists began selecting names from more mythologies, including Gallic, Inuit and Norse stories. Pan, a satyr (a creature resembling a man with the hind legs and hooves of a goat), is a Greek god of nature and the forest.",
      ],
    },
    related: ["sc_cassini"],
  },
  pandia: {
    title: "Pandia",
    description: {
      blurb: [
        "This tiny moon of Jupiter was first spotted in 2017 and originally designated S/2017 J4.",
      ],
      more: [
        "The discovery announcement was made in July 2018. Pandia is the daughter of Zeus and the Moon goddess Selene. Pandia is the goddess of the full moon and the sister of Ersa.",
      ],
    },
    related: [],
  },
  pandora: {
    title: "Pandora",
    description: {
      blurb: [
        "Pandora was discovered in October 1980 by the Voyager 1 science team.",
      ],
      more: [
        'Pandora, a potato-shaped moon, is coated in a fine (dust-sized) icy material. Even the craters on Pandora are coated in debris, a stark contrast to the crisply-defined craters of other moons, such as Hyperion. Curious grooves and ridges also appear to cross the surface of the small moon. Pandora is interesting because it tends to disrupt the F ring, while Prometheus helps to keep the primary ring in place. Pandora is about 25.3 miles (40.7 kilometers) in mean radius. It orbits 88,000 miles (142,000 kilometers) away from Saturn, near the F ring, taking 15.1 hours to go around Saturn. Moons of Saturn were originally named for Greco-Roman Titans and descendants of the Titans. But as many new moons were discovered scientists began selecting names from more mythologies, including Gallic, Inuit and Norse stories. Originally called S/1980 S26, Pandora was renamed in 1985. In mythology, Pandora (pan-DOR-uh) was a work of art who was transformed into a human by the gods. Her curiosity was said to have loosed all manner of ills upon the world when she let evil creatures out of a locked box; however, she is also responsible for hope entering the world ("hope" had been the last "creature" in the box).',
      ],
    },
    related: ["sc_voyager_1", "sc_voyager_2", "sc_cassini"],
  },
  pasiphae: {
    title: "Pasiphae",
    description: {
      blurb: [
        "Pasiphae was discovered on Jan. 27, 1908, by Philibert Jacques Melotte with the Greenwich Observatory's 30-inch Cassegrain telescope.",
      ],
      more: [
        "With a mean radius of 18.6 miles (30 kilometers), Pasiphae is the largest member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Pasiphae was probably an asteroid that was captured by Jupiter's gravity and then suffered a collision which broke off a number of pieces. Those pieces became at least some, and perhaps all, of the other moons commonly categorized as members of the Pasiphae group. All of the Pasiphae moons are retrograde, which means they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. All of these characteristics support the idea that the Pasiphae satellites began as one or more captured asteroids, rather than forming as part of the original Jupiter system. Both Pasiphae and Sinope are locked in secular resonances with Jupiter, which means that Jupiter's gravity tugs at them at regular intervals in a way that can modify their orbits over time. This could account for the differences in their orbits compared to each other and to other presumed members of the Pasiphae group. Pasiphae has a mean radius of 18.6 miles (30 kilometers), assuming an albedo of 0.04. At a mean distance of about 14.6 million miles (23.6 million kilometers) from Jupiter, the satellite takes about 744 Earth days to complete one orbit. Pasiphae was named for the wife of Minos, who was king of Crete.",
      ],
    },
    related: [],
  },
  pasithee: {
    title: "Pasithee",
    description: {
      blurb: [
        "Pasithee was discovered on Dec. 11, 2001, by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Pasithee is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99 percent of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. All of the Carme moons are retrograde, which means that they orbit Jupiter in the opposite direction from the planet's rotation. Their orbits are also eccentric (elliptical rather than circular) and highly inclined with respect to Jupiter's equatorial plane. They all are very similar in color -- light red -- except for Kalyke, which is considerably redder than the others. All of these characteristics support the idea that the Carme satellites began as a captured asteroid, rather than forming as part of the original Jupiter system. None of the Carme members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Pasithee has a mean radius of about one kilometer. At a mean distance of about 14 million miles (23 million kilometers) from Jupiter, the satellite takes about 719 Earth days to complete one orbit. Originally called S/2001 J6, Pasithee was named for one of the Graces, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter.",
      ],
    },
    related: [],
  },
  perdita: {
    title: "Perdita",
    description: {
      blurb: [
        "Perdita was discovered 13 years after its picture was taken by Voyager 2 during the spacecraft's flyby in 1986.",
      ],
      more: [
        "Perdita's orbit lies between those of Belinda and Puck, about 76,400 km from Uranus. It is believed to be about 30 km in diameter and very dark (albedo of about 0.08). Little else is known. University of Arizona's Erich Karkoschka found the moon in the public archive of Voyager 2 images when he compared them with those of the Hubble Space Telescope. The International Astronomical Union (IAU) recognized it as a moon of Uranus, but withdrew its designation as premature when subsequent efforts failed to observe it. Its existence was finally confirmed, however, in 2003, when the Hubble imaged an object right in Perdita's predicted location. Originally called S/1986 U10, Perdita was named for the daughter of Leontes and Hermione in William Shakespeare's play, \"The Winter's Tale.\" In the play Leontes initially refuses to believe that Perdita is his daughter because he thinks that his wife has had an affair with king Polixenes of Bohemia. Circumstances lead to Perdita being abandoned by her father and later found and raised by a Bohemian shepherd. 16 years later Bohemian Prince Florizel meets and falls in love with Perdita and it is revealed that she is the princess of Sicily. Perdita's father Leontes reconciles his differences with king Polixenes, and the marriage is ratified.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  philophrosyne: {
    title: "Philophrosyne",
    description: {
      blurb: [
        "Philophrosyne was discovered in April 2003 by Scott S. Sheppard at the Mauna Kea Observatory in Hawaii, and originally designated S/2003 J15.",
      ],
      more: [
        'Philophrosyne is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter\'s gravity and then suffered a collision which broke off a number of pieces. The largest remaining chunk was named "Ananke," and the smaller pieces became the other 15 moons in the Ananke group. Philophrosyne has a mean radius of less than a mile (about one kilometer), assuming an albedo of 0.04. At a mean distance of about 14 million miles (22.6 million kilometers) from Jupiter, it takes about 690 Earth days to complete one orbit.',
      ],
    },
    related: [],
  },
  phobos: {
    title: "Phobos",
    description: {
      blurb: [
        "Phobos is the larger of Mars' two moons. It orbits Mars three times a day, and is so close to the planet's surface that in some locations on Mars it cannot always be seen.",
      ],
      more: [
        "Phobos, gouged and nearly shattered by a giant impact crater and beaten by thousands of meteorite impacts, is on a collision course with Mars. Phobos is the larger of Mars' two moons and is 17 x 14 x 11 miles (27 by 22 by 18 kilometers) in diameter. Phobos is nearing Mars at a rate of six feet (1.8 meters) every hundred years; at that rate, it will either crash into Mars in 50 million years or break up into a ring. Its most prominent feature is the 6-mile (9.7 kilometer) crater Stickney, its impact causing streak patterns across the moon's surface. Stickney was seen by Mars Global Surveyor to be filled with fine dust, with evidence of boulders sliding down its sloped surface.",
      ],
    },
    related: [],
  },
  phoebe: {
    title: "Phoebe",
    description: {
      blurb: ["Phoebe is one of the furthest moons from Saturn."],
      more: [
        "Phoebe is one of Saturn's most intriguing moons, orbiting at a distance of 8,049,668 miles (12,952,000 kilometers) from the planet, almost four times the distance from Saturn than its nearest neighbor, the moon Iapetus. Phoebe and Iapetus are the only major moons in the Saturnian system that do not orbit closely to the plane of Saturn's equator. Phoebe is also located near a very faint ring of Saturn that was only discovered in 2009, called the Phoebe ring.",
        "Phoebe is roughly spherical and has a mean radius of about 66.2 miles (106.5 kilometers), about one-sixteenth the radius of Earth's Moon. Phoebe rotates on its axis every nine hours, and it completes a full orbit around Saturn in about 18 Earth months. Its irregular, elliptical orbit is inclined about 175 degrees to Saturn's equator. Phoebe's orbit is also retrograde, which means it goes around Saturn in the opposite direction than most other moons — as well as most objects in the solar system.",
        "Unlike most major moons orbiting Saturn, Phoebe is very dark and reflects only 6 percent of the sunlight it receives. Its darkness and irregular, retrograde orbit suggest Phoebe is most likely a captured object. A captured object is a celestial body that is trapped by the gravitational pull of a much bigger body, generally a planet. Phoebe's darkness, in particular, suggests that the small moon comes from the outer solar system, an area where there is plenty of dark material.",
        "Some scientists think Phoebe could be a captured Centaur. Centaurs are believed to be Kuiper Belt bodies that migrated into the inner solar system. Centaurs are found between the asteroid belt and the Kuiper Belt, and are considered a kind of intermediate type of small body, neither an asteroid nor a Kuiper Belt object. If Phoebe is indeed a captured Centaur, images and scientific data of Phoebe taken by the Cassini spacecraft will give scientists the first opportunity to study a Centaur. Centaurs are of extreme interest to scientists because they are believed to be primordial; that is, they appear to date from the formation of the solar system. These objects are the building blocks of the solar system, the leftovers that never pulled into a planet. And because of its relative small size, Phoebe might never have heated up enough to change its chemical composition — which increases the scientific value of its study.",
      ],
    },
    related: ["sc_voyager_2", "sc_cassini"],
  },
  polydeuces: {
    title: "Polydeuces",
    description: {
      blurb: [
        "Polydeuces was discovered by the Cassini mission team on Oct. 21, 2004, and upon further review of Cassini images, scientists found it in images from April 9 of the same year.",
      ],
      more: [
        'Polydeuces is a small moon with a mean radius of just 0.8 miles (1.3 kilometers) orbiting Saturn at a distance of about 234,000 miles (377,000 kilometers), taking 2.7 Earth days to go around the planet. Polydeuces is an example of a so-called "Trojan" moon — it follows a larger moon in orbit around the planet (in the case of Polydeuces, the larger moon is Dione). Polydeuces is a trailing co-orbital of Dione, while the moon Helene is the leading co-orbital. Trojan moons are found near stable "Lagrangian points" — places where the gravitational pull of the planet and the larger moon become balanced. The Trojans are situated 60 degrees ahead or behind the larger moon in its orbit. It is believed that Polydeuces can get as close as 39 degrees to Dione and then drift as far as 92 degrees from it, taking over two years to complete its journey around the Lagrange point. If verified, the extent of this wandering is the largest detected so far for any Trojan moon. Originally designated S/2004 S5, Polydeuces (another name for Pollux) is named for the son of Leda and Zeus.',
      ],
    },
    related: ["sc_cassini"],
  },
  portia: {
    title: "Portia",
    description: {
      blurb: [
        "Portia was discovered January 1986 in images sent back by the Voyager 2 spacecraft during its flyby of Uranus.",
      ],
      more: [
        "Very little is known about Uranus' small and fast-moving moon Portia. It is known that Portia has a diameter of 140 km, making it one of the largest of Uranus' lesser satellites. It is also known that Portia orbits Uranus in less than one Earth day. This moon is named after Portia, the heroine of William Shakespeare's 16th century play \"The Merchant of Venice.\" It was originally designated S/1986 U 1",
      ],
    },
    related: ["sc_voyager_2"],
  },
  praxidike: {
    title: "Praxidike",
    description: {
      blurb: [
        "Praxidike was discovered on Nov. 23, 2000, by Scott S. Sheppard, David C. Jewitt, Yanga R. Fernandez, and Eugene Magnier at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        'Praxidike is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter\'s gravity and then suffered a collision which broke off a number of pieces. The largest remaining chunk was named "Ananke," and the smaller pieces became the other 15 moons in the Ananke group. If Ananke, with a mean radius of 8.7 miles (14 kilometers), is considered the slightly diminished original asteroid, then Praxidike, with a mean radius of 2 miles (3.4 kilometers), assuming an albedo of 0.04, is the largest chip that was knocked off the asteroid. Praxidike is colored a similar gray to two other moons in the Ananke family: Harpalyke and Iocaste. At a mean distance of about 13 million miles (21.1 million kilometers) from Jupiter, Praxidike takes about 625 Earth days to complete one orbit. Originally called S/2000 J7, Praxidike was named for the Greek goddess of justice or punishment. She was the mother of Klesios, Harmonia and Arete by Zeus, the Greek equivalent of the Roman god Jupiter.',
      ],
    },
    related: [],
  },
  prometheus: {
    title: "Prometheus",
    description: {
      blurb: [
        "The Voyager 1 science team discovered Prometheus in October 1980.",
      ],
      more: [
        "Prometheus acts as a shepherding moon, constraining the extent of the inner edge of Saturn's F Ring. Prometheus is extremely irregular and has visible craters — some up to 12.4 miles (20 kilometers) in diameter. However, it is much less cratered than its nearby neighbors Pandora, Janus and Epimetheus. The density of Prometheus has been estimated to be low; it is probably a porous, icy body. The potato-shaped moon is about 26.8 miles (43.1 kilometers) in mean radius, orbiting Saturn at a distance of 87,000 miles (139,000 kilometers), taking 14.7 hours to go around the planet. Moons of Saturn were originally named for Greco-Roman Titans and descendants of the Titans. But as many new moons were discovered scientists began selecting names from more mythologies, including Gallic, Inuit and Norse stories. Originally designated S/1980 S27, Prometheus [pro-MEE-thee-us] is named for the son of the Titan Iapetus and brother of Atlas and Epimetheus. He is best known in Greek mythology for stealing fire from the gods and giving it to humanity.",
      ],
    },
    related: ["sc_voyager_1", "sc_cassini"],
  },
  prospero: {
    title: "Prospero",
    description: {
      blurb: [
        "Prospero is a small, dark, irregular moon that orbits Uranus in the opposite direction from the regular satellites and the rotation of the planet, itself (known as a retrograde orbit).",
      ],
    },
    related: [],
  },
  proteus: {
    title: "Proteus",
    description: {
      blurb: ["Proteus was discovered in 1989 by the Voyager 2 spacecraft."],
      more: [
        "Proteus is one of the largest of Neptune's known moons, although it is not as big as Triton. The moon has an odd box-like shape and if it had just a little more mass it would be able to transform into a sphere. Proteus orbits Neptune about every 27 hours.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  psamathe: {
    title: "Psamathe",
    description: {
      blurb: [
        "Psamathe is so distant from Neptune it takes almost 26 Earth years to make a single orbit around the ice giant. The moon's orbit is among the most distant from its planet than any other known moon in our solar system.",
        "The small moon shares similar orbital parameters with with another moon of Neptune -- Neso. Both Psamathe and Neso may be fragments from the break-up of a larger moon billions of years ago.",
      ],
    },
    related: [],
  },
  puck: {
    title: "Puck",
    description: {
      blurb: [
        "Puck was discovered December 1985 in images sent back by the Voyager 2 spacecraft during its flyby of Uranus.",
      ],
      more: [
        "Puck is one of the small inner moons of Uranus. With a diameter of about 150 km (about 90 miles), Puck is the largest of Uranus' known lesser satellites. Puck orbits Uranus in less than one Earth day. Originally designated S/1985 U1, Puck is named for a mischievous sprite in William Shakespeare's \"A Midsummer Night's Dream.\"​",
      ],
    },
    related: ["sc_voyager_2"],
  },
  rhea: {
    title: "Rhea",
    description: {
      blurb: ["Rhea is the second largest moon of Saturn"],
      more: [
        "Rhea is a small, cold, airless body that is very similar to sister moons Dione and Tethys. As with the other two moons, Rhea is tidally locked in phase with its parent — one side always faces toward Saturn — as it completes its 4.5-Earth-day orbit around the planet. Rhea's surface temperatures are also similar to Dione and Tethys, being roughly as warm as -281 degrees Fahrenheit (-174 degrees Celsius) in sunlit areas and ranging down to -364 degrees Fahrenheit (-220 degrees Celsius) in shaded areas. Also like Dione and Tethys, Rhea has a high reflectivity (or geometric albedo) suggesting a surface composition largely of water ice, which behaves like rock in Rhea's temperature range. In 2008, the Cassini spacecraft found evidence of material orbiting Rhea — the first time rings had been found around a moon. A broad debris disk and at least one ring appear to have been detected by a suite of six instruments on Cassini specifically designed to study the atmospheres and particles around Saturn and its moons.",
      ],
    },
    related: ["sc_cassini", "sc_voyager_1", "sc_voyager_2"],
  },
  rosalind: {
    title: "Rosalind",
    description: {
      blurb: [
        "Rosalind was discovered by the Voyager 2 science team on 13 January 1986.",
      ],
      more: [
        "Little is known about Rosalind, one of several satellites discovered by Voyager 2 as it flew by Uranus in 1986. Rosalind is one of Uranus' inner moons and has a radius of about 22 miles (36 kilometers). Originally designated S/1986 U4, Rosalind was named for the daughter of a banished Duke in Shakespeare's play \"As You Like It.\"​",
      ],
    },
    related: ["sc_voyager_2"],
  },
  s_2003_j_10: {
    title: "S/2003 J 10",
    description: {
      blurb: [
        "S/2003 J 10 was discovered in February 2003 at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "S/2003 J 10 has a mean radius of less than a mile, or about one kilometer. At a mean distance of about 14 million miles (23 million kilometers) from Jupiter, the satellite takes about 716 Earth days to complete one orbit. S/2003 J10 was so designated because it is a satellite (S) that was discovered in 2003, and was the 10th satellite of Jupiter (J) to be found that year.",
      ],
    },
    related: [],
  },
  s_2003_j_12: {
    title: "S/2003 J 12",
    description: {
      blurb: [
        'The name "S/2003 J 12" means that it is a satellite (S) that was discovered in 2003 orbiting Jupiter (J), and that it was the 12th satellite of Jupiter discovered that year.',
      ],
      more: [
        "At a distance of about 11 million miles (17.8 million kilometers) from Jupiter, S/2003 J12 is the innermost of the known retrograde satellites (those which orbit Jupiter in the opposite direction from the planet's rotation). It takes almost 490 Earth days tocomplete one orbit, and its orbit is highly inclined with respect to Jupiter's equatorial plane. S/2003 J12 is less than a mile across ( about one kilometer), assuming an albedo of 0.04).",
      ],
    },
    related: [],
  },
  s_2003_j_16: {
    title: "S/2003 J 16",
    description: {
      blurb: [
        "S/2003 J 16 was discovered in April 2003 by Brett J. Gladman at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "S/2003 J 16 is a member of the Ananke group. S/2003 J16 has a mean radius of about one kilometer (assuming an albedo of 0.04). At a mean distance of about 13 million miles (20.9 million kilometers) from Jupiter, it takes about 616 Earth days to complete one orbit.",
      ],
    },
    related: [],
  },
  s_2003_j_2: {
    title: "S/2003 J 2",
    description: {
      blurb: [
        "This moon of Jupiter, like many others, was discovered in February or March 2003 at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "This satellite has a mean radius of 1 km, assuming an albedo of 0.04. At a mean distance of about 18 million miles (28.3 million kilometers) from Jupiter, the satellite takes about 979 Earth days to complete one orbit.",
      ],
    },
    related: [],
  },
  s_2003_j_23: {
    title: "S/2003 J 23",
    description: {
      blurb: [
        "This moon of Jupiter, like many others, was discovered in 2003 at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "S/2003 J 23 is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. S/2003 J 23 has a mean radius of less than a mile (about one kilometer), assuming an albedo of 0.04. At a mean distance of about 15 million miles (23.5 million kilometers) from Jupiter, the satellite takes about 732 Earth days to complete one orbit.",
      ],
    },
    related: [],
  },
  s_2003_j_24: {
    title: "S/2003 J 24",
    description: {
      blurb: [
        "This moon of Jupiter was independently discovered in 2021 using data from 2003.",
      ],
      more: [
        "S/2003 J 24 orbits Jupiter at an average distance of 23,088,000 km (0.15433 AU) in 715.4 days, at an inclination of 162° to the ecliptic, in a retrograde direction and with an eccentricity of 0.25. It belongs to the Carme group, made up of irregular retrograde moons orbiting Jupiter at a distance ranging between 23 and 24 Gm and at an inclination of about 165°.",
      ],
    },
    related: [],
  },
  s_2003_j_4: {
    title: "S/2003 J 4",
    description: {
      blurb: [
        "This moon of Jupiter, like many others, was discovered in 2003 at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "S/2003 J 4 is a member of the Pasiphae group, and has a mean radius of less than a mile (about 1 kilometer), assuming an albedo of 0.04. At a mean distance of about 15 million miles (23.9 million kilometers) from Jupiter, the satellite takes about 755 Earth days to complete one orbit.",
      ],
    },
    related: [],
  },
  s_2003_j_9: {
    title: "S/2003 J 9",
    description: {
      blurb: [
        "This moon of Jupiter, like many others, was discovered in 2003 at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "S/2003 J 9 is a member of the Carme group, and has a mean radius of about 1,600 feet (half a kilometer). At a mean distance of about 15 million miles (23.4 million kilometers) from Jupiter, the satellite takes about 733 Earth days to complete one orbit.",
      ],
    },
    related: [],
  },
  s_2004_s_7: {
    title: "S/2004 S 7",
    description: {
      blurb: [
        "S/2004 S 7 is a natural satellite of Saturn discovered in 2004. It was considered lost but was later recovered when observed again in 2022.",
      ],
      more: [
        "S/2004 S 7 is about 6 kilometres in diameter, and orbits Saturn in 1173.932 days.​",
      ],
    },
  },
  s_2004_s_12: {
    title: "S/2004 S 12",
    description: {
      blurb: [
        "S/2004 S 12 is a natural satellite of Saturn discovered in 2004. It was considered lost but was later recovered when observed again in 2022.",
      ],
      more: [
        "S/2004 S 12 is about 5 kilometres in diameter, and orbits Saturn in 1048.567 days.​",
      ],
    },
  },
  s_2004_s_13: {
    title: "S/2004 S 13",
    description: {
      blurb: [
        "S/2004 S 13 is a natural satellite of Saturn discovered in 2004. It was considered lost but was later recovered when observed again in 2022.",
      ],
      more: [
        "S/2004 S 13 is about 6 kilometres in diameter, and orbits Saturn in 905.848 days.​",
      ],
    },
  },
  s_2004_s_17: {
    title: "S/2004 S 17",
    description: {
      blurb: [
        "S/2004 S 17 is a natural satellite of Saturn discovered in 2004. It was considered lost but was later recovered when observed again in 2022.",
      ],
      more: [
        "S/2004 S 17 is about 4 kilometres in diameter, and orbits Saturn in 985.453 days, at an inclination of 167° to the ecliptic.​",
      ],
    },
  },
  s_2004_s_21: {
    title: "S/2004 S 21",
    description: {
      blurb: [
        "S/2004 S 21 is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "S/2004 S 21 is about 3 kilometres in diameter, and orbits Saturn at an average distance of 22,645 Gm in 1272.61 days, at an inclination of 160° to the ecliptic, in a retrograde direction and with an eccentricity of 0.318.​",
      ],
    },
  },
  s_2004_s_24: {
    title: "S/2004 S 24",
    description: {
      blurb: [
        "S/2004 S 24 is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "S/2004 S 24 is about 3 kilometres in diameter, and orbits Saturn in 1294.25 days, at an inclination of 35.5° to the ecliptic, in a prograde direction and with an eccentricity of 0.085.",
      ],
    },
  },
  s_2004_s_28: {
    title: "S/2004 S 28",
    description: {
      blurb: [
        "S/2004 S 28 is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "S/2004 S 28 is about 4 kilometres in diameter, and orbits Saturn in 1220.31 days, at an inclination of 170° to the ecliptic.",
      ],
    },
  },
  s_2004_s_31: {
    title: "S/2004 S 31",
    description: {
      blurb: [
        "S/2004 S 31 is a natural satellite of Saturn and a member of the Inuit group. It was announced in 2019 from observations made from 2004 to 2007.",
      ],
      more: [
        "S/2004 S 31 is about 4 kilometres in diameter, and orbits Saturn in 869.65 days.",
      ],
    },
  },
  s_2004_s_36: {
    title: "S/2004 S 36",
    description: {
      blurb: [
        "S/2004 S 36 is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "S/2004 S 36 is about 3 kilometres in diameter, and orbits Saturn in 1319.07 days, at an inclination of 155° to the ecliptic, in a retrograde direction and with an eccentricity of 0.748, the highest of any of Saturn's moons.",
      ],
    },
  },
  s_2004_s_37: {
    title: "S/2004 S 37",
    description: {
      blurb: [
        "S/2004 S 37 is a natural satellite of Saturn. Its discovery was announced by Scott S. Sheppard, David C. Jewitt, and Jan Kleyna on October 8, 2019 from observations taken between December 12, 2004 and February 2, 2006.",
      ],
      more: [
        "S/2004 S 37 is about 4 kilometres in diameter, and orbits Saturn in 748.18 days.",
      ],
    },
  },
  s_2004_s_39: {
    title: "S/2004 S 39",
    description: {
      blurb: [
        "S/2004 S 39 is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "S/2004 S 39 is about 3 kilometres in diameter, and orbits Saturn in 1351.83 days, at an inclination of 167° to the ecliptic, in a retrograde direction and with an eccentricity of 0.080.",
      ],
    },
  },
  s_2004_s_40: {
    title: "S/2004 S 40",
    description: {
      blurb: [
        "S/2004 S 40 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 40 is about 4 kilometers in diameter and orbits Saturn at an average distance of 16.1 million km in 764.6 days. It has an inclination of 169.2° to the ecliptic in a retrograde direction with an eccentricity of 0.297.",
      ],
    },
    related: [],
  },
  s_2004_s_41: {
    title: "S/2004 S 41",
    description: {
      blurb: [
        "S/2004 S 41 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 41 is about 4 kilometers in diameter and orbits Saturn at an average distance of 18.1 million km in 914.61 days. It has an inclination of 165.7° to the ecliptic in a retrograde direction with an eccentricity of 0.300.",
      ],
    },
    related: [],
  },
  s_2004_s_42: {
    title: "S/2004 S 42",
    description: {
      blurb: [
        "S/2004 S 42 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 42 is about 4 kilometers in diameter and orbits Saturn at an average distance of 18.2 million km in 925.91 days. It has an inclination of 165.7° to the ecliptic in a retrograde direction with an eccentricity of 0.158.",
      ],
    },
    related: [],
  },
  s_2004_s_43: {
    title: "S/2004 S 43",
    description: {
      blurb: [
        "S/2004 S 43 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 43 is about 4 kilometers in diameter and orbits Saturn at an average distance of 18.9 million km in 980.08 days. It has an inclination of 171.1° to the ecliptic in a retrograde direction with an eccentricity of 0.432.",
      ],
    },
    related: [],
  },
  s_2004_s_44: {
    title: "S/2004 S 44",
    description: {
      blurb: [
        "S/2004 S 44 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 44 is about 5 kilometers in diameter and orbits Saturn at an average distance of 19.5 million km in 1026.16 days. It has an inclination of 167.7° to the ecliptic in a retrograde direction with an eccentricity of 0.129.",
      ],
    },
    related: [],
  },
  s_2004_s_45: {
    title: "S/2004 S 45",
    description: {
      blurb: [
        "S/2004 S 45 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 45 is about 4 kilometers in diameter and orbits Saturn at an average distance of 19.7 million km in 1038.7 days. It has an inclination of 154.0° to the ecliptic in a retrograde direction with an eccentricity of 0.551.",
      ],
    },
    related: [],
  },
  s_2004_s_46: {
    title: "S/2004 S 46",
    description: {
      blurb: [
        "S/2004 S 46 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 46 is about 3 kilometers in diameter and orbits Saturn at an average distance of 20.5 million km in 1107.58 days. It has an inclination of 177.2° to the ecliptic in a retrograde direction with an eccentricity of 0.249.",
      ],
    },
    related: [],
  },
  s_2004_s_47: {
    title: "S/2004 S 47",
    description: {
      blurb: [
        "S/2004 S 47 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 47 is about 4 kilometers in diameter and orbits Saturn at an average distance of 16.1 million km in 762.49 days. It has an inclination of 160.9° to the ecliptic in a retrograde direction with an eccentricity of 0.291.",
      ],
    },
    related: [],
  },
  s_2004_s_48: {
    title: "S/2004 S 48",
    description: {
      blurb: [
        "S/2004 S 48 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 48 is about 4 kilometers in diameter and orbits Saturn at an average distance of 22.1 million km in 1242.4 days. It has an inclination of 161.9° to the ecliptic in a retrograde direction with an eccentricity of 0.374.",
      ],
    },
    related: [],
  },
  s_2004_s_49: {
    title: "S/2004 S 49",
    description: {
      blurb: [
        "S/2004 S 49 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 49 is about 4 kilometers in diameter and orbits Saturn at an average distance of 22.4 million km in 1264.25 days. It has an inclination of 159.7° to the ecliptic in a retrograde direction with an eccentricity of 0.453.",
      ],
    },
    related: [],
  },
  s_2004_s_50: {
    title: "S/2004 S 50",
    description: {
      blurb: [
        "S/2004 S 50 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 50 is about 3 kilometers in diameter and orbits Saturn at an average distance of 22.3 million km in 1260.44 days. It has an inclination of 164.0° to the ecliptic in a retrograde direction with an eccentricity of 0.450.",
      ],
    },
    related: [],
  },
  s_2004_s_51: {
    title: "S/2004 S 51",
    description: {
      blurb: [
        "S/2004 S 51 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 51 is about 4 kilometers in diameter and orbits Saturn at an average distance of 25.2 million km in 1519.43 days. It has an inclination of 171.2° to the ecliptic in a retrograde direction with an eccentricity of 0.201.",
      ],
    },
    related: [],
  },
  s_2004_s_52: {
    title: "S/2004 S 52",
    description: {
      blurb: [
        "S/2004 S 52 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 52 is about 3 kilometers in diameter and orbits Saturn at an average distance of 26.4 million km in 1633.98 days. It has an inclination of 165.3° to the ecliptic in a retrograde direction with an eccentricity of 0.292.",
      ],
    },
    related: [],
  },
  s_2004_s_53: {
    title: "S/2004 S 53",
    description: {
      blurb: [
        "S/2004 S 53 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2004 S 53 is about 4 kilometers in diameter and orbits Saturn at an average distance of 23.3 million km in 1342.44 days. It has an inclination of 162.6° to the ecliptic in a retrograde direction with an eccentricity of 0.240.",
      ],
    },
    related: [],
  },
  s_2005_s_4: {
    title: "S/2005 S 4",
    description: {
      blurb: [
        "S/2005 S 4 is a natural satellite of Saturn, belonging to the Inuit group. It was discovered in 2005 and announced in 2023.",
      ],
      more: [
        "S/2005 S 4 is about 5 kilometers in diameter and orbits Saturn at an average distance of 11.3 million km in 450.22 days. It has an inclination of 48.0° to the ecliptic in a prograde direction with an eccentricity of 0.315.",
      ],
    },
    related: [],
  },
  s_2005_s_5: {
    title: "S/2005 S 5",
    description: {
      blurb: [
        "S/2005 S 5 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2005 and announced in 2023.",
      ],
      more: [
        "S/2005 S 5 is about 3 kilometers in diameter and orbits Saturn at an average distance of 21.4 million km in 1177.82 days. It has an inclination of 169.5° to the ecliptic in a retrograde direction with an eccentricity of 0.588.",
      ],
    },
    related: [],
  },
  s_2006_s_1: {
    title: "S/2006 S 1",
    description: {
      blurb: [
        "S/2006 S 1 is a natural satellite of Saturn, discovered in 2006.",
      ],
      more: [
        "S/2006 S 1 is about 6 kilometres in diameter, and orbits Saturn in 951.1 days, at an inclination of 154.6° to the ecliptic.",
      ],
    },
  },
  s_2006_s_10: {
    title: "S/2006 S 10",
    description: {
      blurb: [
        "S/2006 S 10 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 10 is about 3 kilometers in diameter and orbits Saturn at an average distance of 19.0 million km in 983.14 days. It has an inclination of 161.6° to the ecliptic in a retrograde direction with an eccentricity of 0.151.",
      ],
    },
    related: [],
  },
  s_2006_s_11: {
    title: "S/2006 S 11",
    description: {
      blurb: [
        "S/2006 S 11 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2004 and announced in 2023.",
      ],
      more: [
        "S/2006 S 11 is about 3 kilometers in diameter and orbits Saturn at an average distance of 19.7 million km in 1042.28 days. It has an inclination of 174.1° to the ecliptic in a retrograde direction with an eccentricity of 0.144.",
      ],
    },
    related: [],
  },
  s_2006_s_12: {
    title: "S/2006 S 12",
    description: {
      blurb: [
        "S/2006 S 12 is a natural satellite of Saturn, belonging to the Gallic group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 12 is about 4 kilometers in diameter and orbits Saturn at an average distance of 19.6 million km in 1035.05 days. It has an inclination of 38.6° to the ecliptic in a prograde direction with an eccentricity of 0.542.",
      ],
    },
    related: [],
  },
  s_2006_s_13: {
    title: "S/2006 S 13",
    description: {
      blurb: [
        "S/2006 S 13 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 13 is about 4 kilometers in diameter and orbits Saturn at an average distance of 20.0 million km in 1060.63 days. It has an inclination of 162.0° to the ecliptic in a retrograde direction with an eccentricity of 0.313.",
      ],
    },
    related: [],
  },
  s_2006_s_14: {
    title: "S/2006 S 14",
    description: {
      blurb: [
        "S/2006 S 14 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 14 is about 3 kilometers in diameter and orbits Saturn at an average distance of 21.1 million km in 1152.68 days. It has an inclination of 166.7° to the ecliptic in a retrograde direction with an eccentricity of 0.060.",
      ],
    },
    related: [],
  },
  s_2006_s_15: {
    title: "S/2006 S 15",
    description: {
      blurb: [
        "S/2006 S 15 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 15 is about 4 kilometers in diameter and orbits Saturn at an average distance of 21.8 million km in 1213.96 days. It has an inclination of 161.1° to the ecliptic in a retrograde direction with an eccentricity of 0.117.",
      ],
    },
    related: [],
  },
  s_2006_s_16: {
    title: "S/2006 S 16",
    description: {
      blurb: [
        "S/2006 S 16 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 16 is about 3 kilometers in diameter and orbits Saturn at an average distance of 21.7 million km in 1207.52 days. It has an inclination of 164.1° to the ecliptic in a retrograde direction with an eccentricity of 0.204.",
      ],
    },
    related: [],
  },
  s_2006_s_17: {
    title: "S/2006 S 17",
    description: {
      blurb: [
        "S/2006 S 17 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 17 is about 4 kilometers in diameter and orbits Saturn at an average distance of 22.4 million km in 1264.58 days. It has an inclination of 168.7° to the ecliptic in a retrograde direction with an eccentricity of 0.425.",
      ],
    },
    related: [],
  },
  s_2006_s_18: {
    title: "S/2006 S 18",
    description: {
      blurb: [
        "S/2006 S 18 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 18 is about 4 kilometers in diameter and orbits Saturn at an average distance of 22.8 million km in 1298.4 days. It has an inclination of 169.5° to the ecliptic in a retrograde direction with an eccentricity of 0.131.",
      ],
    },
    related: [],
  },
  s_2006_s_19: {
    title: "S/2006 S 19",
    description: {
      blurb: [
        "S/2006 S 19 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 19 is about 4 kilometers in diameter and orbits Saturn at an average distance of 23.8 million km in 1389.33 days. It has an inclination of 175.5° to the ecliptic in a retrograde direction with an eccentricity of 0.467.",
      ],
    },
    related: [],
  },
  s_2006_s_20: {
    title: "S/2006 S 20",
    description: {
      blurb: [
        "S/2006 S 20 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 20 is about 5 kilometers in diameter and orbits Saturn at an average distance of 13.2 million km in 567.27 days. It has an inclination of 173.1° to the ecliptic in a retrograde direction with an eccentricity of 0.206.",
      ],
    },
    related: [],
  },
  s_2006_s_3: {
    title: "S/2006 S 3",
    description: {
      blurb: [
        "S/2006 S 3 is a natural satellite of Saturn, discovered in 2006.",
      ],
      more: [
        "S/2006 S 3 is about 6 kilometres in diameter, and orbits Saturn at an average distance of 21,308,400 km in 1160.7 days, at an inclination of 152.8° to the ecliptic.",
      ],
    },
  },
  s_2006_s_9: {
    title: "S/2006 S 9",
    description: {
      blurb: [
        "S/2006 S 9 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2006 and announced in 2023.",
      ],
      more: [
        "S/2006 S 9 is about 3 kilometers in diameter and orbits Saturn at an average distance of 14.4 million km in 647.89 days. It has an inclination of 173.0° to the ecliptic in a retrograde direction with an eccentricity of 0.248.",
      ],
    },
    related: [],
  },
  s_2007_s_2: {
    title: "S/2007 S 2",
    description: {
      blurb: [
        "S/2007 S 2 is a natural satellite of Saturn, and was discovered in 2007.",
      ],
      more: [
        "S/2007 S 2 is about 6 kilometres in diameter, and orbits Saturn in 759.2 days.",
      ],
    },
  },
  s_2007_s_3: {
    title: "S/2007 S 3",
    description: {
      blurb: [
        "S/2007 S 3 is a natural satellite of Saturn discovered in 2007. It has not been seen since and is considered to be lost.",
      ],
      more: [
        "S/2007 S 3 is about 5 kilometres in diameter, and orbits Saturn at an average distance of 20,518,500 kilometres in about 1100 days.",
      ],
    },
  },
  s_2007_s_5: {
    title: "S/2007 S 5",
    description: {
      blurb: [
        "S/2007 S 5 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2007 and announced in 2023.",
      ],
      more: [
        "S/2007 S 5 is about 4 kilometers in diameter and orbits Saturn at an average distance of 15.8 million km in 746.88 days. It has an inclination of 158.4° to the ecliptic in a retrograde direction with an eccentricity of 0.104.",
      ],
    },
    related: [],
  },
  s_2007_s_6: {
    title: "S/2007 S 6",
    description: {
      blurb: [
        "S/2007 S 6 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2007 and announced in 2023.",
      ],
      more: [
        "S/2007 S 6 is about 3 kilometers in diameter and orbits Saturn at an average distance of 18.5 million km in 949.5 days. It has an inclination of 166.5° to the ecliptic in a retrograde direction with an eccentricity of 0.169.",
      ],
    },
    related: [],
  },
  s_2007_s_7: {
    title: "S/2007 S 7",
    description: {
      blurb: [
        "S/2007 S 7 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2007 and announced in 2023.",
      ],
      more: [
        "S/2007 S 7 is about 4 kilometers in diameter and orbits Saturn at an average distance of 15.9 million km in 754.29 days. It has an inclination of 169.2° to the ecliptic in a retrograde direction with an eccentricity of 0.217.",
      ],
    },
    related: [],
  },
  s_2007_s_8: {
    title: "S/2007 S 8",
    description: {
      blurb: [
        "S/2007 S 8 is a natural satellite of Saturn, belonging to the Gallic group. It was discovered in 2007 and announced in 2023.",
      ],
      more: [
        "S/2007 S 8 is about 4 kilometers in diameter and orbits Saturn at an average distance of 17.0 million km in 836.9 days. It has an inclination of 36.2° to the ecliptic in a prograde direction with an eccentricity of 0.490.",
      ],
    },
    related: [],
  },
  s_2007_s_9: {
    title: "S/2007 S 9",
    description: {
      blurb: [
        "S/2007 S 9 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2007 and announced in 2023.",
      ],
      more: [
        "S/2007 S 9 is about 4 kilometers in diameter and orbits Saturn at an average distance of 20.2 million km in 1078.07 days. It has an inclination of 159.3° to the ecliptic in a retrograde direction with an eccentricity of 0.360.",
      ],
    },
    related: [],
  },
  s_2009_s_1: {
    title: "S/2009 S 1",
    description: {
      blurb: [
        'S/2009 S 1 is a "propeller moonlet" of Saturn orbiting at a distance of 117,000 km (73,000 mi), in the outer part of the B Ring, and with a diameter of 300 m (1,000 ft).',
      ],
      more: [
        "The moonlet was discovered by the Cassini Imaging Team on 26 July 2009, when it cast a shadow 36 km (22 mi) long onto the B Ring. S/2009 S 1 protrudes 150 m (500 ft) north of the ring.",
      ],
    },
  },
  s_2011_j_3: {
    title: "S/2011 J 3",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2011 but only announced in late 2022.",
      ],
      more: [
        "S/2011 J 3 is part of the Himalia group, a tight cluster of prograde irregular moons of Jupiter that follow similar orbits to Himalia at semi-major axes between 11–12 million km (6.8–7.5 million mi) and inclinations between 26–31°.[3] With an estimated diameter of 3 km (1.9 mi) for an absolute magnitude of 16.3, it is among the smallest known members of the Himalia group.",
      ],
    },
    related: [],
  },
  s_2016_j_3: {
    title: "S/2016 J 3",
    description: {
      blurb: [
        "S/2016 J 3 is a small outer natural satellite of Jupiter discovered in 2016 but only announced and confirmed in early 2023.",
      ],
      more: [
        "S/2016 J 3 is part of the Carme group, a tight cluster of retrograde irregular moons of Jupiter that follow similar orbits to Carme at semi-major axes between 22–24 million km (14–15 million mi), orbital eccentricities between 0.2–0.3, and inclinations between 163–166°. It has a diameter of about 2 km (1.2 mi) for an absolute magnitude of 16.7.",
      ],
    },
    related: [],
  },
  s_2016_j_4: {
    title: "S/2016 J 4",
    description: {
      blurb: [
        "S/2016 J 4 is a small outer natural satellite of Jupiter discovered in 2016 but only announced and confirmed in early 2023.",
      ],
      more: [
        "S/2016 J 4 is part of the Pasiphae group, a dispersed cluster of distant retrograde irregular moons of Jupiter that follow similar orbits to Pasiphae at semi-major axes between 22–25 million km (14–16 million mi), orbital eccentricities between 0.2–0.6, and inclinations between 140–160°. It has a diameter of about 1 km (0.62 mi) for an absolute magnitude of 17.3, making it one of Jupiter's smallest known moons.",
      ],
    },
    related: [],
  },
  s_2018_j_2: {
    title: "S/2018 J 2",
    description: {
      blurb: [
        "S/2018 J 2 is a small outer natural satellite of Jupiter discovered in 2018 but only announced in late 2022.",
      ],
      more: [
        "S/2018 J 2 is part of the Himalia group, a tight cluster of prograde irregular moons of Jupiter that follow similar orbits to Himalia at semi-major axes between 11–12 million km (6.8–7.5 million mi) and inclinations between 26–31°. With an estimated diameter of 3 km (1.9 mi) for an absolute magnitude of 16.5, it is among the smallest known members of the Himalia group.",
      ],
    },
    related: [],
  },
  s_2018_j_3: {
    title: "S/2018 J 3",
    description: {
      blurb: [
        "S/2018 J 3 is a small outer natural satellite of Jupiter discovered in 2018 but only announced in early 2023.",
      ],
      more: [
        "S/2018 J 3 is part of the Carme group, a tight cluster of retrograde irregular moons of Jupiter that follow similar orbits to Carme at semi-major axes between 22–24 million km (14–15 million mi), orbital eccentricities between 0.2–0.3, and inclinations between 163–166°. It has a diameter of about 1 km (0.62 mi) for an absolute magnitude of 17.3, making it one of Jupiter's smallest known moons.",
      ],
    },
    related: [],
  },
  s_2018_j_4: {
    title: "S/2018 J 4",
    description: {
      blurb: [
        "S/2018 J 4 is a small outer natural satellite of Jupiter discovered in 2018 but only announced in early 2023.",
      ],
      more: [
        "S/2018 J 4 is an irregular moon of Jupiter on an highly inclined prograde orbit at an angle of 53° with respect to the ecliptic plane. It belongs to the same group as the similarly-inclined moon Carpo, which was long thought to be an outlier until the discovery of S/2018 J 4. S/2018 J 4's orbit is highly variable over time due to gravitational perturbations by the Sun and other planets. On average, S/2018 J 4's orbit has a semi-major axis of 16.3 million km (10.1 million mi), an eccentricity of 0.18, and a very high inclination of 50° with respect to the ecliptic.",
      ],
    },
    related: [],
  },
  s_2019_s_1: {
    title: "S/2019 S 1",
    description: {
      blurb: [
        "S/2019 S 1 is a natural satellite of Saturn, belonging to the Inuit group. It was discovered in 2019 and announced in 2021.",
      ],
      more: [
        "S/2019 S 1 is about 5 kilometers in diameter and orbits Saturn at an average distance of 11.2 million km in 445.513 days. It has an inclination of 49.5° to the ecliptic in a prograde direction and with an eccentricity of 0.623.",
      ],
    },
    related: [],
  },
  s_2019_s_10: {
    title: "S/2019 S 10",
    description: {
      blurb: [
        "S/2019 S 10 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 10 is about 3 kilometers in diameter and orbits Saturn at an average distance of 20.7 million km in 1123.04 days. It has an inclination of 163.9° to the ecliptic in a retrograde direction with an eccentricity of 0.249.",
      ],
    },
    related: [],
  },
  s_2019_s_11: {
    title: "S/2019 S 11",
    description: {
      blurb: [
        "S/2019 S 11 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 11 is about 4 kilometers in diameter and orbits Saturn at an average distance of 20.7 million km in 1115.0 days. It has an inclination of 144.6° to the ecliptic in a retrograde direction with an eccentricity of 0.513.",
      ],
    },
    related: [],
  },
  s_2019_s_12: {
    title: "S/2019 S 12",
    description: {
      blurb: [
        "S/2019 S 12 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 12 is about 4 kilometers in diameter and orbits Saturn at an average distance of 20.9 million km in 1138.85 days. It has an inclination of 167.1° to the ecliptic in a retrograde direction with an eccentricity of 0.476.",
      ],
    },
    related: [],
  },
  s_2019_s_13: {
    title: "S/2019 S 13",
    description: {
      blurb: [
        "S/2019 S 13 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 13 is about 3 kilometers in diameter and orbits Saturn at an average distance of 21.0 million km in 1144.92 days. It has an inclination of 177.3° to the ecliptic in a retrograde direction with an eccentricity of 0.318.",
      ],
    },
    related: [],
  },
  s_2019_s_14: {
    title: "S/2019 S 14",
    description: {
      blurb: [
        "S/2019 S 14 is a natural satellite of Saturn, belonging to the Inuit group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 14 is about 4 kilometers in diameter and orbits Saturn at an average distance of 17.9 million km in 893.14 days. It has an inclination of 46.2° to the ecliptic in a prograde direction with an eccentricity of 0.172.",
      ],
    },
    related: [],
  },
  s_2019_s_15: {
    title: "S/2019 S 15",
    description: {
      blurb: [
        "S/2019 S 15 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 15 is about 3 kilometers in diameter and orbits Saturn at an average distance of 21.2 million km in 1161.54 days. It has an inclination of 157.7° to the ecliptic in a retrograde direction with an eccentricity of 0.257.",
      ],
    },
    related: [],
  },
  s_2019_s_16: {
    title: "S/2019 S 16",
    description: {
      blurb: [
        "S/2019 S 16 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 16 is about 3 kilometers in diameter and orbits Saturn at an average distance of 23.3 million km in 1341.17 days. It has an inclination of 162.0° to the ecliptic in a retrograde direction with an eccentricity of 0.250.",
      ],
    },
    related: [],
  },
  s_2019_s_17: {
    title: "S/2019 S 17",
    description: {
      blurb: [
        "S/2019 S 17 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 17 is about 4 kilometers in diameter and orbits Saturn at an average distance of 22.7 million km in 1291.39 days. It has an inclination of 155.5° to the ecliptic in a retrograde direction with an eccentricity of 0.546.",
      ],
    },
    related: [],
  },
  s_2019_s_18: {
    title: "S/2019 S 18",
    description: {
      blurb: [
        "S/2019 S 18 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 18 is about 3 kilometers in diameter and orbits Saturn at an average distance of 23.1 million km in 1327.06 days. It has an inclination of 154.6° to the ecliptic in a retrograde direction with an eccentricity of 0.509.",
      ],
    },
    related: [],
  },
  s_2019_s_19: {
    title: "S/2019 S 19",
    description: {
      blurb: [
        "S/2019 S 19 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 19 is about 3 kilometers in diameter and orbits Saturn at an average distance of 23.0 million km in 1318.05 days. It has an inclination of 151.8° to the ecliptic in a retrograde direction with an eccentricity of 0.458.",
      ],
    },
    related: [],
  },
  s_2019_s_2: {
    title: "S/2019 S 2",
    description: {
      blurb: [
        "S/2019 S 2 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 2 is about 3 kilometers in diameter and orbits Saturn at an average distance of 16.6 million km in 799.82 days. It has an inclination of 173.3° to the ecliptic in a retrograde direction with an eccentricity of 0.279.",
      ],
    },
    related: [],
  },
  s_2019_s_20: {
    title: "S/2019 S 20",
    description: {
      blurb: [
        "S/2019 S 20 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 20 is about 3 kilometers in diameter and orbits Saturn at an average distance of 23.7 million km in 1375.45 days. It has an inclination of 156.1° to the ecliptic in a retrograde direction with an eccentricity of 0.354.",
      ],
    },
    related: [],
  },
  s_2019_s_21: {
    title: "S/2019 S 21",
    description: {
      blurb: [
        "S/2019 S 21 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 21 is about 4 kilometers in diameter and orbits Saturn at an average distance of 26.4 million km in 1636.32 days. It has an inclination of 171.9° to the ecliptic in a retrograde direction with an eccentricity of 0.155.",
      ],
    },
    related: [],
  },
  s_2019_s_3: {
    title: "S/2019 S 3",
    description: {
      blurb: [
        "S/2019 S 3 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 3 is about 4 kilometers in diameter and orbits Saturn at an average distance of 17.1 million km in 837.74 days. It has an inclination of 166.9° to the ecliptic in a retrograde direction with an eccentricity of 0.249.",
      ],
    },
    related: [],
  },
  s_2019_s_4: {
    title: "S/2019 S 4",
    description: {
      blurb: [
        "S/2019 S 4 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 4 is about 3 kilometers in diameter and orbits Saturn at an average distance of 18.0 million km in 904.26 days. It has an inclination of 170.1° to the ecliptic in a retrograde direction with an eccentricity of 0.409.",
      ],
    },
    related: [],
  },
  s_2019_s_5: {
    title: "S/2019 S 5",
    description: {
      blurb: [
        "S/2019 S 5 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 5 is about 3 kilometers in diameter and orbits Saturn at an average distance of 19.1 million km in 990.38 days. It has an inclination of 158.8° to the ecliptic in a retrograde direction with an eccentricity of 0.215.",
      ],
    },
    related: [],
  },
  s_2019_s_6: {
    title: "S/2019 S 6",
    description: {
      blurb: [
        "S/2019 S 6 is a natural satellite of Saturn, belonging to the Inuit group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 6 is about 4 kilometers in diameter and orbits Saturn at an average distance of 18.2 million km in 916.7 days. It has an inclination of 48.1° to the ecliptic in a prograde direction with an eccentricity of 0.084.",
      ],
    },
    related: [],
  },
  s_2019_s_7: {
    title: "S/2019 S 7",
    description: {
      blurb: [
        "S/2019 S 7 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 7 is about 4 kilometers in diameter and orbits Saturn at an average distance of 20.2 million km in 1080.29 days. It has an inclination of 174.2° to the ecliptic in a retrograde direction with an eccentricity of 0.232.",
      ],
    },
    related: [],
  },
  s_2019_s_8: {
    title: "S/2019 S 8",
    description: {
      blurb: [
        "S/2019 S 8 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 8 is about 4 kilometers in diameter and orbits Saturn at an average distance of 20.3 million km in 1088.68 days. It has an inclination of 172.8° to the ecliptic in a retrograde direction with an eccentricity of 0.311.",
      ],
    },
    related: [],
  },
  s_2019_s_9: {
    title: "S/2019 S 9",
    description: {
      blurb: [
        "S/2019 S 9 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2019 and announced in 2023.",
      ],
      more: [
        "S/2019 S 9 is about 4 kilometers in diameter and orbits Saturn at an average distance of 20.4 million km in 1093.11 days. It has an inclination of 159.5° to the ecliptic in a retrograde direction with an eccentricity of 0.433.",
      ],
    },
    related: [],
  },
  s_2020_s_1: {
    title: "S/2020 S 1",
    description: {
      blurb: [
        "S/2020 S 1 is a natural satellite of Saturn, belonging to the Inuit group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 1 is about 4 kilometers in diameter and orbits Saturn at an average distance of 11.3 million km in 451.1 days. It has an inclination of 48.2° to the ecliptic in a prograde direction with an eccentricity of 0.337.",
      ],
    },
    related: [],
  },
  s_2020_s_10: {
    title: "S/2020 S 10",
    description: {
      blurb: [
        "S/2020 S 10 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 10 is about 3 kilometers in diameter and orbits Saturn at an average distance of 25.3 million km in 1527.22 days. It has an inclination of 165.6° to the ecliptic in a retrograde direction with an eccentricity of 0.295.",
      ],
    },
    related: [],
  },
  s_2020_s_2: {
    title: "S/2020 S 2",
    description: {
      blurb: [
        "S/2020 S 2 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 2 is about 3 kilometers in diameter and orbits Saturn at an average distance of 17.9 million km in 897.6 days. It has an inclination of 170.7° to the ecliptic in a retrograde direction with an eccentricity of 0.152.",
      ],
    },
    related: [],
  },
  s_2020_s_3: {
    title: "S/2020 S 3",
    description: {
      blurb: [
        "S/2020 S 3 is a natural satellite of Saturn, belonging to the Inuit group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 3 is about 3 kilometers in diameter and orbits Saturn at an average distance of 18.1 million km in 907.99 days. It has an inclination of 46.1° to the ecliptic in a prograde direction with an eccentricity of 0.144.",
      ],
    },
    related: [],
  },
  s_2020_s_4: {
    title: "S/2020 S 4",
    description: {
      blurb: [
        "S/2020 S 4 is a natural satellite of Saturn, belonging to the Gallic group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 4 is about 3 kilometers in diameter and orbits Saturn at an average distance of 18.2 million km in 926.92 days. It has an inclination of 40.1° to the ecliptic in a prograde direction with an eccentricity of 0.495.",
      ],
    },
    related: [],
  },
  s_2020_s_5: {
    title: "S/2020 S 5",
    description: {
      blurb: [
        "S/2020 S 5 is a natural satellite of Saturn, belonging to the Inuit group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 5 is about 3 kilometers in diameter and orbits Saturn at an average distance of 18.4 million km in 933.88 days. It has an inclination of 48.2° to the ecliptic in a prograde direction with an eccentricity of 0.220.",
      ],
    },
    related: [],
  },
  s_2020_s_6: {
    title: "S/2020 S 6",
    description: {
      blurb: [
        "S/2020 S 6 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 6 is about 3 kilometers in diameter and orbits Saturn at an average distance of 21.3 million km in 1168.86 days. It has an inclination of 166.9° to the ecliptic in a retrograde direction with an eccentricity of 0.481.",
      ],
    },
    related: [],
  },
  s_2020_s_7: {
    title: "S/2020 S 7",
    description: {
      blurb: [
        "S/2020 S 7 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 7 is about 3 kilometers in diameter and orbits Saturn at an average distance of 17.4 million km in 861.7 days. It has an inclination of 161.5° to the ecliptic in a retrograde direction with an eccentricity of 0.500.",
      ],
    },
    related: [],
  },
  s_2020_s_8: {
    title: "S/2020 S 8",
    description: {
      blurb: [
        "S/2020 S 8 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 8 is about 3 kilometers in diameter and orbits Saturn at an average distance of 22.0 million km in 1228.12 days. It has an inclination of 161.8° to the ecliptic in a retrograde direction with an eccentricity of 0.252.",
      ],
    },
    related: [],
  },
  s_2020_s_9: {
    title: "S/2020 S 9",
    description: {
      blurb: [
        "S/2020 S 9 is a natural satellite of Saturn, belonging to the Norse group. It was discovered in 2020 and announced in 2023.",
      ],
      more: [
        "S/2020 S 9 is about 4 kilometers in diameter and orbits Saturn at an average distance of 25.4 million km in 1534.97 days. It has an inclination of 161.4° to the ecliptic in a retrograde direction with an eccentricity of 0.531.",
      ],
    },
    related: [],
  },
  s_2021_j_1: {
    title: "S/2021 J 1",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2021 and announced in early 2023.",
      ],
      more: [
        "S/2021 J 1 is part of the Ananke group, a cluster of retrograde irregular moons of Jupiter that follow similar orbits to Ananke at semi-major axes between 19–22 million km (12–14 million mi), orbital eccentricities between 0.1–0.4, and inclinations between 139–155°. It has a diameter of about 1 km (0.62 mi) for an absolute magnitude of 17.3, making it one of Jupiter's smallest known moons.",
      ],
    },
    related: [],
  },
  s_2021_j_2: {
    title: "S/2021 J 2",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2021 and announced in early 2023.",
      ],
      more: [
        "S/2021 J 2 is part of the Ananke group, a cluster of retrograde irregular moons of Jupiter that follow similar orbits to Ananke at semi-major axes between 19–22 million km (12–14 million mi), orbital eccentricities between 0.1–0.4, and inclinations between 139–155°. It has a diameter of about 1 km (0.62 mi) for an absolute magnitude of 17.3, making it one of Jupiter's smallest known moons.",
      ],
    },
    related: [],
  },
  s_2021_j_3: {
    title: "S/2021 J 3",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2021 and announced in early 2023.",
      ],
      more: [
        "S/2021 J 3 is part of the Ananke group, a cluster of retrograde irregular moons of Jupiter that follow similar orbits to Ananke at semi-major axes between 19–22 million km (12–14 million mi), orbital eccentricities between 0.1–0.4, and inclinations between 139–155°. It has a diameter of about 2 km (1.2 mi) for an absolute magnitude of 17.2.",
      ],
    },
    related: [],
  },
  s_2021_j_4: {
    title: "S/2021 J 4",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2021 and announced in early 2023.",
      ],
      more: [
        "S/2021 J 4 is part of the Carme group, a tight cluster of retrograde irregular moons of Jupiter that follow similar orbits to Carme at semi-major axes between 22–24 million km (14–15 million mi), orbital eccentricities between 0.2–0.3, and inclinations between 163–166°. It has a diameter of about 1 km (0.62 mi) for an absolute magnitude of 17.4, making it one of Jupiter's smallest known moons.",
      ],
    },
    related: [],
  },
  s_2021_j_5: {
    title: "S/2021 J 5",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2021 and announced in early 2023.",
      ],
      more: [
        "S/2021 J 5 is part of the Carme group, a tight cluster of retrograde irregular moons of Jupiter that follow similar orbits to Carme at semi-major axes between 22–24 million km (14–15 million mi), orbital eccentricities between 0.2–0.3, and inclinations between 163–166°. It has a diameter of about 2 km (1.2 mi) for an absolute magnitude of 16.8.",
      ],
    },
    related: [],
  },
  s_2021_j_6: {
    title: "S/2021 J 6",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2021 and announced in early 2023.",
      ],
      more: [
        "S/2021 J 6 is part of the Carme group, a tight cluster of retrograde irregular moons of Jupiter that follow similar orbits to Carme at semi-major axes between 22–24 million km (14–15 million mi), orbital eccentricities between 0.2–0.3, and inclinations between 163–166°. It has a diameter of about 1 km (0.62 mi) for an absolute magnitude of 17.3, making it one of Jupiter's smallest known moons.",
      ],
    },
    related: [],
  },
  s_2022_j_1: {
    title: "S/2022 J 1",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2022 and announced in early 2023.",
      ],
      more: [
        "S/2022 J 1 is part of the Carme group, a tight cluster of retrograde irregular moons of Jupiter that follow similar orbits to Carme at semi-major axes between 22–24 million km (14–15 million mi), orbital eccentricities between 0.2 and 0.3, and inclinations between 163 and 166°. It has a diameter of about 2 km (1.2 mi) for an absolute magnitude of 17.0.",
      ],
    },
    related: [],
  },
  s_2022_j_2: {
    title: "S/2021 J 2",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2022 and announced in early 2023.",
      ],
      more: [
        "S/2022 J 2 is part of the Carme group, a tight cluster of retrograde irregular moons of Jupiter that follow similar orbits to Carme at semi-major axes between 22–24 million km (14–15 million mi), orbital eccentricities between 0.2 and 0.3, and inclinations between 163 and 166°. With a diameter of about 1 km (0.62 mi) for an absolute magnitude of 17.6, it is one of Jupiter's smallest known moons with confirmed orbits.",
      ],
    },
    related: [],
  },
  s_2022_j_3: {
    title: "S/2021 J 3",
    description: {
      blurb: [
        "This small moon of Jupiter was discovered in 2022 and announced in early 2023.",
      ],
      more: [
        "S/2022 J 3 is part of the Ananke group, a cluster of retrograde irregular moons of Jupiter that follow similar orbits to Ananke at semi-major axes between 19–22 million km (12–14 million mi), orbital eccentricities between 0.1 and 0.4, and inclinations between 139 and 155°. It has a diameter of about 1 km (0.62 mi) for an absolute magnitude of 17.4.[",
      ],
    },
    related: [],
  },
  sao: {
    title: "Sao",
    description: {
      blurb: [
        "Sao is one of three tiny moons (ranging in size from 30 to 40 km -- or 18 to 24 miles) of Neptune discovered in 2002 using innovative ground-based telescope techniques. (The other moons discovered were Laomedeia and Halimede.) The moons are so distant and so small they are about 100 million times fainter than can be seen with the unaided eye. The moons were missed by the Voyager 2 spacecraft in 1989 because they are so faint and distant from Neptune.",
        "Sao is considered an irregular satellite because of its distant, eccentric orbit around Neptune. Like most irregular satellites of the giant planets in our outer solar system, Sao most likely formed after a collision between a larger moon and a comet or an asteroid. Sao and Laomedeia have prograde orbits, which means they orbit in the same direction as Neptune's rotation. Halimede has a retrograde orbit, which means Halimede orbits in the opposite direction of Neptune's rotation.",
        "Very little is known about Sao. Scientists are trying to learn more about it and its irregular sisters because they offer a glimpse of the conditions at the time the planets in our solar system were forming billions of years ago.",
      ],
    },
    related: [],
  },
  gridr: {
    title: "Gridr",
    description: {
      blurb: [
        "Gridr (formerly S/2004 S 20 and Saturn LIV) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Gridr is a Norse giantess, and a consort of Odin who warned Thor of Geirrod's treachery and equipped Thor with her belt, iron glove, and staff. Gridr is about 4 kilometres in diameter, and orbits Saturn at an average distance of 19.418 Gm in 1010.55 days, at an inclination of 163° to the ecliptic, in a retrograde direction and with an eccentricity of 0.197.​",
      ],
    },
  },
  angrboda: {
    title: "Angrboda",
    description: {
      blurb: [
        "Angrboda (formerly S/2004 S22 and Saturn LV) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Angrboda is a Norse giantess, consort of Loki, and the mother of monsters. Angrboda is about 3 kilometres in diameter, and orbits Saturn in 1107.13 days, at an inclination of 177° to the ecliptic.​",
      ],
    },
  },
  skrymir: {
    title: "Skrymir",
    description: {
      blurb: [
        "Skrymir (formerly S/2004 S23 and Saturn LVI) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Skrymir is a Norse giant who is a master of illusions. Skrymir is about 4 kilometres in diameter, and orbits Saturn in 1149.82 days, at an inclination of 177° to the ecliptic.​",
      ],
    },
  },
  gerd: {
    title: "Gerd",
    description: {
      blurb: [
        "Gerd (formerly S/2004 S25 and Saturn LVII) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Gerd is a Norse giantess and a consort of Freyr. She is the personification of fertile soil. Gerd is about 4 kilometres in diameter, and orbits Saturn in 1150.69 days, at an inclination of 173° to the ecliptic.",
      ],
    },
  },
  eggther: {
    title: "Eggther",
    description: {
      blurb: [
        "Eggther (formerly S/2004 S27 and Saturn LIX) is the outermost known natural satellite of Saturn, discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Eggther is a Norse giant and the watchman who announces the beginning of Ragnarok. Eggther is about 6 kilometres in diameter, and orbits Saturn in 1054.45 days, at an inclination of 168° to the ecliptic.",
      ],
    },
  },
  beli: {
    title: "Beli",
    description: {
      blurb: [
        "Beli (formerly S/2004 S30 and Saturn LXI) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Beli is a Norse giant killed by Freyr with a staghorn. Beli is about 4 kilometres in diameter, and orbits Saturn in 1087.84 days, at 157.5° to the ecliptic.",
      ],
    },
  },
  gunnlod: {
    title: "Gunnlod",
    description: {
      blurb: [
        "Gunnlod (formerly S/2004 S32 and Saturn LXII) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Gunnlod is a Norse giantess, and a daughter of Suttungr, for whom she guards the mead of poetry. Gunnlod is about 4 kilometres in diameter, and orbits Saturn in 1153.96 days, at an inclination of 159° to the ecliptic.",
      ],
    },
  },
  thiazzi: {
    title: "Thiazzi",
    description: {
      blurb: [
        "Thiazzi (formerly S/2004 S33 and Saturn LXIII) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Thiazzi is a Norse giant, and a son of Alvaldi who kidnapped Idun, guardian of the apples of the gods. Thiazzi is about 4 kilometres in diameter, and orbits Saturn in 1403.18 days, at an inclination of 160° to the ecliptic.",
      ],
    },
  },
  alvaldi: {
    title: "Alvaldi",
    description: {
      blurb: [
        "Alvaldi (formerly S/2004 S35 and Saturn LXV) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Alvaldi is a Norse giant and the father of Thiazzi. He was rich in gold, and his sons divided it amongst themselves by taking a mouthful of gold each. Alvaldi is about 5 kilometres in diameter, and orbits Saturn in 1253.08 days, at an inclination of 177° to the ecliptic.",
      ],
    },
  },
  geirrod: {
    title: "Geirrod",
    description: {
      blurb: [
        "Geirrod (formerly S/2004 S38 and Saturn LXVI) is a natural satellite of Saturn discovered in 2004 and announced in 2019.",
      ],
      more: [
        "In mythology, Geirrod was a Norse giant killed by Thor. Geirrod is about 4 kilometres in diameter, and orbits Saturn in 1211.02 days, at an inclination of 154° to the ecliptic.",
      ],
    },
  },
  setebos: {
    title: "Setebos",
    description: {
      blurb: [
        "Setebos is a small, dark moon (about 48 km in diameter, assuming an albedo of 0.04) which orbits Uranus in the opposite direction from the regular moons and the planet's rotation (known as a retrograde orbit).",
      ],
    },
    related: [],
  },
  siarnaq: {
    title: "Siarnaq",
    description: {
      blurb: [
        "Siarnaq was discovered on Sept. 23, 2000 using the 3.6-m Canada-France-Hawaii reflector on Mauna Kea, Hawaii, with adaptive optics.",
      ],
      more: [
        "Siarnaq has a mean radius of about 12.4 miles (20 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. At a mean distance of 11 million miles (18 million kilometers) from Saturn, the moon takes about 896 Earth days to complete one orbit. It rotates once every 10 hours and 9 minutes, which is this is the shortest rotation period of all prograde irregular moons of Saturn. Siarnaq is one of five known members of the Inuit group of moons, which orbit Saturn at a mean distance of 7 to 11 million miles (11 to 18 million kilometers), at inclinations between 40 and 50 degrees from the plane of Saturn's equator, and with eccentricities of 0.15 to 0.48. Like Saturn's other irregular moons, they are thought to be objects that were captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet, as the regular moons are thought to have done. The similarities among the Inuit group's orbits suggest a common origin — they may be fragments of a single object that shattered in a collision. The other members of this group are Kiviuq, Ijiraq, Paaliaq, and Tarqeq. Observations by Tommy Grav and James Bauer using telescopes on Mauna Kea, Hawaii in 2006 (before the discovery of Tarqeq) found that Kiviuq, Siarnaq and Paaliaq all are light red with similar infrared features, further supporting the idea of a common origin. Originally called S/2000 S3, Siarnaq was named for an Inuit goddess of sea creatures who was also queen of the underworld.",
      ],
    },
    related: ["sc_cassini"],
  },
  sinope: {
    title: "Sinope",
    description: {
      blurb: [
        "Sinope was discovered on July 21, 1914, by Seth Barnes Nicholson on photographic plates taken with the Lick Observatory's 36-inch (0.9 meter) telescope.",
      ],
      more: [
        "Sinope is generally considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. However, there is some uncertainty about whether Sinope belongs in this group or not. Most or all of the Pasiphae satellites are thought to have begun as a single asteroid that, after being captured by Jupiter's gravity, suffered a collision which broke off a number of pieces. The bulk of the original asteroid survived as the moon called Pasiphae, and the other pieces became some or all of the other moons in the group. If Sinope does not belong in the Pasiphae group, then the individual moon called Pasiphae retains 99 percent of the mass of the original asteroid. If Sinope is included, Pasiphae still retains the lion's share: 87 percent of the original mass. None of the Pasiphae members is massive enough to pull itself into a sphere, so they are probably all irregularly shaped. Sinope has a mean radius of 11.8 miles (19 kilometers), assuming an albedo of 0.04. At a mean distance of about 14.8 million miles (23.9 million kilometers) from Jupiter, the satellite takes about 759 Earth days to complete one orbit. Sinope was named for a nymph who outsmarted a smitten Zeus (the Greek equivalent of the Roman god Jupiter).",
      ],
    },
    related: [],
  },
  skathi: {
    title: "Skathi",
    description: {
      blurb: [
        "Skathi was discovered on Sept. 23, 2000 using the 3.6-m Canada-France-Hawaii reflector on Mauna Kea, Hawaii, with adaptive optics.",
      ],
      more: [
        "Skathi (formerly called Skadi) has a mean radius of 2.5 miles (4 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. It orbits Saturn at an inclination of about 151 degrees and an eccentricity of about 0.3. At a mean distance of 9.7 million miles (15.6 million kilometers) from Saturn, the moon takes about 728 Earth days to complete one orbit. Skathi is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn — traveling around in the opposite direction from the planet's rotation. Skathi and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Skathi is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Skathi appears to be a member of a subgroup that also includes Skoll, Hyrrokkin, S/2006 S1, Bergelmir, Farbauti, S/2006 S3, and Kari. Skathi, and another member of the Norse group, Ymir, may be the sources of material that coats the dark side of Iapetus and, to a lesser extent, the surface of Hyperion. Originally called S/2000 S8, Skathi was named for Skadi, a giantess in Norse mythology.",
      ],
    },
    related: [],
  },
  skoll: {
    title: "Skoll",
    description: {
      blurb: [
        "Skoll was discovered on March 6, 2006, by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna using the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Skoll has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 160 degrees and an eccentricity of about 0.5. At a mean distance of 11.0 million miles (17.7 million kilometers) from Saturn, the moon takes about 878 Earth days to complete one orbit. Skoll is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn — traveling around in the opposite direction from the planet's rotation. Skoll and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Skoll is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Skoll appears to be a member of a subgroup that also includes Skathi, Hyrrokkin, S/2006 S1, Bergelmir, Farbauti, S/2006 S3, and Kari. Originally called S/2006 S8, Skoll was named for a giant wolf in Norse mythology, who pursues the sun across the sky. It is destined to catch and devour them at the doomsday time known as Ragnarok.",
      ],
    },
    related: [],
  },
  sponde: {
    title: "Sponde",
    description: {
      blurb: [
        "Sponde was discovered Dec. 9, 2001, by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Sponde is considered a member of the Pasiphae group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. Sponde has a mean radius of one kilometer, assuming an albedo of 0.04. At a mean distance of about 14.8 million miles (23.8 million kilometers) from Jupiter, the satellite takes about 748 Earth days to complete one orbit. Originally called S/2001 J5, Sponde was named for one of the Horae, who were daughters of Themis and Zeus, the Greek equivalent of the Roman god, Jupiter.",
      ],
    },
    related: [],
  },
  stephano: {
    title: "Stephano",
    description: {
      blurb: [
        "About 32 km in diameter (assuming an albedo of 0.04), Stephano is a small, dark moon which orbits Uranus in the opposite direction from the regular satellites and the planet's rotation (a retrograde orbit). Its orbital characteristics are similar to those of Caliban, suggesting a common origin.",
      ],
    },
    related: [],
  },
  styx: {
    title: "Styx",
    description: {
      blurb: [
        "Styx was discovered on June 26, 2012 by a large team led by Mark Showalter using the Hubble Space Telescope.",
      ],
      more: [
        "Pluto’s tiny moon Styx was uncovered in a Hubble survey searching for potential hazards in advance of the July 2015 New Horizons spacecraft Pluto flyby. It is intriguing that such a small planet can have such a complex collection of satellites. The discovery provides additional clues for unraveling how the Pluto system formed and evolved. The favored theory is that all the moons are relics of a collision between Pluto and another large Kuiper Belt Object billions of years ago. The moon is estimated to be 6 to 15 miles (10 to 24 kilometers) across. It is in a 58,000 mile (93,000 kilometer) diameter circular orbit around Pluto that is assumed to be on the same plane with the other satellites in the system. Originally designated S/2012 (134340) 1 (and sometime referred to as P5), Styx is named for the mythological river that separates the world of the living from the realm of the dead.",
      ],
    },
    related: ["sc_hubble_space_telescope", "sc_new_horizons"],
  },
  surtur: {
    title: "Surtur",
    description: {
      blurb: [
        "Surtur was discovered on March 6, 2006, by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna using the Subaru 8.3-m reflector telescope on Mauna Kea, Hawaii.",
      ],
      more: [
        "Surtur has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.04. It orbits Saturn at an inclination of about 169 degrees and an eccentricity of about 0.4. At a mean distance of 14.2 million miles (22.9 million kilometers) from Saturn, the moon takes about 1,296 Earth days to complete one orbit. Surtur is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn — traveling around in the opposite direction from the planet's rotation. Surtur and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Surtur is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2006 S7, Surtur was named for Surt, who guards Muspell, the land of fire in Norse mythology. At the doomsday time known as Ragnarok, he is destined to lead the fire giants in battle against the gods. The gods will be vanquished and Heaven and Earth will be consumed in fire.",
      ],
    },
    related: [],
  },
  suttungr: {
    title: "Suttungr",
    description: {
      blurb: [
        "Suttungr was discovered in 2000 using the 3.6-m Canada-France-Hawaii reflector on Mauna Kea, Hawaii, with adaptive optics.",
      ],
      more: [
        "Suttungr has a mean radius of 2.2 miles (3.5 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. It orbits Saturn at an inclination of about 174 degrees and an eccentricity of about 0.1. At a mean distance of 12.1 million miles (19.5 million kilometers) from Saturn, the moon takes about 1,017 Earth days to complete one orbit. Suttungr is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn — traveling around in the opposite direction from the planet's rotation. Suttungr and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Suttungr is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2000 S12, Suttungr was named for Suttungr (also spelled Suttung), a giant in Norse mythology.",
      ],
    },
    related: [],
  },
  sycorax: {
    title: "Sycorax",
    description: {
      blurb: [
        "Sycorax is the largest of the irregular moons which orbit Uranus in the opposite direction from the regular moons and the planet's rotation (known as a retrograde orbit).",
      ],
    },
    related: [],
  },
  tarqeq: {
    title: "Tarqeq",
    description: {
      blurb: [
        "Tarqeq was discovered on Jan. 16, 2007, by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Subaru 8.2-m reflector at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Tarqeq has a mean radius of 1.9 miles (3 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. At a mean distance of 11.1 million miles (17.9 million kilometers) from Saturn, the moon takes about 887 Earth days to complete one orbit. Tarqeq is one of five known members of the Inuit group of moons, which orbit Saturn at a mean distance of 7 to 11 million miles (11 to 18 million kilometers), at inclinations between 40 degrees and 50 degrees from the plane of Saturn's equator, and with eccentricities of 0.15 to 0.48. (A moon's eccentricity is a number between 0 and 1 which describes the shape of the orbit. The closer to 0, the more circular it is; the closer to 1, the more elongated.) Originally called S/2007 S1, Tarqeq was named for the Inuit spirit of Earth's Moon. This spirit is said to be a mighty hunter who watches over human behavior. In the mythology of the indigenous people of northern Alaska, he controls the animals.",
      ],
    },
    related: [],
  },
  tarvos: {
    title: "Tarvos",
    description: {
      blurb: [
        "Tarvos was discovered on Sept. 23, 2000 using the 3.6-m Canada-France-Hawaii reflector on Mauna Kea, Hawaii, with adaptive optics.",
      ],
      more: [
        "Tarvos has a mean radius of about 4.7 miles (7.5 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. At a mean distance of 11.4 million miles (18.3 million kilometers) from Saturn, the moon takes about 926 Earth days to complete one orbit. Tarvos is one of the four known members of the Gallic group of moons. These moons have prograde orbits (they travel around Saturn in the same direction as the planet's rotation), but their egg-shaped, angled orbits classify them as \"irregular\" moons. Like Saturn's other irregular moons, they are thought to be objects that were captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet, as the regular moons are thought to have done. Originally called S/2000 S4, Tarvos was named for a bull in Celtic mythology. It is known from two stone sculptures, found in Paris and Trier, of a bull with three cranes and a tree which is presumed to be a willow.",
      ],
    },
    related: [],
  },
  taygete: {
    title: "Taygete",
    description: {
      blurb: [
        "Taygete was discovered Nov. 25, 2000, by Scott S. Sheppard, David C. Jewitt, Yanga R. Fernandez, and Eugene Magnier at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        "Taygete is a member of the Carme group, a family of Jovian satellites which have similar orbits and appearance and are therefore thought to have a common origin. The group probably began as a D-type asteroid (possibly from the Hilda family or the Jupiter Trojans) that suffered a collision, which broke off a number of pieces, either before or after being captured by Jupiter's gravity. The largest remaining chunk (still retaining 99 percent of the group's mass) was named \"Carme,\" and the smaller pieces became the other 16 moons in the Carme group. Taygete has a mean radius of about 1.5 miles (2.5 kilometers). At a mean distance of about 14.4 million miles (23.3 million kilometers) from Jupiter, the satellite takes about 732 Earth days to complete one orbit. Originally called S/2000 J9, Taygete was named for one of the Pleiades, who were the seven daughters of Atlas. Taygete was impregnated by Zeus, the Greek equivalent of the Roman god Jupiter, and bore him a son called Lakedaemon. According to one account, that smooth-talking Zeus once attempted to mollify his wife, Hera, by telling her that he had never been so charmed as by Hera — not even when he had Taygete.",
      ],
    },
    related: [],
  },
  telesto: {
    title: "Telesto",
    description: {
      blurb: [
        "Telesto was discovered in 1980 using ground-based observations by Brad Smith, Harold Reitsema, Stephen Larson, and John Fountain.",
      ],
      more: [
        'Telesto is known as a "Tethys Trojan" because, together with Calypso, it circles Saturn in the same orbit as the moon Tethys. At a distance of about 183,000 miles (295,000 kilometers) from Saturn, the moon takes 45.3 hours to make one trip around the planet. Telesto orbits about 60 degrees ahead of Tethys, while Calypso orbits behind Tethys by about 60 degrees. Because Telesto is in the front of this three-moon group, it is called the "leading Trojan." Telesto is 7.7 miles (12.4 kilometers) in mean radius and appears to have a smooth, icy surface. It does not show the signs of intense cratering seen on many of Saturn\'s other moons. Telesto is a daughter of the Titans Oceanus and Tethys in Greek mythology. It was originally designated S/1981 S13.',
      ],
    },
    related: ["sc_cassini"],
  },
  tethys: {
    title: "Tethys",
    description: {
      blurb: ["Tethys is Saturn's fifth largest moon."],
      more: [
        "This cold, airless and heavily scarred body is very similar to sister moons Dione and Rhea except that Tethys is not as heavily cratered as the other two. Tethys appeared as a tiny dot to astronomers until the Voyager (1 and 2) encounters in 1980 and 1981. The Voyager images showed a major impact crater and a great chasm. The Cassini spacecraft has added details including a great variety of colors at small scales suggesting a variety of materials not seen elsewhere.",
      ],
    },
    related: ["sc_pioneer_11", "sc_voyager_1", "sc_voyager_2", "sc_cassini"],
  },
  thalassa: {
    title: "Thalassa",
    description: {
      blurb: [
        "Thalassa, like Naiad, most likely formed from fragments of Neptune's original moons, which were smashed by the disturbances caused when the ice giant Neptune captured Triton. Thalassa is unusual for an irregular moon because it is roughly disk-shaped.",
        "Also like Naiad, Thalassa circles the planet in the same direction as Neptune rotates, and remains close to Neptune's equatorial plane. Thalassa's orbit is slowly decaying due to tidal deceleration and may eventually crash into Neptune's atmosphere or be torn apart and form a planetary ring.",
      ],
    },
    related: [],
  },
  thebe: {
    title: "Thebe",
    description: {
      blurb: [
        "Thebe was discovered in 1980 by the Voyager science team from images taken by Voyager 1.",
      ],
      more: [
        "Thebe is one of the four known small moons that orbit closer to Jupiter than the four vastly larger Galilean moons. These eight are the only known \"regular\" Jovian satellites, which means that they orbit Jupiter in the same direction as the planet's rotation (prograde orbits), and that their orbits are almost circular and in the same plane as Jupiter's equator. Thebe is the planet's seventh largest moon, with a mean radius of about 49 km. At a distance of about 138 thousand miles (222 thousand kilometers) from Jupiter, Thebe whips once around the planet in a little over 16 hours. The satellite originally called S/1979 J2 was ultimately named \"Thebe,\" a name associated with Jupiter — or his Greek equivalent, Zeus — in a variety of ways in different myths. In one, Thebe was a nymph who was a love of Zeus. In another, she was an Egyptian king's daughter and a love of Jupiter.",
      ],
    },
    related: ["sc_galileo", "sc_voyager_1", "sc_voyager_2"],
  },
  thelxinoe: {
    title: "Thelxinoe",
    description: {
      blurb: [
        "Thelxinoe was discovered on Feb. 9, 2003, by Scott S. Sheppard and Brett J. Gladman at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        'Thelxinoe is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter\'s gravity and then suffered a collision which broke off a number of pieces. The largest remaining chunk was named "Ananke," and the smaller pieces became the other 15 moons in the Ananke group. Thelxinoe has a mean radius of about 0.62 miles (1 kilometer), assuming an albedo of 0.04. At a mean distance of about 13.1 million miles (21.2 million kilometers) from Jupiter, it takes about 628 Earth days to complete one orbit. Originally called S/2003 J22, Thelxinoe was named for one of the Muses, who were daughters of Zeus, the Greek equivalent of the Roman god Jupiter. Thelxinoe means charm.',
      ],
    },
    related: [],
  },
  themisto: {
    title: "Themisto",
    description: {
      blurb: [
        "Themisto was initially discovered on Sept. 30, 1975, by Charles Thomas Kowal and Elizabeth Roemer.",
      ],
      more: [
        "Themisto was subsequently lost until 2000, when it was rediscovered by Scott S. Sheppard, David C. Jewitt, Yanga Roland Fernandez and Eugene A. Magnier as part of a systematic search for small irregular Jovian moons. They used two CCD cameras — the largest in the world at the time — one mounted on the 8.3-m Subaru telescope and the other on the 3.6-m Canada-French-Hawaii telescope on Mauna Kea in Hawaii. It is a small satellite with a mean radius of 2.5 miles (4 kilometers) whose orbit is inclined with respect to Jupiter's equatorial plane. It travels in the same direction as Jupiter's rotation (a prograde orbit). At a distance of about 4.5 million miles (7.3 million kilometers) from Jupiter, Themisto takes about 130 Earth days to complete one orbit. Satellites in the Jovian system are named for Zeus/Jupiter's lovers and descendants. Themisto was originally called S/1975 J1 and then S/2000 J1 when it was rediscovered. Its current name comes from the Greek mythological character who was the mother of Ister by Zeus, the Greek equivalent of the Roman god Jupiter. She was changed into a bear by a jealous Hera, who was Zeus' wife and sister.",
      ],
    },
    related: [],
  },
  thrymr: {
    title: "Thrymr",
    description: {
      blurb: [
        "Thrymr was discovered in 2000 using the 3.6-m Canada-France-Hawaii reflector on Mauna Kea in Hawaii, with adaptive optics.",
      ],
      more: [
        "Thrymr has a mean radius of 2.2 miles (3.5 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. It orbits Saturn at an inclination of about 174 degrees and an eccentricity of about 0.5. At a mean distance of 12.7 million miles (20.4 million kilometers) from Saturn, the moon takes about 1,094 Earth days to complete one orbit. Thrymr is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn -- traveling around in the opposite direction from the planet's rotation. Thrymr and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Thrymr is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Originally called S/2000 S7, Thrymr was named for a giant in Norse mythology who stole Thor's hammer and offered to return it only if the gods gave him the very beautiful goddess Freyia to be his wife.",
      ],
    },
    related: [],
  },
  thyone: {
    title: "Thyone",
    description: {
      blurb: [
        "Thyone was discovered on Dec. 11, 2001, by Scott S. Sheppard, David C. Jewitt and Jan T. Kleyna at the Mauna Kea Observatory in Hawaii.",
      ],
      more: [
        'Thyone is a member of the Ananke group, a family of Jovian satellites which have similar orbits and are therefore thought to have a common origin. The group probably began as an asteroid that was captured by Jupiter\'s gravity and then suffered a collision which broke off a number of pieces. The largest remaining chunk was named "Ananke," and the smaller pieces became the other 15 moons in the Ananke group. Thyone has a mean radius of about 1 mile (2 kilometers), assuming an albedo of 0.04. At a mean distance of about 13.2 million miles (21.2 million kilometers) from Jupiter, it takes about 627 Earth days to complete one orbit. Originally called S/2001 J2, Thyone was named for the mother (originally named Semele) of Dionysos by Zeus, the Greek equivalent of the Roman god Jupiter.',
      ],
    },
    related: [],
  },
  titan: {
    title: "Titan",
    description: {
      blurb: [
        "Saturn’s largest moon Titan is an extraordinary and exceptional world.",
      ],
      more: [
        "Among our solar system’s more than 150 known moons, Titan is the only one with a substantial atmosphere. And of all the places in the solar system, Titan is the only place besides Earth known to have liquids in the form of rivers, lakes and seas on its surface. Titan is larger than the planet Mercury and is the second largest moon in our solar system. Jupiter's moon Ganymede is just a little bit larger (by about 2 percent). Titan’s atmosphere is made mostly of nitrogen, like Earth’s, but with a surface pressure 50 percent higher than Earth’s. Titan has clouds, rain, rivers, lakes and seas of liquid hydrocarbons like methane and ethane. The largest seas are hundreds of feet deep and hundreds of miles wide. Beneath Titan’s thick crust of water ice is more liquid—an ocean primarily of water rather than methane. Titan’s subsurface water could be a place to harbor life as we know it, while its surface lakes and seas of liquid hydrocarbons could conceivably harbor life that uses different chemistry than we’re used to—that is, life as we don’t yet know it. Titan could also be a lifeless world.",
      ],
    },
    related: [
      "sc_pioneer_11",
      "sc_voyager_1",
      "sc_voyager_2",
      "sc_cassini",
      "sc_huygens",
    ],
  },
  titania: {
    title: "Titania",
    description: {
      blurb: [
        "Titania is Uranus' largest moon. Images taken by Voyager 2 almost 200 years after Titania's discovery revealed signs that the moon was geologically active.",
      ],
      more: [
        "A prominent system of fault valleys, some nearly 1,000 miles (1,609 kilometers) long, is visible near the terminator (shadow line). The troughs break the crust in two directions, an indication of some tectonic extension of Titania's crust. Deposits of highly reflective material, which may represent frost, can be seen along the Sun-facing valley walls.",
        "The moon is about 1,000 miles (1,600 kilometers) in diameter. The neutral gray color of Titania is typical of most of the significant Uranian moons. Titania is named for the queen of the fairies in William Shakespeare's 16th century play \"A Midsummer Night's Dream.\"",
      ],
    },
    related: ["sc_voyager_2"],
  },
  trinculo: {
    title: "Trinculo",
    description: {
      blurb: [
        "Trinculo is a small, dark moon orbiting Uranus in the opposite direction from the regular moons and the planet's rotation (called a retrograde orbit).",
      ],
    },
    related: [],
  },
  triton: {
    title: "Triton",
    description: {
      blurb: [
        "Triton is the largest of Neptune's 13 moons. It is unusual because it is the only large moon in our solar system that orbits in the opposite direction of its planet's rotation―a retrograde orbit.",
      ],
      more: [
        "Scientists think Triton is a Kuiper Belt Object captured by Neptune's gravity millions of years ago. It shares many similarities with Pluto, the best known world of the Kuiper Belt.",
        "Like our own moon, Triton is locked in synchronous rotation with Neptune―one side faces the planet at all times. But because of its unusual orbital inclination both polar regions take turns facing the Sun. Triton's thin atmosphere is composed mainly of nitrogen with small amounts of methane. This atmosphere most likely originates from Triton's volcanic activity, which is driven by seasonal heating by the Sun. Triton, Io and Venus are the only bodies in the solar system besides Earth that are known to be volcanically active at the present time.",
        "Triton is one of the coolest objects in our solar system. It is so cold that most of Triton's nitrogen is condensed as frost, giving its surface an icy sheen that reflects 70 percent of the sunlight that hits it.",
        "NASA's Voyager 2―the only spacecraft to fly past Neptune and Triton―found surface temperatures of -391degrees Fahrenheit (-235 degrees Celsius). During its 1989 flyby, Voyager 2 also found Triton has active geysers, making it one of the few geologically active moons in our solar system.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  umbriel: {
    title: "Umbriel",
    description: {
      blurb: [
        "Umbriel is the darkest of Uranus' largest moons. It reflects only 16 percent of the light that strikes its surface, a feature similar to the highland areas of Earth's Moon.",
      ],
      more: [
        "Other Uranian moons are much brighter. The process by which Umbriel's ancient cratered surface was darkened remains a mystery. Umbriel has a diameter of about 750 miles (1,200 kilometers). Images taken by Voyager 2 in 1986 revealed a curious bright ring about 90 miles (140 kilometers) in diameter on the moon's dark surface. It is unclear what created the distinctive ring, although it may be frost deposits associated with an impact crater.",
      ],
    },
    related: ["sc_voyager_2"],
  },
  ymir: {
    title: "Ymir",
    description: {
      blurb: [
        "Ymir was discovered in 2000 at the European Southern Observatory in La Silla, Chile.",
      ],
      more: [
        "Ymir has a mean radius of about 5.6 miles (9 kilometers), assuming an albedo (a measure of how reflective the surface is) of 0.06. It orbits Saturn at an inclination of about 172 degrees and an eccentricity of about 0.3. At a mean distance of 14.3 million miles (23.1 million kilometers) from Saturn, the moon takes about 1,316 Earth days to complete one orbit. Of the distant moons that take more than 3 Earth years to orbit Saturn, Ymir is by far the largest, nearly three times the size of its neighbors. Ymir is a member of the Norse group of moons. These \"irregular\" moons have retrograde orbits around Saturn -- traveling around in the opposite direction from the planet's rotation. Ymir and the other Norse moons also have eccentric orbits, meaning they are more elongated than circular. Like Saturn's other irregular moons, Ymir is thought to be an object that was captured by Saturn's gravity, rather than having accreted from the dusty disk that surrounded the newly formed planet as the regular moons are thought to have done. Ymir and another member of the Norse group, Skathi, may be the sources of material that coats the dark side of Iapetus and, to a lesser extent, the surface of Hyperion. Originally called S/2000 S1, Ymir was named for the first living being in Norse mythology, the first of a race of frost giants.",
      ],
    },
    related: [],
  },
  sc_ace: {
    title: "ACE",
    description: {
      blurb: [
        "NASA's Advanced Composition Explorer (ACE) collects and analyzes particles of solar, interplanetary, interstellar and galactic origins.",
      ],
      more: [
        "The ACE robotic spacecraft was launched August 25, 1997, and entered an orbit close to the L1 Lagrangian point (which lies between the Sun and the Earth at a distance of some 1.5 million km from the latter) on December 12, 1997. The data contributes to our understanding of the Sun, its interaction with Earth, and the evolution of the solar system. ACE continues to provide space weather reports and warnings of geomagnetic storms that can disrupt communications on Earth and harm astronauts in space.",
      ],
    },
    dates: {
      start: "1997-08-25",
      end: "",
      landing: "",
    },
    related: [],
  },
  sc_acrimsat: {
    title: "ACRIMSAT",
    description: {
      blurb: [
        "ACRIMSAT (Active Cavity Radiometer Irradiance Monitor Satellite) was a mission to monitor the levels of total solar irradiance, which is the power per square meter delivered by the sun.",
      ],
      more: [
        "Launched in December 1999, the mission lasted almost 14 years, until contact was lost on December 13th, 2013. Monitoring the sun's output over a long period can help separate climate change effects of the sun's variance from other effects such as the greenhouse effect.",
      ],
    },
    dates: {
      start: "1999-12-21T00:00:00",
      end: "2013-12-13T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["sun"],
  },
  sc_aqua: {
    title: "Aqua",
    description: {
      blurb: [
        "Aqua is a NASA Earth Science satellite mission named for the large amount of information that the mission is collecting about the Earth's water cycle.",
      ],
      more: [
        "The Aqua mission collects data about evaporation from the oceans, water vapor in the atmosphere, clouds, precipitation, soil moisture, sea ice, land ice, and snow cover on the land and ice. Additional variables also being measured by Aqua include radiative energy fluxes, aerosols, vegetation cover on the land, phytoplankton and dissolved organic matter in the oceans, and air, land, and water temperatures. Aqua was launched on May 4, 2002, and has six Earth-observing instruments on board, collecting a variety of global data sets. Aqua was originally developed for a six-year design life but has now far exceeded that original goal. It continues transmitting high-quality data from four of its six instruments, AIRS, AMSU, CERES, and MODIS, and reduced quality data from a fifth instrument, AMSR-E. The sixth Aqua instrument, HSB, collected approximately nine months of high quality data but failed in February 2003. Aqua was the first member launched of a group of satellites termed the Afternoon Constellation, or sometimes the A-Train.",
      ],
    },
    dates: {
      start: "2002-05-04T09:54:58",
      end: "",
      landing: "",
    },
    related: [],
  },
  sc_artemis_1: {
    title: "Artemis I",
    description: {
      blurb: [
        "Artemis I is an uncrewed flight test that is the first mission to use NASA's Space Launch System (SLS) and the Orion spacecraft. It will be followed by a crewed flight on Artemis II.",
      ],
      more: [
        "The first in a series of increasingly complex missions, Artemis I is an uncrewed flight test that will provide a foundation for human deep space exploration, and demonstrate our commitment and capability to extend human existence to the Moon and beyond. The spacecraft launched on the most powerful rocket in the world and flew farther than any spacecraft built for humans has ever flown, traveling thousands of miles past the moon, then entering a distant retrograde orbit of the moon before returning to Earth.",
      ],
    },
    dates: {
      start: "2022-11-16T06:47:44",
      end: "2022-11-17T06:47:44",
      landing: "",
    },
    parent: "earth",
    related: ["sc_capstone"],
  },
  sc_aura: {
    title: "Aura",
    description: {
      blurb: [
        "Aura (Latin for breeze) obtains measurements of ozone, aerosols and key gases throughout the atmosphere using technologically innovative space instrumentation. Scientists use these data to gain revolutionary insights into the chemistry of our atmosphere.",
      ],
      more: [
        "Aura's instruments measure trace gases in the atmosphere by detecting their unique spectral signatures. MLS observes the faint microwave emissions from rotating and vibrating molecules. HIRDLS  and TES  observe the infrared thermal emissions also due to molecular vibrations and rotations. OMI detects the molecular absorption of backscattered sunlight in the visible and ultraviolet wavelengths.",
        "Horizon viewing (limb) instruments (MLS, TES and HIRDLS slice through the atmosphere, profiling gases. Down-looking instruments (OMI and TES) stare at the Earth. Since MLS looks out the front of the spacecraft, it is the first to profile the atmosphere. The OMI and TES instruments then look at the same air mass as it passes beneath the spacecraft. As the spacecraft then moves on in its orbit, HIRDLS and TES profile the atmosphere again. This unique observing geometry allows the Aura instruments to combine their measurements to get a better picture of the atmospheric chemistry.",
      ],
    },
    dates: {
      start: "2004-07-15T10:01:51",
      end: "",
      landing: "",
    },
    related: [],
  },
  sc_biosentinel: {
    title: "BioSentinel",
    description: {
      blurb: [
        "NASA’s BioSentinel is a shoebox-sized CubeSat that will perform the first long-duration biology experiment in deep space.",
      ],
      more: [
        "The satellite launched to deep space aboard Artemis I and flew past the Moon in a direction to orbit the Sun. Once the satellite is in position beyond our planet’s protective magnetic field, it will conduct a study of the effects of deep space radiation on a living organism, yeast. Because human cells and yeast cells have many similar biological mechanisms, including DNA damage and repair, BioSentinel’s experiments can help us better understand the radiation risks for long-duration deep space human exploration. BioSentinel will carry living organisms farther into space than ever before. NASA’s Artemis missions at the Moon will prepare humans to travel on increasingly farther and longer-duration missions to destinations like Mars. Results from BioSentinel’s six- to nine-month mission will fill critical gaps in knowledge about the health risks in deep space posed by space radiation.",
      ],
    },
    dates: {
      start: "2022-11-16T11:45:33",
      end: "",
      landing: "",
    },
    related: ["moon", "sc_artemis_1", "sc_lunar_icecube"],
  },
  sc_calipso: {
    title: "CALIPSO",
    description: {
      blurb: [
        "The CALIPSO satellite provided new insight into the role that clouds and atmospheric aerosols (airborne particles) play in regulating Earth's weather, climate, and air quality.",
      ],
      more: [
        "CALIPSO (Cloud-Aerosol Lidar and Infrared Pathfinder Satellite Observation) combined an active lidar instrument with passive infrared and visible imagers to probe the vertical structure and properties of thin clouds and aerosols over the globe. CALIPSO was launched on April 28, 2006. CALIPSO, along with the CloudSat mission, were highly complementary and together provided new, never-before-seen 3-D perspectives of how clouds and aerosols form, evolve, and affect weather and climate.",
      ],
    },
    dates: {
      start: "2006-04-28T10:02:16",
      end: "2023-08-01T12:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["sc_cloudsat"],
  },
  sc_capstone: {
    title: "CAPSTONE",
    description: {
      blurb: [
        "Cislunar Autonomous Positioning System Technology Operations and Navigation Experiment (CAPSTONE) is a lunar orbiter that will test and verify a unique, elliptical orbit that is planned for the Gateway space station.",
      ],
      more: [
        "As a precursor for Gateway, a Moon-orbiting outpost that is part of NASA’s Artemis program, CAPSTONE will help reduce risk for future spacecraft by validating innovative navigation technologies and verifying the dynamics of this halo-shaped orbit.",
      ],
    },
    dates: {
      start: "2022-06-28T09:55:52",
      end: "",
      landing: "",
    },
    parent: "moon",
    related: ["sc_artemis_1"],
  },
  sc_cassini: {
    title: "Cassini",
    description: {
      blurb: [
        "For more than a decade, NASA’s Cassini spacecraft shared the wonders of Saturn and its family of icy moons—taking us to astounding worlds where methane rivers run to a methane sea and where jets of ice and gas are blasting material into space from a liquid water ocean that might harbor the ingredients for life. Cassini revealed in great detail the true wonders of Saturn, a giant world ruled by raging storms and delicate harmonies of gravity.",
      ],
      more: [
        "Cassini was one of the most ambitious efforts ever mounted in planetary exploration. A joint endeavor of NASA, ESA (the European Space Agency) and the Italian space agency (ASI), Cassini was a sophisticated robotic spacecraft sent to study Saturn and its complex system of rings and moons in unprecedented detail. Cassini carried a probe called Huygens to the Saturn system. The probe, which was built by ESA, parachuted to the surface of Saturn’s largest moon, Titan, in January 2005—the most distant landing to date in our solar system. Huygens returned spectacular images and other science results during a two-and-a-half-hour descent through Titan’s hazy atmosphere, before coming to rest amid rounded cobbles of ice on a floodplain damp with liquid methane.Cassini completed its initial four-year mission in June 2008 and earned two mission extensions that enabled the team to delve even deeper into Saturn’s mysteries. Key discoveries during its 13 years at Saturn included a global ocean with strong indications of hydrothermal activity within Enceladus, and liquid methane seas on Titan. After 20 years in space — 13 of those years exploring Saturn — Cassini exhausted its fuel supply. And so, to protect moons of Saturn that could have conditions suitable for life, Cassini was sent on a daring final mission that would seal its fate. After a series of nearly two dozen nail-biting dives between the planet and its icy rings, Cassini plunged into Saturn’s atmosphere on Sept. 15, 2017, returning science data to the very end.",
      ],
    },
    dates: {
      start: "1997-10-15T09:26:00Z",
      end: "2017-09-15T11:55:14Z",
      landing: "",
      highlight: "2017-04-22T09:36:00Z",
    },
    parent: "saturn",
    related: ["saturn", "titan", "jupiter", "enceladus"],
  },
  sc_clementine: {
    title: "Clementine",
    description: {
      blurb: [
        "Clementine was the first U.S. spacecraft launched to the Moon in over 20 years. It was designed to test spacecraft components during extended exposure to space and to study the Moon and an asteroid.",
      ],
      more: [
        "Clementine was launched in 1994 and The lunar observations included imaging at various wavelengths in the visible as well as in ultraviolet and infrared, laser ranging altimetry, gravimetry, and charged particle measurements. Clementine successfully entered an elliptical polar orbit (about 270 × 1,830 miles or 430 × 2,950 kilometers) around the Moon on Feb. 19, 1994, with a period of five days. In two months during 1994, it transmitted about 1.6 million digital images of the lunar surface, many of them with resolutions down to about 330-660 feet (100-200 meters). In the process, it provided scientists with their first look at the total lunar landscape including polar regions.",
      ],
    },
    dates: {
      start: "1994-01-25T16:34:00",
      end: "1995-05-10T00:00:00",
      landing: "",
      highlight: "1994-02-01T00:00:00",
    },
    parent: "moon",
    related: ["moon", "sc_lunar_reconaissance_orbiter"],
  },
  sc_cloudsat: {
    title: "CloudSat",
    description: {
      blurb: [
        "Part of NASA's fleet of weather- and climate-tracking satellites, CloudSat used advanced radar to examine the inner structure of clouds, helping researchers better understand how severe tropical cyclones as well as climate changes related to clouds occur.",
      ],
      more: [
        "In August 2010, CloudSat embarked on a new mission phase to study the genesis and patterns of tropical cyclones. Since its launch in 2006, CloudSat has played an instrumental role in new techniques for estimating the intensity of hurricanes from space, in addition to producing data about links between pollution and rainfall. The mission ended in late December of 2023.",
      ],
    },
    dates: {
      start: "2006-04-28T10:02:16",
      end: "2023-12-20T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["sc_calipso"],
  },
  sc_cluster_ii_fm5: {
    title: "Rumba",
    description: {
      blurb: [
        "Rumba is one of four spacecraft of the Cluster II mission of the European Space Agency, which studies the Earth's magnetosphere.",
      ],
      more: [
        "The mission is composed of four identical spacecraft flying in a tetrahedral formation. Four spacecraft allow scientists make the 3D, time-resolved measurements needed to create a realistic picture of the complex plasma interactions occurring between regions of the magnetosphere and between the magnetosphere and the solar wind.",
      ],
    },
    dates: {
      start: "2000-08-09T11:13:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_cluster_ii_fm6", "sc_cluster_ii_fm7", "sc_cluster_ii_fm8"],
  },
  sc_cluster_ii_fm6: {
    title: "Salsa",
    description: {
      blurb: [
        "Salsa is one of four spacecraft of the Cluster II mission of the European Space Agency, which studies the Earth's magnetosphere.",
      ],
      more: [
        "The mission is composed of four identical spacecraft flying in a tetrahedral formation. Four spacecraft allow scientists make the 3D, time-resolved measurements needed to create a realistic picture of the complex plasma interactions occurring between regions of the magnetosphere and between the magnetosphere and the solar wind.",
      ],
    },
    dates: {
      start: "2000-07-16T12:39:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_cluster_ii_fm5", "sc_cluster_ii_fm7", "sc_cluster_ii_fm8"],
  },
  sc_cluster_ii_fm7: {
    title: "Samba",
    description: {
      blurb: [
        "Samba is one of four spacecraft of the Cluster II mission of the European Space Agency, which studies the Earth's magnetosphere.",
      ],
      more: [
        "The mission is composed of four identical spacecraft flying in a tetrahedral formation. Four spacecraft allow scientists make the 3D, time-resolved measurements needed to create a realistic picture of the complex plasma interactions occurring between regions of the magnetosphere and between the magnetosphere and the solar wind.",
      ],
    },
    dates: {
      start: "2000-07-16T12:39:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_cluster_ii_fm5", "sc_cluster_ii_fm6", "sc_cluster_ii_fm8"],
  },
  sc_cluster_ii_fm8: {
    title: "Tango",
    description: {
      blurb: [
        "Tango is one of four spacecraft of the Cluster II mission of the European Space Agency, which studies the Earth's magnetosphere.",
      ],
      more: [
        "The mission is composed of four identical spacecraft flying in a tetrahedral formation. Four spacecraft allow scientists make the 3D, time-resolved measurements needed to create a realistic picture of the complex plasma interactions occurring between regions of the magnetosphere and between the magnetosphere and the solar wind.",
      ],
    },
    dates: {
      start: "2000-08-09T11:13:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_cluster_ii_fm5", "sc_cluster_ii_fm6", "sc_cluster_ii_fm7"],
  },
  sc_dart: {
    title: "DART",
    description: {
      blurb: [
        "DART, or Double Asteroid Redirection Test, was the first attempt to change the course of an asteroid with a kinetic impact.",
      ],
      link: "https://dart.jhuapl.edu/",
      more: [
        "An on-orbit demonstration of asteroid deflection was a key test that NASA and other agencies wished to perform before any actual need is present. The DART mission was NASA's demonstration of kinetic impactor technology, impacting an asteroid to adjust its speed and path. The targeted system is composed of two asteroids: the larger asteroid Didymos (diameter: 780 meters, 0.48 miles), and the smaller moonlet asteroid, Dimorphos (diameter: 160 meters, 525 feet), which orbits Didymos. On September 26th, 2022, the DART spacecraft impacted Dimorphos nearly head-on, shortening the time it takes the small asteroid moonlet to orbit Didymos by several minutes.",
      ],
    },
    dates: {
      start: "2021-11-24T06:20:00",
      end: "2022-09-26T23:14:20",
      landing: "",
    },
    related: ["65803_didymos", "dimorphos"],
  },
  sc_dawn: {
    title: "Dawn",
    description: {
      blurb: [
        "Dawn was the first spacecraft to orbit two extraterrestrial bodies, as well as the first spacecraft to visit either Vesta or Ceres, and the first to orbit a dwarf planet.",
      ],
      link: "https://solarsystem.nasa.gov/missions/dawn/overview/",
      more: [
        'Dawn launched in 2007 on a journey that put about 4.3 billion miles (6.9 billion kilometers) on its odometer. Propelled by ion engines, the spacecraft achieved many firsts until its extended mission concluded on Oct. 31, 2018. The Dawn mission was designed to study two large bodies in the asteroid belt in order to answer questions about the formation of the Solar System, as well as to test the performance of its ion thrusters in deep space. Ceres and Vesta were chosen as two contrasting protoplanets, the first one apparently "wet" (i.e. icy and cold) and the other "dry" (i.e. rocky). The Dawn mission ran out of fuel in 2018 and still orbits the dwarf planet Ceres.',
      ],
    },
    dates: {
      start: "2007-09-27T13:15:00",
      end: "2018-10-30T00:00:00",
      landing: "",
    },
    related: ["4_vesta", "1_ceres"],
  },
  sc_deep_impact: {
    title: "Deep Impact",
    description: {
      blurb: [
        "The primary mission of NASA's Deep Impact was to probe beneath the surface of a comet. The spacecraft delivered a special impactor into the path of Tempel 1 to reveal never before seen materials and provide clues about the internal composition and structure of a comet. The spacecraft released its impactor which collided with the comet, and then the spacecraft observed the result.",
      ],
      link: "https://www.jpl.nasa.gov/missions/deep-impact",
      more: [
        "On July 3, 2005, at 06:00 UT (or 06:07 UT Earth-receive time), Deep Impact released the impactor probe, which, using small thrusters, moved into the path of the comet, where it hit the following day, July 4, at 05:44:58 UT. The mission was then renamed as EPOXI, with a dual purpose to study extrasolar planets and the comet 103/P Hartley 2. The spacecraft arrived at Hartley 2 in 2010, and then planned to study an asteroid when contact was lost in August of 2013.",
      ],
    },
    dates: {
      start: "2005-01-12T20:20:08",
      end: "2013-08-08T00:00:00",
      landing: "",
    },
    related: [
      "sc_deep_impact_impactor",
      "9p_tempel_1",
      "103p_hartley_2",
      "c_2012_s1",
    ],
  },
  sc_deep_impact_impactor: {
    title: "Deep Impact Impactor",
    description: {
      blurb: [
        "The Impactor was a part of the Deep Impact spacecraft that would detatch and intentionally collide with the Comet Tempel 1.",
      ],
      more: [
        "On July 3, 2005, at 06:00 UT (or 06:07 UT Earth-receive time), Deep Impact released the impactor probe, which, using small thrusters, moved into the path of the comet, where it hit the following day, July 4, at 05:44:58 UT. The probe was traveling at a relative velocity of about 23,000 miles per hour (37,000 kilometers per hour) at the time of impact. The impact generated an explosion the equivalent of 4.7 tons of TNT and a crater estimated to be about 490 feet (150 meters) in diameter. The impact generated an explosion the equivalent of 4.7 tons of TNT and a crater estimated to be about 490 feet (150 meters) in diameter.",
      ],
    },
    dates: {
      start: "2005-01-12T18:47:08",
      end: "2005-07-04T06:05:00",
      landing: "",
      highlight: "2005-07-04T00:00:00",
    },
    related: ["sc_deep_impact", "9p_tempel_1"],
  },
  sc_deep_space_1: {
    title: "Deep Space 1",
    description: {
      blurb: [
        "NASA's Deep Space 1 was an engineering test flight for a dozen new technologies, including highly-efficient ion engines and autonomous navigation software. It also flew by a comet and an asteroid.",
      ],
      link: "https://www.jpl.nasa.gov/missions/deep-space-1-ds1",
      more: [
        "DS1 passed the near-Earth asteroid 9660 Braille on July 29th, 1999, at a range of about 16 miles (26 kilometers) and at a velocity of about 10 miles per second (15.5 kilometers per second). On Sept. 22, 2001, DS1 entered the coma of Comet Borrelly, making its closest approach of about 1,350 miles (2,171 kilometers) to the nucleus. Traveling at about 10 miles per second (16.58 kilometers per second) relative to the nucleus at the time, it returned some of the best images of a comet to date, as well as other significant data. It was the first NASA mission to use an ion propulsion engine.",
      ],
    },
    dates: {
      start: "1998-10-24T12:08:00",
      end: "2001-12-18T20:00:00",
      landing: "",
    },
    related: ["19p_borrelly"],
  },
  sc_eo_1: {
    title: "EO-1",
    description: {
      blurb: [
        "Earth Observing-1 (EO-1) was a NASA Earth observation satellite created to develop and validate a number of instrument and spacecraft bus breakthrough technologies.",
      ],
      more: [
        "It was the first satellite to map active lava flows from space; the first to measure a facility's methane leak from space; and the first to track re-growth in a partially logged Amazon forest from space. EO-1 captured scenes such as the ash after the World Trade Center attacks, the flooding in New Orleans after Hurricane Katrina, volcanic eruptions and a large methane leak in southern California.",
      ],
    },
    dates: {
      start: "2000-11-21T18:24:25",
      end: "2017-03-30T00:00:00",
      landing: "",
      highlight: "2017-01-01T00:00:00",
    },
    parent: "earth",
    related: ["earth"],
  },
  sc_euclid: {
    title: "Euclid",
    description: {
      blurb: [
        "Euclid is a European Space Agency mission to map the geometry of the Universe and better understand dark matter and dark energy, which make up most of the energy budget of the cosmos.",
      ],
      more: [
        "Euclid will probe the history of the expansion of the Universe and the formation of cosmic structures by measuring the redshift of galaxies out to a value of 2, which is equivalent to seeing back 10 billion years into the past. In this way, Euclid will cover the entire period over which dark energy played a significant role in accelerating the expansion of the Universe.",
      ],
    },
    dates: {
      start: "2023-07-01T15:12:00",
      end: "",
      landing: "",
    },
    related: ["sc_jwst"],
  },
  sc_europa_clipper: {
    title: "Europa Clipper",
    description: {
      blurb: [
        "Europa Clipper will search for signs of potential habitability on Jupiter's icy ocean moon Europa.",
      ],
      more: [
        "To determine if this distant moon has conditions favorable for life, NASA’s Europa Clipper mission is preparing to conduct the first dedicated and detailed study of an ocean world beyond Earth.",
        "The expedition’s objective is to explore Europa to investigate its habitability. The spacecraft is not being sent to find life itself, but will instead try to answer specific questions about Europa’s ocean, ice shell, composition and geology.",
      ],
    },
    dates: {
      start: "2024-10-10T01:44:00",
      end: "",
      landing: "",
    },
    parent: "europa",
    related: ["sc_galileo"],
  },
  sc_explorer_1: {
    title: "Explorer 1",
    description: {
      blurb: [
        "On January 31st, 1958, Explorer 1 became the first satellite launched by the United States of America. It followed the launch the previous year of the Russian satellites Sputnik 1 and 2.",
      ],
      more: [
        "It was the first spacecraft to detect the Van Allen radiation belt, returning data until its batteries were exhausted after nearly four months. It remained in orbit until 1970.",
      ],
    },
    dates: {
      start: "1958-02-01T03:48:00",
      end: "1958-05-23T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: [],
  },
  sc_galileo: {
    title: "Galileo",
    description: {
      blurb: [
        "The Galileo mission was the first spacecraft to enter orbit around the planet Jupiter, arriving in December of 1995 and staying for eight years, and made close passes by all its major moons. Galileo even carried a small probe that it deployed and sent deep into the atmosphere of Jupiter, taking readings for almost an hour before the probe was crushed by overwhelming pressure.",
      ],
      link: "https://solarsystem.nasa.gov/missions/galileo/overview/",
      more: [
        "The Galileo spacecraft logged quite a few other firsts during its 14-year mission to Jupiter. Among its discoveries: an intense radiation belt above Jupiter's cloud tops, helium in about the same concentration as the Sun, extensive and rapid resurfacing of the moon Io because of volcanism and a magnetic field at Ganymede.",
      ],
    },
    dates: {
      start: "1989-10-18T16:53:40",
      end: "2003-09-21T18:57:18",
      landing: "",
    },
    related: ["jupiter", "europa", "ganymede", "io", "callisto", "amalthea"],
  },
  sc_galileo_probe: {
    title: "Galileo Probe",
    description: {
      blurb: [
        "The Galileo orbiter carried a small probe that became the first to sample the atmosphere of a gas planet.",
      ],
      more: [
        "The probe measured temperature, pressure, chemical composition, cloud characteristics, sunlight and energy internal to the planet, and lightning. During its 58-minute life, the probe penetrated 124 miles (200 kilometers) into Jupiter's violent atmosphere before it was crushed, melted and/or vaporized by the intense pressure and temperature.",
      ],
    },
    dates: {
      start: "1995-07-13T05:30:00",
      end: "1995-07-13T05:30:01",
      landing: "",
      highlight: "1995-07-13T05:30:00",
    },
    parent: "jupiter",
    related: ["sc_galileo", "jupiter"],
  },
  sc_geotail: {
    title: "Geotail",
    description: {
      blurb: [
        "Geotail provides information about the way the magnetic envelope surrounding Earth, called the magnetosphere, responds to incoming material and energy from the Sun.",
      ],
      more: [
        "The Geotail mission was a joint project of Japan’s Institute of Space and Astronautical Science (ISAS) and later, from 2003, the Japan Aerospace Exploration Agency (JAXA) and NASA. The mission was part of the International Solar Terrestrial Physics (ISTP) project, which also included the Wind, Polar, SOHO, and Cluster missions. Geotail’s goal was to study the structure and dynamics of the long tail region of Earth’s magnetosphere, which is created on the nightside of Earth by the solar wind. During active periods, the tail couples with the near-Earth magnetosphere, and often releases energy that is stored in the tail, activating auroras in the polar ionosphere.",
      ],
    },
    dates: {
      start: "1992-07-24T14:26:00",
      end: "2022-11-28T00:00:00",
      landing: "",
    },
    related: ["earth"],
  },
  sc_gpm: {
    title: "GPM",
    description: {
      blurb: [
        "Global Precipitation Measurement (GPM) is an international satellite mission to provide next-generation observations of rain and snow worldwide every three hours.",
      ],
      more: [
        "NASA and the Japanese Aerospace Exploration Agency (JAXA) launched the GPM Core Observatory satellite on February 27th, 2014, carrying advanced instruments that set a new standard for precipitation measurements from space. The data they provide is used to unify precipitation measurements made by an international network of partner satellites to quantify when, where, and how much it rains or snows around the world.",
        "The GPM mission contributes to advancing our understanding of Earth's water and energy cycles, improves the forecasting of extreme events that cause natural disasters, and extends current capabilities of using satellite precipitation information to directly benefit society.",
      ],
    },
    dates: {
      start: "2014-02-27T18:37:00",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_grace_1: {
    title: "GRACE-1",
    description: {
      blurb: [
        "The Gravity Recovery and Climate Experiment (GRACE) was a joint mission of NASA and the German Aerospace Center (DLR). Twin satellites took detailed measurements of Earth's gravity field anomalies from its launch in March 2002 to the end of its science mission in October 2017.",
      ],
      more: [
        "The twin GRACE spacecraft tracked Earth's water movement to monitor changes in underground water storage, the amount of water in large lakes and rivers, soil moisture, ice sheets and glaciers, and sea level caused by the addition of water to the ocean. These discoveries provide a unique view of Earth's climate and have far-reaching benefits to society and the world's population. GRACE is able to make accurate measurements thanks in part to two advanced technologies: a microwave ranging system based on Global Positioning System (GPS) technology, and a very sensitive accelerometer—an instrument that measures the forces on the satellites besides gravity (such as atmospheric drag). Using the microwave ranging system, GRACE can measure the distance between satellites to within one micron -- about the diameter of a blood cell. Together, these very precise measurements of location, force and orbital change translate into an observation of gravity with unprecedented accuracy. Flight engineers maneuver the satellites only if they separate by more than 155 miles (250 km), otherwise they are left alone and gravity ‘tugs and pulls’ on them.",
      ],
    },
    dates: {
      start: "2002-03-17T09:21:00",
      end: "2017-10-27T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["sc_grace_2", "sc_grace_fo1", "sc_grace_fo2"],
  },
  sc_grace_2: {
    title: "GRACE-2",
    description: {
      blurb: [
        "The Gravity Recovery and Climate Experiment (GRACE) was a joint mission of NASA and the German Aerospace Center (DLR). Twin satellites took detailed measurements of Earth's gravity field anomalies from its launch in March 2002 to the end of its science mission in October 2017.",
      ],
      more: [
        "The twin GRACE spacecraft tracked Earth's water movement to monitor changes in underground water storage, the amount of water in large lakes and rivers, soil moisture, ice sheets and glaciers, and sea level caused by the addition of water to the ocean. These discoveries provide a unique view of Earth's climate and have far-reaching benefits to society and the world's population. GRACE is able to make accurate measurements thanks in part to two advanced technologies: a microwave ranging system based on Global Positioning System (GPS) technology, and a very sensitive accelerometer—an instrument that measures the forces on the satellites besides gravity (such as atmospheric drag). Using the microwave ranging system, GRACE can measure the distance between satellites to within one micron -- about the diameter of a blood cell. Together, these very precise measurements of location, force and orbital change translate into an observation of gravity with unprecedented accuracy. Flight engineers maneuver the satellites only if they separate by more than 155 miles (250 km), otherwise they are left alone and gravity ‘tugs and pulls’ on them.",
      ],
    },
    dates: {
      start: "2002-03-17T09:21:00",
      end: "2017-10-27T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["sc_grace_1", "sc_grace_fo1", "sc_grace_fo2"],
  },
  sc_grace_fo1: {
    title: "GRACE-FO1",
    description: {
      blurb: [
        "The Gravity Recovery and Climate Experiment Follow-on (GRACE-FO) mission measures changes in Earth's gravity field. It consists of two spacecraft that follow each other in orbit.",
      ],
      more: [
        "Launched on May 22, 2018, GRACE-FO continues the work of tracking Earth's water movement to monitor changes in underground water storage, the amount of water in large lakes and rivers, soil moisture, ice sheets and glaciers, and sea level caused by the addition of water to the ocean. These discoveries provide a unique view of Earth's climate and have far-reaching benefits to society and the world's population. GRACE-FO is able to make accurate measurements thanks in part to two advanced technologies: a microwave ranging system based on Global Positioning System (GPS) technology, and a very sensitive accelerometer—an instrument that measures the forces on the satellites besides gravity (such as atmospheric drag).",
        "Using the microwave ranging system, GRACE can measure the distance between satellites to within one micron -- about the diameter of a blood cell. Together, these very precise measurements of location, force and orbital change translate into an observation of gravity with unprecedented accuracy. Flight engineers maneuver the satellites only if they separate by more than 155 miles (250 km), otherwise they are left alone and gravity ‘tugs and pulls’ on them.",
      ],
    },
    dates: {
      start: "2018-05-22T19:47:58",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_grace_1", "sc_grace_2", "sc_grace_fo2"],
  },
  sc_grace_fo2: {
    title: "GRACE-FO2",
    description: {
      blurb: [
        "The Gravity Recovery and Climate Experiment Follow-on (GRACE-FO) mission measures changes in Earth's gravity field. It consists of two spacecraft that follow each other in orbit.",
      ],
      more: [
        "Launched on May 22, 2018, GRACE-FO continues the work of tracking Earth's water movement to monitor changes in underground water storage, the amount of water in large lakes and rivers, soil moisture, ice sheets and glaciers, and sea level caused by the addition of water to the ocean. These discoveries provide a unique view of Earth's climate and have far-reaching benefits to society and the world's population. GRACE-FO is able to make accurate measurements thanks in part to two advanced technologies: a microwave ranging system based on Global Positioning System (GPS) technology, and a very sensitive accelerometer—an instrument that measures the forces on the satellites besides gravity (such as atmospheric drag).",
        "Using the microwave ranging system, GRACE can measure the distance between satellites to within one micron -- about the diameter of a blood cell. Together, these very precise measurements of location, force and orbital change translate into an observation of gravity with unprecedented accuracy. Flight engineers maneuver the satellites only if they separate by more than 155 miles (250 km), otherwise they are left alone and gravity ‘tugs and pulls’ on them.",
      ],
    },
    dates: {
      start: "2018-05-22T19:47:58",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_grace_1", "sc_grace_2", "sc_grace_fo1"],
  },
  sc_grail_a: {
    title: "GRAIL A",
    description: {
      blurb: [
        "NASA's GRAIL mission flew twin spacecraft—Ebb and Flow—in tandem around the Moon to map variations in the lunar gravitational field",
      ],
      more: [
        "As the two spacecraft flew over areas of increasing gravity, the probes moved slightly toward and away from each other, while an instrument measured changes in their relative velocity, providing key information on the Moon’s gravitational field. At the end of the mission, the probes were purposely crashed on the Moon.",
      ],
    },
    dates: {
      start: "2011-09-10T13:08:52",
      end: "2012-12-17T22:28:51",
      landing: "",
    },
    parent: "moon",
    related: ["moon", "sc_grail_b"],
  },
  sc_grail_b: {
    title: "GRAIL B",
    description: {
      blurb: [
        "NASA's GRAIL mission flew twin spacecraft—Ebb and Flow—in tandem around the Moon to map variations in the lunar gravitational field",
      ],
      more: [
        "As the two spacecraft flew over areas of increasing gravity, the probes moved slightly toward and away from each other, while an instrument measured changes in their relative velocity, providing key information on the Moon’s gravitational field. At the end of the mission, the probeswere purposely crashed on the Moon.",
      ],
    },
    dates: {
      start: "2011-09-10T13:08:52",
      end: "2012-12-17T22:29:21",
      landing: "",
    },
    parent: "moon",
    related: ["moon", "sc_grail_a"],
  },
  sc_grifex: {
    title: "GRIFEX",
    description: {
      blurb: [
        "GRIFEX, the Geo-cape Roic In-Flight performance Experiment, was a CubeSat technology validation test for the proposed GEO-CAPE mission.",
      ],
      more: [
        "GRIFEX advanced the technology required for future space-borne measurements of atmospheric composition from geostationary orbit that are relevant to climate change. The size of GRIFEX was three CubeSat units, or 30 x 10 x 10 cm.",
      ],
    },
    dates: {
      start: "2015-01-31",
      end: "2024-02-22",
      landing: "",
    },
    related: [],
  },
  sc_hubble_space_telescope: {
    title: "Hubble Space Telescope",
    description: {
      blurb: [
        "NASA’s Hubble Space Telescope is the first astronomical observatory placed into orbit around Earth with the ability to record images in wavelengths of light spanning from ultraviolet to near-infrared.",
      ],
      more: [
        "The Hubble Space Telescope's launch and deployment in April 1990 marked the most significant advancement in astronomy since Galileo's telescope. The first major optical telescope to be placed in space, Hubble operates from the ultimate mountaintop. Far above the distortion of Earth's atmosphere, clouds and light pollution, Hubble has an unobstructed view of the universe.",
        "Hubble can see far more than what we can with our eyes. Its domain extends from the ultraviolet, through the visible, and to the near-infrared.",
        "The telescope has had a major impact on every area of astronomy, from the solar system to objects at the edge of the universe. Scientists have used Hubble to observe the most distant stars and galaxies as well as the planets in our solar system.",
        "Data and from the orbiting telescope are the backbone of more than 15,000 technical papers. It also, of course, continues to dazzle us with stunning pictures of stars, galaxies and planets.",
      ],
    },
    dates: {
      start: "1990-04-24T12:33:51",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_spitzer", "sc_chandra"],
  },
  sc_huygens: {
    title: "Huygens",
    description: {
      blurb: [
        "The European Space Agency's Huygens Probe was a unique, advanced spacecraft and a crucial part of the overall Cassini mission to explore Saturn.",
      ],
      more: [
        "The probe was about 9 feet wide (2.7 meters) and weighed roughly 700 pounds (318 kilograms). It was built like a shellfish: a hard shell protected its delicate interior from high temperatures during the a two hour and 27 minute descent through the atmosphere of Saturn's giant moon Titan. Huygens landed on Titan on January 14, 2005.",
      ],
    },
    dates: {
      start: "1997-10-15T08:43:00",
      end: "2005-01-14T13:37:00",
      landing: "2005-01-14T12:43:00",
      highlight: "2004-12-25T02:00:15",
    },
    parent: "saturn",
    related: ["sc_cassini", "titan"],
  },
  sc_ibex: {
    title: "IBEX",
    description: {
      blurb: [
        "Interstellar Boundary Explorer (IBEX) is a NASA spacecraft mapping the boundary of our solar system.",
      ],
      more: [
        'IBEX is a small satellite the size of a bus tire. It has "telescopes" that look out toward the edge of the solar system. However, these telescopes are different than most telescopes. They collect particles instead of light. These particles are called energetic neutral atoms (ENAs)—high-energy particles produced at the very edge of our solar system.',
      ],
    },
    dates: {
      start: "2008-10-08T17:47:23",
      end: "",
      landing: "",
    },
    related: [],
  },
  sc_icesat_2: {
    title: "ICESat-2",
    description: {
      blurb: [
        "The Ice, Cloud, and land Elevation Satellite-2, or ICESat-2, will measure the height of a changing Earth – one laser pulse at a time, 10,000 laser pulses a second.",
      ],
      more: [
        "ICESat-2 (short for Ice, Cloud, and land Elevation Satellite), launched Sept. 15, 2018, uses lasers and a very precise detection instrument to measure the elevation of Earth’s surface. By timing how long it takes laser beams to travel from the satellite to Earth and back, scientists can calculate the height of glaciers, sea ice, forests, lakes and more – including the changing ice sheets of Greenland and Antarctica. Our planet's frozen and icy areas, called the cryosphere, are a key focus of NASA's Earth science research. ICESat-2 will help scientists investigate why, and how much, our cryosphere is changing in a warming climate. The satellite will also measure heights across Earth's temperate and tropical regions, and take stock of the vegetation in forests worldwide.",
      ],
    },
    dates: {
      start: "2018-09-15T13:02:00",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_image: {
    title: "IMAGE",
    description: {
      blurb: [
        "IMAGE (Imager for Magnetopause-to-Aurora Global Exploration) is a NASA mission that studied the global response of the Earth's magnetosphere to changes in the solar wind.",
      ],
      more: [
        "IMAGE was the first spacecraft dedicated to imaging the Earth's magnetosphere, producing comprehensive global images of plasma in the inner magnetosphere.",
      ],
    },
    dates: {
      start: "2000-03-25T20:34:43",
      end: "2005-12-18T07:39:00",
      landing: "",
    },
    related: ["sc_wind"],
  },
  sc_ipex: {
    title: "IPEX",
    description: {
      blurb: [
        'IPEX was a CubeSat mission that was an "Intelligent Payload EXperiment."',
      ],
      more: [
        "The purpose of the mission was to validate onboard instrument processing and autonomous payload operations that could be used in the future on the proposed NASA HYperSPectral Infra-Red Instrument (HyspIRI) mission.",
      ],
    },
    dates: {
      start: "2013-12-06T07:13:40",
      end: "",
      landing: "",
    },
    related: [],
  },
  sc_isas: {
    title: "ISAS",
    description: {
      blurb: ["Operational for two months in February and March of 1994."],
      more: [
        "The Clementine Interstage Adapter Satellite (ISAS) was the lunar transfer booster used to propel the Clementine spacecraft to the Moon from Earth orbit.",
      ],
    },
    dates: {
      start: "",
      end: "",
      landing: "",
    },
    related: [],
  },
  sc_iss: {
    title: "International Space Station (ISS)",
    description: {
      blurb: [
        "The International Space Station (ISS) is a permanently crewed on-orbit laboratory that enables scientific research supporting innovation on Earth and future deep space exploration.",
      ],
      more: [
        "From design to launch, 15 countries collaborated to assemble the world's only permanently crewed orbital facility, which can house a crew of six and 150 ongoing experiments annually across an array of disciplines. The ISS represents a global effort to expand our knowledge and improve life on Earth while testing technology that will extend our reach to the moon, Mars and beyond.",
      ],
    },
    dates: {
      start: "1998-11-20",
      end: "",
      landing: "",
    },
    parent: "earth",
  },
  sc_ixpe: {
    title: "IXPE",
    description: {
      blurb: [
        "The Imaging X-Ray Polarimetry Explorer (IXPE) will allow astronomers to explore, for the first time, the hidden details of some of the most extreme and exotic astronomical objects, such as stellar and supermassive black holes, neutron stars and pulsars.",
      ],
    },
    dates: {
      start: "2021-12-13T06:00:00",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_jason_1: {
    title: "Jason-1",
    description: {
      blurb: [
        "Jason-1 was a satellite altimeter oceanography mission. It sought to monitor global ocean circulation, study the ties between the ocean and the atmosphere, improve global climate forecasts and predictions, and monitor events such as El Niño and ocean eddies.",
      ],
      more: [
        "Jason-1 is the successor to the TOPEX/Poseidon mission, which measured ocean surface topography from 1992 through 2005. Like its predecessor, Jason-1 is a joint project between the NASA (United States) and CNES (France) space agencies. Jason-1 has led to Jason-2 and Jason-3, and then the Sentinel-6 Michael Freilich mission.",
      ],
    },
    dates: {
      start: "2001-12-07T15:07:00",
      end: "2013-07-01T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["sc_jason_2", "sc_jason_3", "sc_sentinel_6"],
  },
  sc_jason_2: {
    title: "Jason-2/OSTM",
    description: {
      blurb: [
        "Jason-2/OSTM used high-precision ocean altimetry to measure the distance between the satellite and the ocean surface to within a few centimeters.",
      ],
      more: [
        "The third in a series of sea level missions, Jason-2/Ocean Surface Topography Mission follows the TOPEX/Poseiden and Jason-1 missions. These very accurate observations of variations in sea surface height — also known as ocean topography — provide information about global sea level, the speed and direction of ocean currents, and heat stored in the ocean.",
      ],
    },
    dates: {
      start: "2008-06-20T07:46:25",
      end: "2019-10-09T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["sc_jason_3", "sc_sentinel_6"],
  },
  sc_jason_3: {
    title: "Jason-3",
    description: {
      blurb: [
        "Jason-3 is the fourth mission in U.S.-European series of satellite missions that measure the height of the ocean surface.",
      ],
      more: [
        "Launched on January 17, 2016, the mission will extend the time series of ocean surface topography measurements (the hills and valleys of the ocean surface) begun by the TOPEX/Poseidon satellite mission in 1992 and continuing through the Jason-1 (launched in 2001) and the currently operating OSTM/Jason-2 (launched in 2008) missions. These measurements provide scientists with critical information about circulation patterns in the ocean and about both global and regional changes in sea level and the climate implications of a warming world.",
        "The primary instrument on Jason-3 is a radar altimeter. The altimeter will measure sea-level variations over the global ocean with very high accuracy (as 1.3 inches or 3.3 centimeters, with a goal of achieving 1 inch or 2.5 centimeters). Continual, long-term, reliable data of changes in ocean surface topography will be generated and will be used by scientists and operational agencies (NOAA, European weather agencies, marine operators, etc.) for scientific research and operational oceanography for the benefit of society.",
      ],
    },
    dates: {
      start: "2016-01-17T18:42:18",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_jason_2", "sc_sentinel_6"],
  },
  sc_juice: {
    title: "Juice",
    description: {
      blurb: [
        "The ESA’s Jupiter Icy Moons Explorer, Juice, will make detailed observations of the giant gas planet and its three large ocean-bearing moons – Ganymede, Callisto and Europa – with a suite of remote sensing, geophysical and in situ instruments.",
      ],
      more: [
        "The mission will characterize these moons as both planetary objects and possible habitats, explore Jupiter’s complex environment in depth, and study the wider Jupiter system as an archetype for gas giants across the Universe. Juice will reach the Jovian system in July 2031 after four gravity assists and eight years of travel. In December of 2034, the spacecraft will enter orbit around Ganymede for its close-up science mission.",
      ],
    },
    dates: {
      start: "2023-04-14T12:14:36",
      end: "",
    },
    related: ["jupiter", "sc_juno", "ganymede", "europa", "callisto"],
  },
  sc_juno: {
    title: "Juno",
    description: {
      blurb: [
        "Juno is studying the interior and origins of giant planet Jupiter for the first time. It has been orbiting Jupiter since it arrived in 2016.",
      ],
      more: [
        "Juno’s marching orders — to pick the lock on Jupiter’s secrets — have been spectacularly fulfilled. High above Jupiter’s roiling clouds, three giant blades stretch out from a cylindrical, six-sided body. Some 66 feet (20 meters) wide, the Juno spacecraft is a dynamic engineering marvel, spinning to keep itself stable as it makes sweeping elliptical (oval-shaped) orbits around Jupiter. At their widest point, these carry Juno far from the giant planet and its moons, keeping it mostly clear of heavy radiation regions. But on closer passes, every 38 days, Juno cuts within 3,100 miles (5,000 kilometers) of Jupiter’s cloud tops. Juno achieved rough, global coverage of the giant planet by the end of 2018, but at a coarse resolution; it then began a new set of orbits to fill in the details. The spacecraft’s long, looping orbits are meant to keep it mostly clear of the doughnut-shaped belts of harmful radiation close to Jupiter and its moons. Every 38 days, however, Juno makes a close pass to observe Jupiter’s gigantic clouds and titanic storms, crackling with lightning. Powerful pulses of energy — super-charged particles streaming through Jupiter’s magnetic field — create auroras. They’re similar to the northern and southern lights on Earth, that is, if you can imagine scaling them up to the size of a planet that could hold 1,300 Earths.",
      ],
    },
    dates: {
      start: "2011-08-05T16:25:00",
      end: "",
      landing: "",
    },
    related: ["jupiter", "sc_galileo"],
    parent: "jupiter",
  },
  sc_jwst: {
    title: "James Webb Space Telescope",
    description: {
      blurb: [
        "The James Webb Space Telescope (JWST) is a large infrared telescope with an approximately 6.5 meter primary mirror.",
      ],
      more: [
        "Webb will be the premier observatory of the next decade, serving thousands of astronomers worldwide. It will study every phase in the history of our Universe, ranging from the first luminous glows after the Big Bang, to the formation of solar systems capable of supporting life on planets like Earth, to the evolution of our own Solar System.",
      ],
    },
    dates: {
      start: "2021-12-25T12:20:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [],
  },
  sc_kepler_space_telescope: {
    title: "Kepler",
    description: {
      blurb: [
        'NASA\'s Kepler spacecraft was launched to search for Earth-like planets orbiting other stars. It discovered more than 2,600 of these "exoplanets"—including many that are promising places for life to exist.',
      ],
      more: [
        "Kepler was equipped to look for planets with size spans from one-half to twice the size of Earth (terrestrial planets) in the habitable zone of their stars where liquid water might exist in the natural state on the surface of the planet. It operated from 2009 to 2018.",
      ],
    },
    dates: {
      start: "2009-03-07T03:49:57",
      end: "2018-11-15T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: [
      "sc_hubble_space_telescope",
      "sc_chandra",
      "sc_spitzer",
      "sc_tess",
    ],
  },
  sc_ladee: {
    title: "LADEE",
    description: {
      blurb: [
        "NASA's LADEE was a robotic mission that orbited the Moon to gather detailed information about the lunar atmosphere, conditions near the surface and the environmental influences on lunar dust.",
      ],
      more: [
        "By studying the exosphere—an atmosphere that is so thin that its molecules do not collide with each other—the Lunar Atmosphere and Dust Environment Explorer (LADEE) helped further the study of other planetary bodies with exospheres such as Mercury and some of Jupiter’s moons.",
      ],
    },
    dates: {
      start: "2013-09-07T03:27:00",
      end: "2014-04-08T04:30:00",
      landing: "",
    },
    parent: "moon",
    related: ["moon", "sc_lunar_reconaissance_orbiter"],
  },
  sc_landsat_7: {
    title: "Landsat 7",
    description: {
      blurb: [
        "The Landsat program offers the longest continuous global record of the Earth’s surface, supplying more than 40 years of imagery of the entire surface of Earth.",
      ],
      more: [
        "Landsat 7 is the seventh satellite of the Landsat program. Launched on 15 April 1999, Landsat 7's primary goal is to refresh the global archive of satellite photos, providing up-to-date and cloud-free images. The Landsat program is managed and operated by the United States Geological Survey, and data from Landsat 7 is collected and distributed by the USGS.",
      ],
    },
    dates: {
      start: "1999-04-15T18:32:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_landsat_8"],
  },
  sc_landsat_8: {
    title: "Landsat 8",
    description: {
      blurb: [
        "The Landsat program offers the longest continuous global record of the Earth’s surface, supplying more than 40 years of imagery of the entire surface of Earth.",
      ],
      more: [
        "It is the eighth satellite in the Landsat program; the seventh to reach orbit successfully. Originally called the Landsat Data Continuity Mission (LDCM), it is a collaboration between NASA and the United States Geological Survey (USGS). NASA Goddard Space Flight Center in Greenbelt, Maryland, provided development, mission systems engineering, and acquisition of the launch vehicle while the USGS provided for development of the ground systems and will conduct on-going mission operations. It comprises the camera of the Operational Land Imager (OLI) and the Thermal Infrared Sensor (TIRS) which can be used to study earth surface temperature and is used to study global warming.",
      ],
    },
    dates: {
      start: "2013-02-11T18:02:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_landsat_7", "sc_landsat_9"],
  },
  sc_landsat_9: {
    title: "Landsat 9",
    description: {
      blurb: [
        "The Landsat program offers the longest continuous global record of the Earth’s surface, supplying more than 40 years of imagery of the entire surface of Earth.",
      ],
      more: [
        "It is the ninth satellite in the Landsat program; the eigth to reach orbit successfully. Originally called the Landsat Data Continuity Mission (LDCM), it is a collaboration between NASA and the United States Geological Survey (USGS). NASA Goddard Space Flight Center in Greenbelt, Maryland, provided development, mission systems engineering, and acquisition of the launch vehicle while the USGS provided for development of the ground systems and will conduct on-going mission operations. It comprises the camera of the Operational Land Imager (OLI) and the Thermal Infrared Sensor (TIRS) which can be used to study earth surface temperature and is used to study global warming.",
      ],
    },
    dates: {
      start: "2021-09-27T18:11:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sc_landsat_7", "sc_landsat_8"],
  },
  sc_lcross: {
    title: "LCROSS",
    description: {
      blurb: [
        "NASA's Lunar Crater Observation and Sensing Satellite (LCROSS) was launched with the Lunar Reconnaissance Orbiter to determine if water-ice exists in a permanently shadowed crater at the Moon's south pole.",
      ],
      more: [
        "The identification of water is very important to the future of human activities on the Moon. LCROSS remained paired to its upper stage centaur until reaching the south pole of the moon. The centaur was then separated from LCROSS and intentionally crashed into the south pole of the Moon. The impact ejected material from the crater's floor to create a plume that specialized instruments have been able to analyze for the presence of water (ice and vapor), hydrocarbons and hydrated materials. About fifteeen minutes after the upper stage centaur impacted, LCROSS also intentionally crashed into the perpetually dark floor of the Moon's polar crater Cabeus.",
      ],
    },
    dates: {
      start: "2009-06-18T21:32:00",
      end: "2009-10-09T11:37:00",
      landing: "",
    },
    parent: "moon",
    related: ["sc_lunar_reconnaissance_orbiter", "moon"],
  },
  sc_lucy: {
    title: "Lucy",
    description: {
      blurb: [
        "The Lucy spacecraft will explore a record-breaking number of asteroids, flying by two asteroids in the solar system’s main asteroid belt, and by eight Trojan asteroids that share an orbit around the Sun with Jupiter.",
      ],
      link: "https://science.nasa.gov/mission/lucy/",
      more: [
        "Trojan asteroids associated with Jupiter are thought to be remnants of the primordial material that formed the outer planets. These primitive bodies may hold clues to the history of solar system formation. Lucy is the first mission to visit the Trojans.",
      ],
    },
    dates: {
      start: "2021-10-16T09:34:00",
      end: "",
      landing: "",
    },
    related: [
      "jupiter",
      "152830_dinkinesh",
      "52246_donaldjohanson",
      "3548_eurybates",
      "15094_polymele",
      "11351_leucus",
      "21900_orus",
      "617_patroclus",
    ],
  },
  sc_lunar_flashlight: {
    title: "Lunar Flashlight",
    description: {
      blurb: [
        "Roughly the size of a briefcase, Lunar Flashlight is a very small satellite that uses near-infrared lasers and an onboard spectrometer to map ice in permanently shadowed regions near the Moon's south pole.",
      ],
      more: [
        'The observations made by the low-cost mission provide unambiguous information about the presence of water ice deposits inside craters that would be an valuable in-situ resource for future Artemis missions to the lunar surface. As a technology demonstration mission, Lunar Flashlight showcases several technological firsts, including being the first mission to look for water ice using a laser reflectometer and the first planetary CubeSat mission to use "green" propulsion - a propellant that is less toxic and safer than hydrazine, a common propellant used by spacecraft.',
      ],
    },
    dates: {
      start: "2022-11-30T09:45:00",
      end: "",
      landing: "",
    },
    related: ["moon", "sc_artemis_1"],
  },
  sc_lunar_prospector: {
    title: "Lunar Prospector",
    description: {
      blurb: [
        "NASA's Lunar Prospector orbited the Moon for almost 19 months to map its surface composition and to look for polar ice.",
      ],
      more: [
        "The probe found evidence suggesting water ice at both poles. The mission ended in July of 1999 with the spacecraft impacting the lunar surface, creating a dust cloud that was studied from Earth.",
      ],
    },
    dates: {
      start: "1998-01-07T02:28:44",
      end: "1999-07-31T09:52:02",
      landing: "",
    },
    parent: "moon",
    related: ["moon"],
  },
  sc_lunar_reconnaissance_orbiter: {
    title: "Lunar Reconnaissance Orbiter",
    description: {
      blurb: [
        "The Lunar Reconnaissance Orbiter (LRO) was launched in 2009 on the first U.S. mission to the Moon in over 10 years.",
      ],
      more: [
        "LRO’s primary goal was to make a 3D map of the Moon’s surface from lunar polar orbit as part of a high-resolution mapping program to identify landing sites and potential resources, to investigate the radiation environment, and to prove new technologies in anticipation of future automated and human missions to the surface of the Moon.The LRO instruments return global data, such as day-night temperature maps, a global geodetic grid, high resolution color imaging and the moon's UV albedo. However there is particular emphasis on the polar regions of the moon where continuous access to solar illumination may be possible and the prospect of water in the permanently shadowed regions at the poles may exist.",
      ],
    },
    dates: {
      start: "2009-06-18T21:32:00",
      end: "",
      landing: "",
    },
    parent: "moon",
    related: ["sc_lcross", "moon", "sc_lunar_prospector", "sc_ladee"],
  },
  sc_magellan: {
    title: "Magellan",
    description: {
      blurb: [
        "NASA's Magellan mission was the first spacecraft to image the entire surface of Venus and made several discoveries about the planet.",
      ],
      more: [
        "The Magellan probe was the first interplanetary mission to be launched from the Space Shuttle, the first mission to map the entire surface of Venus, and the first spacecraft to test aerobraking as a method for circularizing its orbit. Magellan was the fifth successful NASA mission to Venus, and it ended an eleven-year gap in U.S. interplanetary probe launches. It self-destructed in the Venusian atmosphere in 1994.",
      ],
    },
    dates: {
      start: "1989-05-04T18:47:00",
      end: "1994-10-13T10:05:00",
      landing: "",
    },
    parent: "venus",
    related: ["venus"],
  },
  sc_marco_a: {
    title: "MarCO A",
    description: {
      blurb: ["MarCO was the first mission to test CubeSats in deep space"],
      more: [
        "Launching with the InSight mission to Mars, the twin spacecraft provided an experimental communications relay to let scientists on Earth know quickly about InSight's landing.",
      ],
    },
    dates: {
      start: "2018-05-05T11:05:00",
      end: "2019-01-04T00:00:00",
      landing: "",
    },
    related: [],
  },
  sc_marco_b: {
    title: "MarCO B",
    description: {
      blurb: ["MarCO was the first mission to test CubeSats in deep space"],
      more: [
        "Launching with the InSight mission to Mars, the twin spacecraft provided an experimental communications relay to let scientists on Earth know quickly about InSight's landing.",
      ],
    },
    dates: {
      start: "2018-05-05T11:05:00",
      end: "2018-12-29T00:00:00",
      landing: "",
    },
    related: [],
  },
  sc_mars_express: {
    title: "Mars Express",
    description: {
      blurb: [
        "The Mars Express mission is exploring the planet Mars, and is the first planetary mission attempted by the European Space Agency (ESA).",
      ],
      more: [
        "NASA is participating in a mission of the European Space Agency and the Italian Space Agency called Mars Express, which has been exploring the atmosphere and surface of Mars from polar orbit since arriving at the red planet on December 26, 2003. The mission's main objective is to search for sub-surface water from orbit. Seven scientific instruments on the orbiting spacecraft have conducted rigorous investigations to help answer fundamental questions about the geology, atmosphere, surface environment, history of water, and potential for life on Mars. Examples of discoveries - still debated by scientists -- by Mars Express are evidence of recent glacial activity, explosive volcanism, and methane gas.",
        "Mars Express is so called because it will be built more quickly than any other comparable planetary mission.",
      ],
    },
    dates: {
      start: "2003-06-02T17:45:00",
      end: "",
      landing: "",
    },
    related: ["mars"],
    parent: "mars",
  },
  sc_mars_global_surveyor: {
    title: "Mars Global Surveyor",
    description: {
      blurb: [
        "Mars Global Surveyor was a global mapping mission that examined the entire planet, from the ionosphere down through the atmosphere to the surface.",
      ],
      more: [
        "During its mission, Mars Global Surveyor also produced the first three-dimensional profiles of Mars’ North Pole using laser altimeter readings. In addition, the laser altimeter essentially mapped almost all of the planet, by firing approximately 500 billion pulses at the surface, providing topographical data that was more detailed than many places on Earth. The spacecraft’s primary mission concluded on Feb. 1, 2001, by which time it had returned 83,000 images of Mars, more than all previous missions to Mars combined. It continued to operate until late 2006.",
      ],
    },
    dates: {
      start: "1996-11-07T17:00:00",
      end: "2006-11-02T00:00:00",
      landing: "",
    },
    parent: "mars",
    related: ["mars"],
  },
  sc_mars_odyssey: {
    title: "Mars Odyssey",
    description: {
      blurb: [
        "Still in orbit around Mars, 2001 Mars Odyssey holds the record for the longest continually active spacecraft in orbit around a planet other than Earth.",
      ],
      more: [
        "Mars Odyssey was designed to investigate the Martian environment, providing key information on its surface and the radiation hazards future explorers might face. The goal was to map the chemical and mineralogical makeup of Mars as a step to detecting evidence of past or present water and volcanic activity on Mars. One of Mars Odyssey’s most exciting findings came early in the mission. In May 2002, NASA announced that the probe had identified large amounts of hydrogen in the soil, implying the presence of ice below the planet’s surface. During its many years in Martian orbit, Mars Odyssey globally mapped the amount and distribution of the numerous chemical elements and minerals in the Martian surface and also tracked the radiation environment in low Mars orbit, both necessary before humans can effectively explore the Martian surface.",
        "By mid-2016, the THEMIS instrument had returned more than 208,000 images in visible-light wavelengths and more than 188,000 in thermal-infrared wavelengths.",
      ],
    },
    dates: {
      start: "2001-04-07T15:02:22",
      end: "",
      landing: "",
    },
    related: ["mars"],
    parent: "mars",
  },
  sc_mars_reconnaissance_orbiter: {
    title: "Mars Reconnaissance Orbiter",
    description: {
      blurb: [
        "Mars Reconnaissance Orbiter (MRO) is a large orbiter, modeled in part on NASA’s highly successful Mars Global Surveyor spacecraft, designed to photograph Mars from orbit.",
      ],
      more: [
        "Mars Reconnaissance Orbiter is designed to track changes in the water and dust in Mars' atmosphere, look for more evidence of ancient seas and hot springs and peer into past Martian climate changes by studying surface minerals and layering. The orbiter carries a powerful camera capable of taking sharp images of surface features the size of a beach ball. The orbiter also serves as a data relay station for other Mars missions.",
      ],
    },
    dates: {
      start: "2005-08-12T11:43:00",
      end: "",
      landing: "",
    },
    related: ["mars", "sc_mars_global_surveyor"],
    parent: "mars",
  },
  sc_maven: {
    title: "MAVEN",
    description: {
      blurb: [
        "NASA's MAVEN is currently orbiting Mars studying the structure and composition of the upper atmosphere of the Red Planet.",
      ],
      more: [
        "The Mars Atmosphere and Volatile Evolution Mission (MAVEN) is the first mission dedicated to studying Mars’ upper atmosphere. The goal is to use this data to determine how the loss of volatiles from the Martian atmosphere has affected the Martian climate over time, and thus contribute to a better understanding of terrestrial climatology.",
      ],
    },
    dates: {
      start: "2013-11-18T18:28:00",
      end: "",
      landing: "",
    },
    related: ["mars"],
    parent: "mars",
  },
  sc_messenger: {
    title: "MESSENGER",
    description: {
      blurb: [
        "MESSENGER was a NASA robotic space probe that orbited the planet Mercury between 2011 and 2015, studying Mercury's chemical composition, geology, and magnetic field.",
      ],
      more: [
        "MESSENGER (Mercury Surface, Space Environment, Geochemistry and Ranging) was the first spacecraft to orbit Mercury. Among its accomplishments, the mission determined Mercury’s surface composition, revealed its geological history, discovered details about its internal magnetic field, and verified its polar deposits are dominantly water-ice. The mission ended when MESSENGER slammed into Mercury’s surface.",
      ],
    },
    dates: {
      start: "2004-08-03T06:15:56",
      end: "2015-04-30T19:26:00",
      landing: "",
      highlight: "2015-04-30T18:26:00",
    },
    parent: "mercury",
    related: ["mercury"],
  },
  sc_mcubed_2: {
    title: "MCubed-2",
    description: {
      blurb: [
        "MCubed-2 is a CubeSat (a miniaturized satellite) built by students at the University of Michigan in collaboration with NASA.",
      ],
      more: [
        "MCubed-2, short for Michigan Multipurpose Minisat 2, was designed as a technology demonstrator for a new FPGA-based image processing system intended for a future NASA mission.",
      ],
    },
    dates: {
      start: "2013-12-06",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_mms_1: {
    title: "MMS 1",
    description: {
      blurb: [
        "MMS consists of four identical spacecraft that orbit around Earth through the dynamic magnetic system surrounding our planet to study a little-understood phenomenon called magnetic reconnection.",
      ],
      more: [
        "The Magnetospheric Multiscale (MMS) mission is a Solar Terrestrial Probes mission comprising four identically instrumented spacecraft that will use Earth's magnetosphere as a laboratory to study the microphysics of three fundamental plasma processes: magnetic reconnection, energetic particle acceleration, and turbulence. These processes occur in all astrophysical plasma systems but can be studied in situ only in our solar system and most efficiently only in Earth's magnetosphere, where they control the dynamics of the geospace environment and play an important role in the processes known as \"space weather.\"",
      ],
    },
    dates: {
      start: "2015-03-13T02:44:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_mms_2", "sc_mms_3", "sc_mms_4"],
  },
  sc_mms_2: {
    title: "MMS 2",
    description: {
      blurb: [
        "MMS consists of four identical spacecraft that orbit around Earth through the dynamic magnetic system surrounding our planet to study a little-understood phenomenon called magnetic reconnection.",
      ],
      more: [
        "The Magnetospheric Multiscale (MMS) mission is a Solar Terrestrial Probes mission comprising four identically instrumented spacecraft that will use Earth's magnetosphere as a laboratory to study the microphysics of three fundamental plasma processes: magnetic reconnection, energetic particle acceleration, and turbulence. These processes occur in all astrophysical plasma systems but can be studied in situ only in our solar system and most efficiently only in Earth's magnetosphere, where they control the dynamics of the geospace environment and play an important role in the processes known as \"space weather.\"",
      ],
    },
    dates: {
      start: "2015-03-13T02:44:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_mms_1", "sc_mms_3", "sc_mms_4"],
  },
  sc_mms_3: {
    title: "MMS 3",
    description: {
      blurb: [
        "MMS consists of four identical spacecraft that orbit around Earth through the dynamic magnetic system surrounding our planet to study a little-understood phenomenon called magnetic reconnection.",
      ],
      more: [
        "The Magnetospheric Multiscale (MMS) mission is a Solar Terrestrial Probes mission comprising four identically instrumented spacecraft that will use Earth's magnetosphere as a laboratory to study the microphysics of three fundamental plasma processes: magnetic reconnection, energetic particle acceleration, and turbulence. These processes occur in all astrophysical plasma systems but can be studied in situ only in our solar system and most efficiently only in Earth's magnetosphere, where they control the dynamics of the geospace environment and play an important role in the processes known as \"space weather.\"",
      ],
    },
    dates: {
      start: "2015-03-13T02:44:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_mms_1", "sc_mms_2", "sc_mms_4"],
  },
  sc_mms_4: {
    title: "MMS 4",
    description: {
      blurb: [
        "MMS consists of four identical spacecraft that orbit around Earth through the dynamic magnetic system surrounding our planet to study a little-understood phenomenon called magnetic reconnection.",
      ],
      more: [
        "The Magnetospheric Multiscale (MMS) mission is a Solar Terrestrial Probes mission comprising four identically instrumented spacecraft that will use Earth's magnetosphere as a laboratory to study the microphysics of three fundamental plasma processes: magnetic reconnection, energetic particle acceleration, and turbulence. These processes occur in all astrophysical plasma systems but can be studied in situ only in our solar system and most efficiently only in Earth's magnetosphere, where they control the dynamics of the geospace environment and play an important role in the processes known as \"space weather.\"",
      ],
    },
    dates: {
      start: "2015-03-13T02:44:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_mms_1", "sc_mms_2", "sc_mms_3"],
  },
  sc_near_shoemaker: {
    title: "NEAR Shoemaker",
    description: {
      blurb: [
        "NASA's NEAR Shoemaker spacecraft was the first human-made object to orbit and the first to land an asteroid.",
      ],
      link: "https://solarsystem.nasa.gov/missions/near-shoemaker/in-depth/",
      more: [
        "The NEAR mission studied the near-Earth asteroid Eros from close orbit over a period of a year, and also flew by the asteroid Mathilde. The mission succeeded in closing in with the asteroid and orbited it several times, finally ending by touching down on the asteroid on February 12, 2001.",
      ],
    },
    dates: {
      start: "1996-02-17T20:43:27",
      end: "2001-02-28T00:00:00",
      landing: "2001-02-12T12:56:00",
    },
    related: ["433_eros", "253_mathilde"],
  },
  sc_new_horizons: {
    title: "New Horizons",
    description: {
      blurb: [
        "New Horizons is a NASA mission to study the dwarf planet Pluto, its moons, and other objects in the Kuiper Belt, a region of the solar system that extends from about 30 AU, near the orbit of Neptune, to about 50 AU from the Sun.",
      ],
      more: [
        "New Horizons was the first spacecraft to encounter Pluto, a relic from the formation of the solar system. By the time it reached the Pluto system, the spacecraft had traveled farther away and for a longer time period (more than nine years) than any previous deep space spacecraft ever launched. On July 14, 2015, New Horizons flew about 4,800 miles (7,800 kilometers) above the surface of Pluto. Besides collecting data on Pluto and Charon (the Charon flyby was at about 17,900 miles or 28,800 kilometers), New Horizons also observed Pluto’s other satellites, Nix, Hydra, Kerberos and Styx.",
        "The download of the entire set of data collected during the encounter with Pluto and Charon—about 6.25 gigabytes—took over 15 months and was officially completed at 21:48 UT Oct. 25, 2016. Such a lengthy period was necessary because the spacecraft was roughly 4.5 light-hours from Earth and it could only transmit 1-2 kilobits per second. On Jan. 1, 2019, New Horizons flew past Arrokoth (previously named 2014 MU69 and also called Ultima Thule), the most distant target in history. The New Horizons mission is currently exploring additional Kuiper Belt objects.",
      ],
    },
    dates: {
      start: "2006-01-19T19:52:00",
      end: "",
      landing: "",
    },
    parent: "outer_solar_system",
    related: [
      "134340_pluto",
      "charon",
      "hydra",
      "nix",
      "styx",
      "486958_arrokoth",
    ],
  },
  sc_nustar: {
    title: "NuSTAR",
    description: {
      blurb: [
        "The Nuclear Spectroscopic Telescope Array (NuSTAR) mission has deployed the first orbiting telescopes to focus light in the high energy X-ray region of the electromagnetic spectrum. Our view of the universe in this spectral window has been limited because previous orbiting telescopes have not employed true focusing optics, but rather have used coded apertures that have intrinsically high backgrounds and limited sensitivity.",
        "In addition to its core science program, NuSTAR will offer opportunities for a broad range of science investigations, ranging from probing cosmic ray origins to studying the extreme physics around collapsed stars to mapping microflares on the surface of the Sun. NuSTAR will also respond to targets of opportunity including supernovae and gamma-ray bursts.",
      ],
      readmore: [""],
    },
    dates: {
      start: "2012-06-13T16:00:37",
      end: "",
      landing: "",
    },
    related: ["earth", "sc_chandra"],
  },
  sc_oco_2: {
    title: "OCO-2",
    description: {
      blurb: [
        "The Orbiting Carbon Observatory 2, or OCO-2, is an Earth satellite mission designed to study the sources and sinks of carbon dioxide globally and provide scientists with a better idea of how carbon is contributing to climate change.",
      ],
      more: [
        "The OCO-2 Project primary science objective is to collect the first space-based measurements of atmospheric carbon dioxide with the precision, resolution and coverage needed to characterize its sources and sinks and quantify their variability over the seasonal cycle.OCO-2 flies in a sun-synchronous, near-polar orbit with a group of Earth-orbiting satellites with synergistic science objectives. Near-global coverage of the sunlit portion of Earth is provided in this orbit over a 16-day (233-revolution) repeat cycle. OCO-2’s single instrument incorporates three high-resolution grating spectrometers, designed to measure the near-infrared absorption of reflected sunlight by carbon dioxide and molecular oxygen.",
      ],
    },
    dates: {
      start: "2014-07-02T09:56:23",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_iss_oco3"],
  },
  sc_osiris_rex: {
    title: "OSIRIS-APEX (OSIRIS-REx)",
    description: {
      blurb: [
        "NASA’s OSIRIS-REx was the first U.S. mission to deliver an asteroid sample to Earth on September 24th, 2023. The spacecraft, renamed OSIRIS-APEX after the delivery, is now headed to asteroid Apophis for a 2029 rendezvous.",
      ],
      link: "https://www.nasa.gov/osiris-rex",
      more: [
        'OSIRIS-APEX is an acronym for "Origins, Spectral Interpretation, Resource Identification, Security-Apophis Explorer." Originally named OSIRIS-REx ("Regolith Explorer"), the goal of the mission was to collect a sample weighing 2.1 ounces (59.5 grams) from near-Earth asteroid 101955 Bennu and then to bring the sample to Earth.',
        "The mission, developed by scientists at the University of Arizona, will give scientists more information about how the early solar system formed and about how life began. It will also help us better understand asteroids that could impact Earth in the future. On October 20th, 2020, approximately 121.6 grams of material from the surface of Bennu was successfully collected. On May 10th, 2021, the spacecraft left Bennu after nearly two years in orbit to begin the two-year voyage back to Earth.",
        "On Sept. 24, 2023, the OSIRIS-REx spacecraft flew by Earth to release the capsule carrying the asteroid sample for a parachute landing. The sample capsule deployed its parachute at an altitude of about 1.9 miles (3 kilometers), bringing it in for a soft landing at the Utah Test and Training Range about 80 miles (130 kilometers) west of Salt Lake City, Utah.",
        "The capsule was sent to Johnson Space Center in Houston, Texas, where scientists at the Astromaterials Acquisition and Curation Office will catalog it and set aside portions of the sample for partners in the Japanese and Canadian space agencies. The spacecraft collected 121.6 grams of material from Bennu. ",
        "The main spacecraft (now renamed OSIRIS-APEX) will continue on to investigate the asteroid 99942 Apophis.",
        "",
      ],
    },
    dates: {
      start: "2016-09-08T23:05:00",
      end: "",
      landing: "",
    },
    related: ["101955_bennu", "99942_apophis", "sc_osiris_rex_src"],
  },
  sc_osiris_rex_src: {
    title: "OSIRIS-REx Sample Return Capsule",
    description: {
      blurb: [
        "On September 24th, 2023, the OSIRIS-REx sample return capsule re-entered Earth's atmosphere and landed using a parachute in the state of Utah in the United States.",
      ],
      more: [
        "The OSIRIS-REx Sample Return Capsule (SRC) is an aeroshell design container with a heat shield and parachutes. The capsule contains 121.6 grams of material from the surface of the asteroid Bennu.  The capsule containing the material from Bennu was the only part of the spacecraft to return to Earth. The spacecraft itself then changed to a new mission called OSIRIS-APEX and will proceed to study the asteroid Apophis. Lockheed Martin developed the SRC from a heritage design; the Stardust mission utilized a similar design to return tail material from Comet Wild 2 to Earth in 2006.",
      ],
    },
    dates: {
      start: "2023-09-24T01:00:00", // coercing again
      end: "2023-09-24T01:00:01", // ignore
      landing: "",
      highlight: "2023-09-24T10:44:00",
    },
    parent: "earth",
    related: ["101955_bennu", "sc_osiris_rex"],
  },
  sc_pace: {
    title: "PACE",
    description: {
      blurb: [
        "Plankton, Aerosol, Cloud, ocean Ecosystem (PACE) is a NASA Earth-observing satellite mission that will continue and advance observations of global ocean color, biogeochemistry, and ecology, as well as the carbon cycle, aerosols and clouds.",
      ],
      more: [
        "PACE will advance the assessment of ocean health by measuring the distribution of phytoplankton, tiny plants and algae that sustain the marine food web. It will also continue systematic records of key atmospheric variables associated with air quality and Earth's climate. PACE's data will help us better understand how the ocean and atmosphere exchange carbon dioxide. Novel uses of PACE data will benefit our economy and society; for example, it will help identify the extent and duration of harmful algal blooms. PACE will extend and expand NASA's long-term observations of our living planet. By doing so, it will take Earth's pulse in new ways for decades to come.",
      ],
    },
    dates: {
      start: "2024-02-08T06:33:00",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_parker_solar_probe: {
    title: "Parker Solar Probe",
    description: {
      blurb: [
        'NASA\'s Parker Solar Probe is on a mission to "touch the Sun." The spacecraft is flying closer to the Sun’s surface than any spacecraft before it. The mission will revolutionize our understanding of the Sun.',
      ],
      more: [
        "NASA's Parker Solar Probe is diving into the Sun’s atmosphere, facing brutal heat and radiation, on a mission to give humanity its first-ever sampling of a star’s atmosphere.",
        "During its journey, the mission will provide answers to long-standing questions that have puzzled scientists for more than 60 years: Why is the corona much hotter than the Sun's surface (the photosphere)? How does the solar wind accelerate? What are the sources of high-energy solar particles?",
        "We live in the Sun's atmosphere and this mission will help scientists better understand the Sun's impact on Earth.",
        "Data from Parker will be key to understanding and, perhaps, forecasting space weather. Space weather can change the orbits of satellites, shorten their lifetimes, or interfere with onboard electronics.",
        "On its final three orbits, Parker Solar Probe will fly to within 3.9 million miles (6.2 million kilometers) of the Sun’s surface—more than seven times closer than the current record holder for a close solar pass: the Helios 2 spacecraft. Helios came within 27 million miles (43 million kilometers) in 1976.",
        "Parker can survive these conditions because cutting-edge thermal engineering advances protect the spacecraft during its dangerous journey.",
        "The probe has four instrument suites designed to study magnetic fields, plasma and energetic particles, and image the solar wind.",
        "The mission is named for Dr. Eugene N. Parker, who pioneered our modern understanding of the Sun.",
      ],
    },
    dates: {
      start: "2018-08-12T07:31",
      end: "",
      landing: "",
    },
    related: ["sun", "sc_ulysses"],
  },
  sc_philae: {
    title: "Philae",
    description: {
      blurb: [
        "The European Space Agency's Rosetta was the first mission designed to orbit and land on a comet. It consisted of an orbiter and a lander -- called Philae.",
      ],
      more: [
        "On November 12th, 2014, the Philae probe successfully detached from Rosetta and landed on the surface of the comet 67P/Churyumov-Gerasimenko. Philae actually bounced off the surface of the comet twice, and its location was not known precisely for some time. Philae completed 80 percent of its planned first science sequence, returning spectacular images of its surroundings, showing a surface covered by dust and debris ranging in size from inches to a yard (millimeters to a meter).",
      ],
    },
    dates: {
      start: "2004-03-02T07:17:51",
      end: "2016-09-30T10:39:28",
      landing: "2014-11-12T17:32:00",
      highlight: "2014-11-12T14:31:00",
    },
    parent: "67p_churyumov_gerasimenko",
    related: ["67p_churyumov_gerasimenko", "sc_rosetta"],
  },
  sc_pioneer_10: {
    title: "Pioneer 10",
    description: {
      blurb: [
        "Launched in 1972, Pioneer 10 was the first spacecraft to visit Jupiter. Its mission ended in 2003, but it is one of four spacecraft (including the two Voyagers and Pioneer 11) carrying a message from Earth beyond our solar system.",
      ],
      more: [
        "Pioneer 10, the first NASA mission to the outer planets, garnered a series of firsts perhaps unmatched by any other robotic spacecraft in the space era: the first vehicle placed on a trajectory to escape the solar system into interstellar space; the first spacecraft to fly beyond Mars; the first to fly through the asteroid belt; the first to fly past Jupiter; and the first to use all-nuclear electrical power.",
      ],
    },
    dates: {
      start: "1972-03-02",
      end: "2003-01-23",
      landing: "",
    },
    parent: "outer_solar_system",
    related: ["sc_pioneer_11", "sc_voyager_1", "sc_voyager_2", "jupiter"],
  },
  sc_pioneer_11: {
    title: "Pioneer 11",
    description: {
      blurb: [
        "Launched in 1973, Pioneer 11 was the first spacecraft to fly past Saturn. Its mission ended in 1995, but it is one of four spacecraft (including the two Voyagers and Pioneer 10) carrying a message from Earth beyond our solar system.",
      ],
      more: [
        "Pioneer 11, the sister spacecraft to Pioneer 10, was the first human-made object to fly past Saturn and also returned the first pictures of the polar regions of Jupiter. Among Pioneer 11’s many discoveries at Saturn were a narrow ring outside the A ring named the F ring and a new satellite 124 miles (200 kilometers) in diameter.",
      ],
    },
    dates: {
      start: "1973-04-06",
      end: "1995-09-30",
      landing: "",
    },
    parent: "outer_solar_system",
    related: [
      "sc_pioneer_10",
      "sc_voyager_1",
      "sc_voyager_2",
      "saturn",
      "jupiter",
    ],
  },
  sc_polar: {
    title: "Polar",
    description: {
      blurb: [
        "The Polar satellite was a NASA science spacecraft designed to study the polar magnetosphere and aurorae.",
      ],
      more: [
        "Launched in 1996, the Polar mission gathered multi-wavelength imaging of the aurora, measured the entry of plasma into the polar magnetosphere and the geomagnetic tail, the flow of plasma to and from the ionosphere, and the deposition of particle energy in the ionosphere and upper atmosphere.",
      ],
    },
    dates: {
      start: "1996-02-24T11:24:00",
      end: "2008-04-28T00:00:00",
      landing: "",
    },
    related: ["earth"],
  },
  sc_psyche: {
    title: "Psyche",
    description: {
      blurb: [
        "The Psyche mission launched on October 13th, 2023, and will explore the origin of planetary cores by studying the metallic asteroid of the same name.",
      ],
      link: "https://www.jpl.nasa.gov/missions/psyche",
      more: [
        "Deep within the terrestrial planets, including Earth, scientists infer the presence of metallic cores, but these lie unreachably far below the planets’ rocky mantles and crusts. The asteroid Psyche offers a unique window into these building blocks of planet formation and the opportunity to investigate a previously unexplored type of world.",
      ],
    },
    dates: {
      start: "2023-10-12T15:26:00",
      end: "",
      landing: "",
    },
    related: [],
  },
  sc_quikscat: {
    title: "QuikSCAT",
    description: {
      blurb: [
        "The NASA QuikSCAT (Quick Scatterometer) was an Earth observation satellite designed to measure wind speeds over the ocean.",
      ],
      more: [
        "Its primary mission was to measure the surface wind speed and direction over the ice-free global oceans. Observations from QuikSCAT had a wide array of applications, and contributed to climatological studies, weather forecasting, meteorology, oceanographic research, marine safety, commercial fishing, tracking large icebergs, and studies of land and sea ice, among others.",
      ],
    },
    dates: {
      start: "1999-06-19T02:15:00",
      end: "2018-10-02T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_iss_rapidscat"],
  },
  sc_raincube: {
    title: "RainCube",
    description: {
      blurb: [
        "RainCube is a CubeSat (a type of miniature satellite) that is designed to test technology and monitor precipitation.",
      ],
      more: [
        "RainCube has three main objectives: Develop, launch, and operate the first radar instrument on a CubeSat (6U), demonstrate new technologies and provide space validation for a Ka-band (35.75 GHz) precipitation profiling radar, and enable future precipitation profiling Earth  science missions on a low-cost, quick-turnaround platform. RainCube was launched directly from the International Space Station.",
      ],
    },
    dates: {
      start: "2018-05-21T00:00:00",
      end: "2020-12-24T00:00:00",
      landing: "",
    },
    related: ["earth"],
  },
  sc_rbsp_a: {
    title: "Van Allen Probe A",
    description: {
      blurb: [
        "The Van Allen Probes were two robotic spacecraft that were used to study the Van Allen radiation belts that surround Earth.",
      ],
      more: [
        'A Van Allen radiation belt is a zone of energetic charged particles, most of which originate from the solar wind, that are captured by and held around a planet by that planet\'s magnetic field. The Van Allen Probes were built to study these areas of "space weather" in more detail.',
      ],
    },
    dates: {
      start: "2012-08-30T08:05:00",
      end: "2019-10-18T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_rbsp_b"],
  },
  sc_rbsp_b: {
    title: "Van Allen Probe B",
    description: {
      blurb: [
        "The Van Allen Probes were two robotic spacecraft that were used to study the Van Allen radiation belts that surround Earth.",
      ],
      more: [
        'A Van Allen radiation belt is a zone of energetic charged particles, most of which originate from the solar wind, that are captured by and held around a planet by that planet\'s magnetic field. The Van Allen Probes were built to study these areas of "space weather" in more detail.',
      ],
    },
    dates: {
      start: "2012-08-30T08:05:00",
      end: "2019-07-19T00:00:00",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_rbsp_a"],
  },
  sc_sac_d: {
    title: "Aquarius",
    description: {
      blurb: [
        "The Aquarius mission, also known as SAC-D, has an instrument also called Aquarius that measured sea surface salinity.",
      ],
      more: [
        "The Aquarius instrument's surface salinity measurements contributed to a better understanding of ocean dynamics and advancing climate and ocean models, both from season to season and year to year.",
      ],
    },
    dates: {
      start: "2011-06-10T14:20:00",
      end: "2015-06-07T00:00:00",
      landing: "",
    },
    related: [],
  },
  sc_rosetta: {
    title: "Rosetta",
    description: {
      blurb: [
        "Rosetta was a European Space Agency mission that was the first spacecraft to orbit a comet, 67P/Churyumov-Gerasimenko.",
      ],
      link: "https://www.esa.int/Enabling_Support/Operations/Rosetta",
      more: [
        "The mission was launched on 2 March 2004, on a 10-year journey towards comet 67P/Churyumov-Gerasimenko. En route, it passed by two asteroids, 2867 Steins (in 2008) and 21 Lutetia (in 2010), before entering deep-space hibernation mode in June 2011. On 20 January 2014, it 'woke up' and prepared for arrival at the comet in August that year. On 12 November, the mission deployed its Philae probe to the comet, the first time in history that such a feat was achieved.",
      ],
    },
    dates: {
      start: "2004-03-02T09:40:51",
      end: "2016-09-30T10:39:28",
      landing: "2014-11-12T17:32:00",
    },
    related: ["67p_churyumov_gerasimenko", "21_lutetia", "2867_steins"],
  },
  sc_sdo: {
    title: "Solar Dynamics Observatory",
    description: {
      blurb: [
        "The Solar Dynamics Observatory (SDO) is the first mission to be launched for NASA's Living With a Star (LWS) Program, a program designed to understand the causes of solar variability and its impacts on Earth.",
      ],
      more: [
        "SDO is designed to help us understand the Sun's influence on Earth and Near-Earth space by studying the solar atmosphere on small scales of space and time and in many wavelengths simultaneously.",
      ],
    },
    dates: {
      start: "2010-02-11T15:23:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sun"],
  },
  sc_sentinel_6: {
    title: "Sentinel-6 Michael Freilich",
    description: {
      blurb: [
        "Sentinel-6 Michael Freilich measures sea level height worldwide, continuing the work of the Jason-3 satellite.",
      ],
      more: [
        "The first of two identical satellites to be launched five years apart, Sentinel-6 Michael Freilich will make high precision ocean altimetry measurements to continue the work previously done by Jason-1, Jason-2/OSTM, and the Jason-3 missions.",
        "A secondary objective is to collect high resolution vertical profiles of temperature and water vapor through the Radio Occultation instrument. This is used to help numerical weather predictions.",
      ],
    },
    dates: {
      start: "2020-11-21T17:17:08",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["earth", "sc_jason_3", "sc_jason_2"],
  },
  sc_smap: {
    title: "SMAP",
    description: {
      blurb: [
        "The Soil Moisture Active Passive (SMAP) mission is an orbiting observatory that measures the amount of water in the surface soil everywhere on Earth.",
      ],
      more: [
        "The Soil Moisture Active Passive (SMAP) satellite maps global soil moisture and detects whether soils are frozen or thawed. This mission helps scientists understand the links between Earth's water, energy and carbon cycles; reduce uncertainties in predicting weather and climate; and enhance our ability to monitor and predict natural hazards such as floods and droughts. SMAP is designed to measure soil moisture, every 2-3 days. This permits changes, around the world, to be observed over time scales ranging from major storms to repeated measurements of changes over the seasons.",
        "Everywhere on Earth not covered with water or not frozen, SMAP measures how much water is in the top layer of soil. It also distinguishes between ground that is frozen or thawed. Where the ground is not frozen, SMAP measures the amount of water found between the minerals, rocky material, and organic particles found in soil everywhere in the world (SMAP measures liquid water in the top layer of ground but is not able to measure the ice.)",
      ],
    },
    dates: {
      start: "2015-01-31T14:22:00",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_soho: {
    title: "SOHO",
    description: {
      blurb: [
        "SOHO is the longest-lived Sun-watching satellite to date. Numerous mission extensions have enabled the spacecraft to observe two 11-year solar cycles and to discover thousands of comets.",
      ],
      more: [
        "The ESA-sponsored Solar and Heliospheric Observatory (SOHO) carries 12 scientific instruments to study the solar atmosphere, helioseismology and the solar wind. Information from the mission has allowed scientists to learn more about the Sun’s internal structure and dynamics, the chromosphere, the corona and solar particles.",
      ],
    },
    dates: {
      start: "1995-12-02",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sun", "sc_sdo", "sc_stereo_ahead", "sc_stereo_behind"],
  },
  sc_sorce: {
    title: "SORCE",
    description: {
      blurb: [
        "The Solar Radiation and Climate Experiment (SORCE) was a NASA-sponsored satellite mission that measured incoming X-ray, ultraviolet, visible, near-infrared, and total solar radiation.",
      ],
      more: [
        "The measurements provided by SORCE specifically address long-term climate change, natural variability and enhanced climate prediction, and atmospheric ozone and UV-B radiation. These measurements are critical to studies of the Sun; its effect on our Earth system; and its influenceon humankind. SORCE ended its mission in 2020.",
      ],
    },
    dates: {
      start: "2003-01-25T20:13:35",
      end: "2020-02-25T00:00:00",
      landing: "",
    },
    related: ["earth", "sun"],
  },
  sc_spitzer: {
    title: "Spitzer Space Telescope",
    description: {
      blurb: [
        "NASA's Spitzer was the first telescope to detect light from an exoplanet, or a planet outside our solar system.",
      ],
      more: [
        "The Spitzer Space Telescope (formerly the Space Infrared Telescope Facility or SIRTF) was the fourth and last of NASA’s “Great Observatories,” and carried a 34-inch (85-centimeter) infrared telescope to study asteroids, comets, planets and distant galaxies. It was retired in January of 2020.",
      ],
    },
    dates: {
      start: "2003-08-25T05:35:39",
      end: "2020-01-30T00:00:00",
      landing: "",
    },
    related: ["sc_hubble_space_telescope", "sc_chandra"],
  },
  sc_stardust: {
    title: "Stardust",
    description: {
      blurb: [
        "NASA's Stardust was the first spacecraft to bring samples from a comet to Earth.",
      ],
      link: "https://solarsystem.nasa.gov/missions/stardust/in-depth/",
      more: [
        "Its primary goal was to fly by the Comet Wild 2, collect samples of dust from the coma of the comet as well as additional interstellar particles, and then bring the samples to Earth. In 2006, the sample return capsule re-entered Earth's atmosphere and landed in Utah, and the sampes have been studied ever since. After dropping off the samples at Earth, the spacecraft visited Comet Tempel 1 in 2011, and then the mission ended shortly thereafter.",
      ],
    },
    dates: {
      start: "1999-02-07T22:10:00",
      end: "2011-03-24T23:33:00",
      landing: "2006-01-15T10:12:00",
    },
    related: ["81p_wild_2", "earth", "9p_tempel_1"],
  },
  sc_stereo_ahead: {
    title: "STEREO Ahead",
    description: {
      blurb: [
        'The twin STEREO spacecraft studied the structure and evolution of solar storms as they emerge from the Sun. STEREO A("Ahead") remains active.',
      ],
      more: [
        "STEREO (Solar Terrestrial Relations Observatory), the third mission in NASA’s Solar Terrestrial Probes (STP) program, consisted of two space-based observatories to study the structure and evolution of solar storms as they emerge from the Sun and move out through space.",
        "The two spacecraft, one ahead of Earth in its orbit and the other trailing behind, provided the first stereoscopic images of the Sun, and collected data on the nature of its coronal mass ejections (CMEs), represented by large bursts of solar wind, solar plasma, and magnetic fields that are ejected into space. CMEs can disrupt communications, power grids, satellite operations, and air travel here on Earth. The orbital periods of STEREO A and STEREO B were 347 days and 387 days, respectively. The two spacecraft separate from each other at a (combined) annual rate of 44 degrees. At various points, the spacecraft were separated from each other by 90 degrees and 180 degrees. The latter occurred Feb. 6, 2011, allowing the entire Sun to be seen at once for the first time by any set of spacecraft.",
      ],
    },
    dates: {
      start: "2006-10-26T00:52:00",
      end: "",
      landing: "",
    },
    related: ["sun", "earth", "sc_stereo_behind", "sc_sdo", "sc_soho"],
  },
  sc_stereo_behind: {
    title: "STEREO Behind",
    description: {
      blurb: [
        'The twin STEREO spacecraft studied the structure and evolution of solar storms as they emerge from the Sun. STEREO B ("Behind") is no longer active.',
      ],
      more: [
        "STEREO (Solar Terrestrial Relations Observatory), the third mission in NASA’s Solar Terrestrial Probes (STP) program, consisted of two space-based observatories to study the structure and evolution of solar storms as they emerge from the Sun and move out through space.",
        "The two spacecraft, one ahead of Earth in its orbit and the other trailing behind, provided the first stereoscopic images of the Sun, and collected data on the nature of its coronal mass ejections (CMEs), represented by large bursts of solar wind, solar plasma, and magnetic fields that are ejected into space. CMEs can disrupt communications, power grids, satellite operations, and air travel here on Earth. The orbital periods of STEREO A and STEREO B were 347 days and 387 days, respectively. The two spacecraft separate from each other at a (combined) annual rate of 44 degrees. At various points, the spacecraft were separated from each other by 90 degrees and 180 degrees. The latter occurred Feb. 6, 2011, allowing the entire Sun to be seen at once for the first time by any set of spacecraft.",
      ],
    },
    dates: {
      start: "2006-10-26T00:52:00",
      end: "2016-09-23T00:00:00",
      landing: "",
    },
    related: ["sun", "earth", "sc_stereo_behind", "sc_sdo", "sc_soho"],
  },
  sc_tdrs_3: {
    title: "TDRS-3",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "1988-09-29T15:37:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_5",
      "sc_tdrs_6",
      "sc_tdrs_7",
      "sc_tdrs_8",
      "sc_tdrs_9",
      "sc_tdrs_10",
      "sc_tdrs_11",
    ],
  },
  sc_tdrs_5: {
    title: "TDRS-5",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "1991-08-02T15:02:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_6",
      "sc_tdrs_7",
      "sc_tdrs_8",
      "sc_tdrs_9",
      "sc_tdrs_10",
      "sc_tdrs_11",
    ],
  },
  sc_tdrs_6: {
    title: "TDRS-6",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "1993-01-13T13:59:30",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_5",
      "sc_tdrs_7",
      "sc_tdrs_8",
      "sc_tdrs_9",
      "sc_tdrs_10",
      "sc_tdrs_11",
    ],
  },
  sc_tdrs_7: {
    title: "TDRS-7",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "1995-07-13T13:59:30",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_5",
      "sc_tdrs_6",
      "sc_tdrs_8",
      "sc_tdrs_9",
      "sc_tdrs_10",
      "sc_tdrs_11",
    ],
  },
  sc_tdrs_8: {
    title: "TDRS-8",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "2000-06-30T12:56:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_5",
      "sc_tdrs_6",
      "sc_tdrs_7",
      "sc_tdrs_9",
      "sc_tdrs_10",
      "sc_tdrs_11",
    ],
  },
  sc_tdrs_9: {
    title: "TDRS-9",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "2002-03-08T22:59:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_5",
      "sc_tdrs_6",
      "sc_tdrs_7",
      "sc_tdrs_8",
      "sc_tdrs_10",
      "sc_tdrs_11",
    ],
  },
  sc_tdrs_10: {
    title: "TDRS-10",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "2002-12-05T02:42:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_5",
      "sc_tdrs_6",
      "sc_tdrs_7",
      "sc_tdrs_8",
      "sc_tdrs_9",
      "sc_tdrs_11",
    ],
  },
  sc_tdrs_11: {
    title: "TDRS-11",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "2013-01-31T01:48:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_5",
      "sc_tdrs_6",
      "sc_tdrs_7",
      "sc_tdrs_8",
      "sc_tdrs_9",
      "sc_tdrs_10",
    ],
  },
  sc_tdrs_12: {
    title: "TDRS-12",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "2014-01-24T02:33:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_5",
      "sc_tdrs_6",
      "sc_tdrs_7",
      "sc_tdrs_8",
      "sc_tdrs_9",
      "sc_tdrs_10",
      "sc_tdrs_11",
    ],
  },
  sc_tdrs_13: {
    title: "TDRS-13",
    description: {
      blurb: [
        "A tracking and data relay satellite (TDRS) is a type of communications satellite that forms part of the Tracking and Data Relay Satellite System (TDRSS) used by NASA and other United States government agencies for communications to and from satellites and remote ground stations.",
      ],
      more: [
        "Platforms such as satellites, balloons, aircraft, the International Space Station, and remote bases like the Amundsen-Scott South Pole Station are served by the TRDR system, which places satellites in geosynchronous orbit. It was designed to replace an existing worldwide network of ground stations that had supported all of NASA's crewed flight missions and uncrewed satellites in low-Earth orbits. The primary system design goal was to increase the amount of time that these spacecraft were in communication with the ground and improve the amount of data that could be transferred.",
      ],
    },
    dates: {
      start: "2017-08-18T12:29:00",
      end: "",
      landing: "",
    },
    related: [
      "earth",
      "sc_tdrs_3",
      "sc_tdrs_5",
      "sc_tdrs_6",
      "sc_tdrs_7",
      "sc_tdrs_8",
      "sc_tdrs_9",
      "sc_tdrs_10",
      "sc_tdrs_11",
      "sc_tdrs_12",
    ],
  },
  sc_suomi_npp: {
    title: "Suomi NPP",
    description: {
      blurb: [
        "The Suomi National Polar-orbiting Partnership, or Suomi NPP, is a weather satellite operated by the United States National Oceanic and Atmospheric Administration.",
      ],
      more: [
        "NPP represents a critical first step in building the next-generation Earth-observing satellite system that will collect data on long-term climate change and short-term weather conditions. NPP is the result of a partnership between NASA, the National Oceanic and Atmospheric Administration, and the Department of Defense.",
        "NPP will extend and improve upon the Earth system data records established by NASA's Earth Observing System fleet of satellites that have provided critical insights into the dynamics of the entire Earth system: clouds, oceans, vegetation, ice, solid Earth and atmosphere.",
      ],
    },
    dates: {
      start: "2011-10-28T09:48:01.828",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_swot: {
    title: "SWOT",
    description: {
      blurb: [
        "SWOT (Surface Water & Ocean Topography) will make the first global survey of Earth's surface water, observe the fine details of the ocean's surface topography, and measure how water bodies change over time.",
      ],
    },
    dates: {
      start: "2022-12-16T13:00:00",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_tempo: {
    title: "TEMPO",
    description: {
      blurb: [
        "The Tropospheric Emissions: Monitoring of Pollution (TEMPO) mission measures atmospheric pollution covering most of North America on an hourly basis and at high spatial resolution.",
      ],
      more: [
        "Hosted on the Intelsat 40E, the TEMPO instrument is a UV-visible spectrometer, and is the first ever space-based instrument to monitor air pollutants hourly across the North American continent during daytime. It collects high-resolution measurements of ozone, nitrogen dioxide and other pollutants, data which will revolutionize air quality forecasts.",
      ],
    },
    dates: {
      start: "2023-04-07T04:30:00",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_terra: {
    title: "Terra",
    description: {
      blurb: [
        "Terra explores the connections between Earth's atmosphere, land, snow and ice, ocean, and energy balance to understand Earth's climate and climate change and to map the impact of human activity and natural disasters on communities and ecosystems.",
      ],
      more: [
        "Terra carries five instruments that observe Earth’s atmosphere, ocean, land, snow and ice, and energy budget. Taken together, these observations provide unique insight into how the Earth system works and how it is changing. Terra observations reveal humanity’s impact on the planet and provide crucial data about natural hazards like fire and volcanoes. Terra is an international mission carrying instruments from the United States, Japan, and Canada.",
      ],
    },
    dates: {
      start: "1999-12-18T18:57:39",
      end: "",
      landing: "",
    },
    related: ["earth"],
  },
  sc_tess: {
    title: "TESS",
    description: {
      blurb: [
        "NASA’s Transiting Exoplanet Survey Satellite is an all-sky survey mission that will discover thousands of exoplanets around nearby bright stars.",
      ],
      more: [
        "The Transiting Exoplanet Survey Satellite (TESS) is the next step in the search for planets outside of our solar system, including those that could support life. The mission will find exoplanets that periodically block part of the light from their host stars, events called transits. TESS will survey 200,000 of the brightest stars near the sun to search for transiting exoplanets. TESS launched on April 18, 2018, aboard a SpaceX Falcon 9 rocket.",
        "TESS scientists expect the mission will catalog thousands of planet candidates and vastly increase the current number of known exoplanets. Of these, approximately 300 are expected to be Earth-sized and super-Earth-sized exoplanets, which are worlds no larger than twice the size of Earth. TESS will find the most promising exoplanets orbiting our nearest and brightest stars, giving future researchers a rich set of new targets for more comprehensive follow-up studies.",
      ],
    },
    dates: {
      start: "2018-04-18T22:51:31",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "sc_kepler_space_telescope",
      "sc_spitzer",
      "sc_hubble_space_telescope",
    ],
  },
  sc_themis_a: {
    title: "THEMIS A",
    description: {
      blurb: [
        "The Time History of Events and Macroscale Interactions during Substorms (THEMIS) mission began in February 2007 as a constellation of five NASA satellites (THEMIS A through THEMIS E) to study energy releases from Earth's magnetosphere known as substorms.",
      ],
      more: [
        "The THEMIS mission was originally five satellites designed to study the Earth's magnetosphere and the storms it creates. Three of the satellites orbit the Earth within the magnetosphere, while two have been moved into orbit around the Moon. Those two were renamed ARTEMIS for Acceleration, Reconnection, Turbulence and Electrodynamics of the Moon's Interaction with the Sun. THEMIS B became ARTEMIS P1 and THEMIS C became ARTEMIS P2. ARTEMIS P1 and P2 together comprise the THEMIS-ARTEMIS mission. The three THEMIS spacecraft continue to collect data about the sun's interaction with Earth's magnetosphere.",
      ],
    },
    dates: {
      start: "2007-02-17T23:01:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_themis_b",
      "sc_themis_c",
      "sc_themis_d",
      "sc_themis_e",
    ],
  },
  sc_themis_b: {
    title: "ARTEMIS P1",
    description: {
      blurb: [
        "The separate spacecraft ARTEMIS P1 and P2 together comprise the THEMIS-ARTEMIS mission, which studies the moon's interaction with the Sun. It is an offshoot of the THEMIS mission.",
      ],
      more: [
        "Launched in 2007, the THEMIS mission was originally five satellites designed to study the Earth's magnetosphere and the storms it creates. Three of the satellites orbit the Earth within the magnetosphere, while two have been moved into orbit around the Moon. Those two were renamed ARTEMIS for Acceleration, Reconnection, Turbulence and Electrodynamics of the Moon's Interaction with the Sun. THEMIS B became ARTEMIS P1 and THEMIS C became ARTEMIS P2. ARTEMIS P1 and P2 together comprise the THEMIS-ARTEMIS mission. They currently are in stable long-term orbits of the moon.",
      ],
    },
    dates: {
      start: "2007-02-17T23:01:00",
      end: "",
      landing: "",
    },
    parent: "moon",
    related: [
      "earth",
      "sc_themis_a",
      "sc_themis_c",
      "sc_themis_d",
      "sc_themis_e",
    ],
  },
  sc_themis_c: {
    title: "ARTEMIS P2",
    description: {
      blurb: [
        "The separate spacecraft ARTEMIS P1 and P2 together comprise the THEMIS-ARTEMIS mission, which studies the moon's interaction with the Sun. It is an offshoot of the THEMIS mission.",
      ],
      more: [
        "Launched in 2007, the THEMIS mission was originally five satellites designed to study the Earth's magnetosphere and the storms it creates. Three of the satellites orbit the Earth within the magnetosphere, while two have been moved into orbit around the Moon. Those two were renamed ARTEMIS for Acceleration, Reconnection, Turbulence and Electrodynamics of the Moon's Interaction with the Sun. THEMIS B became ARTEMIS P1 and THEMIS C became ARTEMIS P2. ARTEMIS P1 and P2 together comprise the THEMIS-ARTEMIS mission. They currently are in stable long-term orbits of the moon.",
      ],
    },
    dates: {
      start: "2007-02-17T23:01:00",
      end: "",
      landing: "",
    },
    parent: "moon",
    related: [
      "earth",
      "sc_themis_a",
      "sc_themis_b",
      "sc_themis_d",
      "sc_themis_e",
    ],
  },
  sc_themis_d: {
    title: "THEMIS D",
    description: {
      blurb: [
        "The Time History of Events and Macroscale Interactions during Substorms (THEMIS) mission began in February 2007 as a constellation of five NASA satellites (THEMIS A through THEMIS E) to study energy releases from Earth's magnetosphere known as substorms.",
      ],
      more: [
        "The THEMIS mission was originally five satellites designed to study the Earth's magnetosphere and the storms it creates. Three of the satellites orbit the Earth within the magnetosphere, while two have been moved into orbit around the Moon. Those two were renamed ARTEMIS for Acceleration, Reconnection, Turbulence and Electrodynamics of the Moon's Interaction with the Sun. THEMIS B became ARTEMIS P1 and THEMIS C became ARTEMIS P2. ARTEMIS P1 and P2 together comprise the THEMIS-ARTEMIS mission. The three THEMIS spacecraft continue to collect data about the sun's interaction with Earth's magnetosphere.",
      ],
    },
    dates: {
      start: "2007-02-17T23:01:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_themis_a",
      "sc_themis_b",
      "sc_themis_c",
      "sc_themis_e",
    ],
  },
  sc_themis_e: {
    title: "THEMIS E",
    description: {
      blurb: [
        "The Time History of Events and Macroscale Interactions during Substorms (THEMIS) mission began in February 2007 as a constellation of five NASA satellites (THEMIS A through THEMIS E) to study energy releases from Earth's magnetosphere known as substorms.",
      ],
      more: [
        "The THEMIS mission was originally five satellites designed to study the Earth's magnetosphere and the storms it creates. Three of the satellites orbit the Earth within the magnetosphere, while two have been moved into orbit around the Moon. Those two were renamed ARTEMIS for Acceleration, Reconnection, Turbulence and Electrodynamics of the Moon's Interaction with the Sun. THEMIS B became ARTEMIS P1 and THEMIS C became ARTEMIS P2. ARTEMIS P1 and P2 together comprise the THEMIS-ARTEMIS mission. The three THEMIS spacecraft continue to collect data about the sun's interaction with Earth's magnetosphere.",
      ],
    },
    dates: {
      start: "2007-02-17T23:01:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: [
      "earth",
      "sc_themis_a",
      "sc_themis_b",
      "sc_themis_c",
      "sc_themis_d",
    ],
  },
  sc_trace_gas_orbiter: {
    title: "Trace Gas Orbiter",
    description: {
      blurb: [
        "The ExoMars Trace Gas Orbiter (ExoMars TGO) is searching for methane and other trace gases in the Martian atmosphere that could be evidence of possible biological or geological activity. The orbiter is the first in a series of joint missions between the European Space Agency (ESA) and Roscosmos, the Russian space agency.",
      ],
      more: [
        "The ExoMars Trace Gas Orbiter (TGO) was designed to search for trace gases in the Martian atmosphere such as methane, water vapor, nitrogen oxides and acetylene. These gases could provide evidence for possible biological or geological activity on Mars. Organisms on Earth release methane during digestion, although geological processes such as the oxidation of minerals can also release methane.",
        "ExoMars also will monitor seasonal changes in the Martian atmosphere and will look for water-ice beneath the surface. Information gathered during the mission will help decide landing sites for future ESA missions.",
      ],
    },
    dates: {
      start: "2016-03-14T09:31:00",
      end: "",
      landing: "",
    },
    related: ["mars"],
    parent: "mars",
  },
  sc_trmm: {
    title: "TRMM",
    description: {
      blurb: [
        "The Tropical Rainfall Measuring Mission (TRMM) was a joint mission between NASA and the Japan Aerospace Exploration (JAXA) Agency to study rainfall for weather and climate research.",
      ],
      more: [
        "TRMM delivered a unique 17-year dataset of global tropical rainfall and lightning. The TRMM dataset became the space standard for measuring precipitation, and led to research that improved our understanding of tropical cyclone structure and evolution, convective system properties, lightning-storm relationships, climate and weather modeling, and human impacts on rainfall.",
      ],
    },
    dates: {
      start: "1997-11-27T21:27:00",
      end: "2015-04-15T00:00:00",
      landing: "",
    },
    related: ["earth"],
  },
  sc_ulysses: {
    title: "Ulysses",
    description: {
      blurb: [
        "The Ulysses mission made nearly three complete orbits of the Sun during more than 18 years in service.",
      ],
      more: [
        'Ulysses was launched in 1990 and made three "fast latitude scans" of the Sun in 1994/1995, 2000/2001, and 2007/2008. In addition, the probe studied several comets. The vehicle was designed to fly a unique trajectory that would use a gravity assist from Jupiter to take it out of the plane of the solar system. Ulysses found that the solar wind has become progressively weaker over the last 50 years.',
      ],
    },
    dates: {
      start: "1990-10-06T11:47:16",
      end: "2009-06-30T00:00:00",
      landing: "",
    },
    related: ["sun", "jupiter", "sc_parker_solar_probe"],
  },
  sc_voyager_1: {
    title: "Voyager 1",
    description: {
      blurb: [
        "No spacecraft has gone farther than NASA's Voyager 1. Launched in 1977 to fly by Jupiter and Saturn, Voyager 1 crossed into interstellar space in August 2012 and continues to collect data.",
      ],
      more: [
        "NASA's Voyager 1 was launched after Voyager 2, but because of a faster route, it exited the asteroid belt earlier than its twin, having overtaken Voyager 2 on Dec. 15, 1977. The twin Voyager 1 and 2 spacecraft are exploring where no spacecraft from Earth has flown before. Continuing on their more-than-40-year journey since their 1977 launches, they each are much farther away from Earth and the sun than Pluto. In August 2012, Voyager 1 made the historic entry into interstellar space, the region between stars, filled with material ejected by the death of nearby stars millions of years ago. Voyager 2 entered interstellar space on November 5, 2018 and scientists hope to learn more about this region. Both spacecraft are still sending scientific information about their surroundings through the Deep Space Network, or DSN. The primary mission was the exploration of Jupiter and Saturn. After making a string of discoveries there — such as active volcanoes on Jupiter's moon Io and intricacies of Saturn's rings — the mission was extended. Voyager 2 went on to explore Uranus and Neptune, and is still the only spacecraft to have visited those outer planets. The adventurers' current mission, the Voyager Interstellar Mission (VIM), will explore the outermost edge of the Sun's domain. And beyond.",
      ],
    },
    dates: {
      start: "1977-09-05T12:56:00",
      end: "",
      landing: "",
    },
    parent: "outer_solar_system",
    related: ["sc_voyager_2", "jupiter", "saturn", "titan"],
  },
  sc_voyager_2: {
    title: "Voyager 2",
    description: {
      blurb: [
        "NASA's Voyager 2 is the second spacecraft to enter interstellar space. On Dec. 10, 2018, the spacecraft joined its twin—Voyager 1—as the only human-made objects to enter the space between the stars.",
      ],
      more: [
        "The twin Voyager 1 and 2 spacecraft are exploring where no spacecraft from Earth has flown before. Continuing on their more-than-40-year journey since their 1977 launches, they each are much farther away from Earth and the sun than Pluto. Voyager 2 entered interstellar space on November 5, 2018 and scientists hope to learn more about this region. Both spacecraft are still sending scientific information about their surroundings through the Deep Space Network, or DSN.",
        "The primary mission was the exploration of Jupiter and Saturn. After making a string of discoveries there — such as active volcanoes on Jupiter's moon Io and intricacies of Saturn's rings — the mission was extended. Voyager 2 went on to explore Uranus and Neptune, and is still the only spacecraft to have visited those outer planets. The adventurers' current mission, the Voyager Interstellar Mission (VIM), will explore the outermost edge of the Sun's domain. And beyond.",
      ],
    },
    dates: {
      start: "1977-08-20T14:29:00",
      end: "",
      landing: "",
    },
    parent: "outer_solar_system",
    related: ["sc_voyager_1", "jupiter", "saturn", "uranus", "neptune"],
  },
  sc_wind: {
    title: "WIND",
    description: {
      blurb: [
        "The Wind spacecraft observes the solar wind that is about to impact the magnetosphere of Earth.",
      ],
    },
    dates: {
      start: "1994-11-01T09:31:00",
      end: "",
      landing: "",
    },
    parent: "earth",
    related: ["sun"],
  },
  valetudo: {
    title: "Valetudo",
    description: {
      blurb: [
        "This tiny moon of Jupiter was first spotted in 2017. The discovery announcement was made in July 2018.",
      ],
      more: [
        "Valetudo is named after the Roman god Jupiter’s great-granddaughter, the goddess of health and hygiene.",
      ],
    },
    related: [],
  },
};
