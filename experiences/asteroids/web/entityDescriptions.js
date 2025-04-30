const entityDescriptions = {
    // Solar system
    Sun: "<h4>\
      Yellow Dwarf Star\
    </h4>\
    <p>\
      The Sun—the heart of our solar system—is a yellow dwarf star, a hot ball of glowing gases.Its     \
      gravity holds the solar system together, keeping everything from the biggest planets to the smallest particles of  \
      debris in its orbit. Electric currents in the Sun generate a magnetic field that is carried out through the solar  \
      system by the solar wind—a stream of electrically charged gas blowing outward from the Sun in all directions.\
    </p>\
    <p>\
      The connection and interactions between the Sun and Earth drive the seasons, ocean currents, weather, climate,     \
      radiation belts and aurorae. Though it is special to us, there are billions of stars like our Sun scattered across \
      the Milky Way galaxy. The Sun, and everything that orbits it, is located in the Milky Way galaxy. More             \
      specifically, our Sun is in a spiral arm called the Orion Spur that extends outward from the Sagittarius arm. From \
      there, the Sun orbits the center of the Milky Way Galaxy, bringing the planets, asteroids, comets and other objects\
      along with it. Our solar system is moving with an average velocity of 450,000 miles per hour (720,000 kilometers   \
      per hour). But even at this speed, it takes us about 230 million years to make one complete orbit around the Milky \
      Way.\
    </p>\
    <p>\
      The Sun rotates as it orbits the center of the Milky Way. Its spin has an axial tilt of 7.25 degrees with respect  \
      to the plane of the planets’ orbits. Since the Sun is not a solid body, different parts of the Sun rotate at       \
      different rates. At the equator, the Sun spins around once about every 25 days, but at its poles the Sun rotates   \
      once on its axis every 36 Earth days.\
    </p>",
    // Planets
    Mercury: "<h4>\
      Terrestrial\
    </h4>\
    <p>\
      The smallest planet in our solar system and nearest to the Sun, Mercury is only slightly larger than    \
      Earth's Moon.Mercury's surface temperatures are both extremely hot and cold. Because the planet is so close to the \
      Sun, day temperatures can reach highs of 800°F (430°C). Without an atmosphere to retain that heat at night,        \
      temperatures can dip as low as -290°F (-180°C). From the surface of Mercury, the Sun would appear more than three  \
      times as large as it does when viewed from Earth, and the sunlight would be as much as seven times brighter.       \
      Despite its proximity to the Sun, Mercury is not the hottest planet in our solar system – that title belongs to    \
      nearby Venus, thanks to its dense atmosphere. But Mercury is the fastest planet, zipping around the Sun every 88   \
      Earth days. Mercury's surface resembles that of Earth's moon, scarred by many impact craters resulting from        \
      collisions with meteoroids and comets. The first spacecraft to visit Mercury was Mariner 10, which imaged about 45 \
      percent of the surface. NASA's MErcury Surface, Space ENvironment, GEochemistry, and Ranging (MESSENGER) mission   \
      flew by Mercury three times in 2008-2009 and orbited the planet from 2011 to 2015, mapping the entire surface.\
    </p>",
    Venus: "<h4>\
      Terrestrial\
    </h4>\
    <p>\
      Similar in size and structure to Earth, Venus has been called Earth's twin. These are not identical twins, however \
      – there are radical differences between the two worlds.\
    </p>\
    <p>\
      Venus and Earth are similar in size, mass, density, composition, and gravity. There, however, the similarities end.\
      Venus has a thick, toxic atmosphere filled with carbon dioxide and it’s perpetually shrouded in thick, yellowish   \
      clouds of mostly sulfuric acid that trap heat, causing a runaway greenhouse effect. It’s the hottest planet in our \
      solar system, even though Mercury is closer to the Sun. Venus has crushing air pressure at its surface – more than \
      90 times that of Earth – similar to the pressure you'd encounter a mile below the ocean on Earth. Venus was the    \
      first planet to be explored by a spacecraft – NASA’s Mariner 2 successfully flew by and scanned the cloud-covered  \
      world on Dec. 14, 1962. Since then, numerous spacecraft from the U.S. and other space agencies have explored Venus,\
      including NASA’s Magellan, which mapped the planet's surface with radar. The former Soviet Union is the only nation\
      to land on the surface of Venus to date, though the spacecraft did not survive long in the harsh environment.\
    </p>",
    Earth: "<h4>\
      Terrestrial\
    </h4>\
    <p>\
      Earth—our home planet—is the only place we know of so far that’s inhabited by living things. It's also the only    \
      planet in our solar system with liquid water on the surface.\
    </p>\
    <p>\
      Earth is only the fifth largest planet in the solar system, just slightly larger than nearby Venus. Earth is the   \
      biggest of the four planets closest to the Sun, all of which are made of rock and metal. NASA has the most missions\
      of all operating on our home planet. NASA’s Earth Observing System (EOS) is a coordinated series of polar-orbiting \
      and low inclination satellites for long-term global observations of the land surface, biosphere, solid Earth,      \
      atmosphere, and oceans.\
    </p>",
    Mars: "<h4>\
      Terrestrial\
    </h4>\
    <p>\
      The fourth planet from the Sun, Mars is a dusty, cold, desert world with a very thin atmosphere.Mars was named by  \
      the ancient Romans for their god of war because its reddish color was reminiscent of blood. The Red Planet is      \
      actually many colors. At the surface we see colors such as brown, gold and tan. The reason Mars looks reddish is   \
      due to oxidization—or rusting—of iron in the rocks, regolith (Martian “soil”), and dust of Mars. This dust gets    \
      kicked up into the atmosphere and from a distance makes the planet appear mostly red. Mars is home to the largest  \
      volcano in the solar system, Olympus Mons. It's three times taller than Earth's Mt. Everest with a base the size of\
      the state of New Mexico.\
    <p>\
    </p>\
      Mars appears to have had a watery past, with ancient river valley networks, deltas and lakebeds, as well as rocks  \
      and minerals on the surface that could only have formed in liquid water. Some features suggest that Mars           \
      experienced huge floods about 3.5 billion years ago. There is water on Mars today, but the Martian atmosphere is   \
      too thin for liquid water to exist for long on the surface. Today, water on Mars is found in the form of water-ice \
      just under the surface in the polar regions as well as in briny (salty) water, which seasonally flows down some    \
      hillsides and crater walls.\
    </p>\
    <p>\
      No planet beyond Earth has been studied as intensely as Mars. Today, a science fleet of robotic spacecraft study   \
      Mars from all angles.\
    </p>",
    Jupiter: "<h4>\
      Gas Giant\
    </h4>\
    <p>\
      Jupiter is the fifth planet from our Sun and is, by far, the largest planet in the solar system – more than twice  \
      as massive as all the other planets combined.\
    </p>\
    <p>\
      Jupiter's stripes and swirls are actually cold, windy clouds of ammonia and water, floating in an atmosphere of    \
      hydrogen and helium. Jupiter’s iconic Great Red Spot is a giant    \storm bigger than Earth that has raged for     \
      hundreds of years. Jupiter is surrounded by dozens of moons. Jupiter also has several rings, but unlike the famous \
      rings of Saturn, Jupiter’s rings are very faint and made of dust, not ice. Jupiter has the shortest day in the     \
      solar system. One day on Jupiter takes only about 10 hours (the time it takes for Jupiter to rotate or spin around \
      once), and Jupiter makes a complete orbit around the Sun (a year in Jovian time) in about 12 Earth years (4,333    \
      Earth days). Its equator is tilted with respect to its orbital path around the Sun by just 3 degrees. This means   \
      Jupiter spins nearly upright and does not have seasons as extreme as other planets do. Jupiter took shape when the \
      rest of the solar system formed about 4.5 billion years ago, when gravity pulled swirling gas and dust in to become\
      this gas giant. Jupiter took most of the mass left over after the formation of the Sun, ending up with more than   \
      twice the combined material of the other bodies in the solar system. In fact, Jupiter has the same ingredients as a\
      star, but it did not grow massive enough to ignite.\
    </p>",
    Saturn: "<h4>\
      Gas Giant\
    </h4>\
    <p>\
      Saturn is the sixth planet from the Sun and the second largest planet in our solar system. Adorned with thousands  \
      of beautiful ringlets, Saturn is unique among the planets. It is not the only planet to have rings—made of chunks  \
      of ice and rock—but none are as spectacular or as complicated as Saturn's. Like fellow gas giant Jupiter, Saturn is\
      a massive ball made mostly of hydrogen and helium.\
    </p>\
    <p>\
      Surrounded by more than 140 known moons, Saturn is home to some of the most fascinating landscapes in our solar    \
      system. From the jets of water that spray from Enceladus to the methane lakes on smoggy Titan, the Saturn system is\
      a rich source of scientific discovery and still holds many mysteries.The farthest planet from Earth discovered by  \
      the unaided human eye, Saturn has been known since ancient times. The planet is named for the Roman god of         \
      agriculture and wealth, who was also the father of Jupiter. Saturn's rings are thought to be pieces of comets,     \
      asteroids or shattered moons that broke up before they reached the planet, torn apart by Saturn's powerful gravity.\
      They are made of billions of small chunksof ice and rock coated with another material such as dust. The ring       \
      particles mostly range from tiny, dust-sized icy grains to chunks as big as a house. A few particles are as large  \
      as mountains. The rings would look mostly white if you looked at them from the cloud tops of Saturn, and           \
      interestingly, each ring orbits at a different speed around the planet.\
    </p>",
    Uranus: "<h4>\
      Ice Giant\
    </h4>\
    <p>\
      The seventh planet from the Sun with the third largest diameter in our solar system, Uranus is very cold and windy.\
    </p>\
    <p>\
      The ice giant is surrounded by 13 faint rings and 27 small moons as it rotates at a nearly 90-degree angle from the\
      plane of its orbit. This unique tilt makes Uranus appear to spin on its side, orbiting the Sun like a rolling ball.\
      Uranus is the only planet whose equator is nearly at a right angle to its orbit, with a tilt of 97.77              \
      degrees—possibly the result of a collision with an Earth-sized object long ago. This unique tilt causes the most   \
      extreme seasons in the solar system. For nearly a quarter of each Uranian year, the Sun shines directly over each  \
      pole, plunging the other half of the planet into a 21-year-long, dark winter.\
    </p>\
    <p>\
      Uranus is also one of just two planets that rotate in the opposite direction than most of the planets (Venus is the\
      other one), from east to west.\
    </p>",
    Neptune: "<h4>\
      Ice Giant\
    </h4>\
    <p>\
      Dark, cold and whipped by supersonic winds, ice giant Neptune is the eighth and most distant planet in our solar   \
      system.More than 30 times as far from the Sun as Earth, Neptune is the only planet in our solar system not visible \
      to the naked eye. In 2011 Neptune completed its first 165-year orbit since its discovery in 1846.\
    </p>\
    <p>\
      Neptune is so far from the Sun that high noon on the big blue planet would seem like dim twilight to us. The warm  \
      light we see here on our home planet is roughly 900 times as bright as sunlight on Neptune. Neptune is one of two  \
      ice giants in the outer solar system (the other is Uranus). Most (80 percent or more) of the planet's mass is made \
      up of a hot dense fluid of \"icy\" materials — water, methane and ammonia — above a small, rocky core. Of the giant\
      planets, Neptune is the densest.\
    </p>\
    <p>\
      Scientists think there might be an ocean of super hot water under Neptune's cold clouds. It does not boil away     \
      because incredibly high pressure keeps it locked inside. Neptune's atmosphere is made up mostly of hydrogen and    \
      helium with just a little bit of methane. Neptune's neighbor Uranus is a blue-green color due to such atmospheric  \
      methane, but Neptune is a more vivid, brighter blue, so there must be an unknown component that causes the more    \
      intense color.\
    </p>",
    Ceres: "<h4>\
      Dwarf Planet\
    <h4>\
    <p>\
      Dwarf planet Ceres is the largest object in the asteroid belt between Mars and Jupiter and the only dwarf planet   \
      located in the inner solar system.Ceres was the first member of the asteroid belt to be discovered when Giuseppe   \
      Piazzi spotted it in 1801. And when Dawn arrived in 2015, Ceres became the first dwarf planet to receive a visit   \
      from a spacecraft.\
    </p>\
    <p>\
      Called an asteroid for many years, Ceres is so much bigger and so different from its rocky neighbors that          \
      scientists classified it as a dwarf planet in 2006. Even though Ceres comprises 25 percent of the asteroid belt's  \
      total mass, tiny Pluto is still 14 times more massive.\
    </p>\
    <p>\
      Ceres is named for the Roman goddess of corn and harvests. The word cereal comes from the same name.\
    </p>",
    Moon: "<h4>\
      Moon of Earth\
    <h4>\
    <p>\
      Earth's Moon is the only place beyond Earth where humans have set foot.The brightest and largest object in our     \
      night sky, the Moon makes Earth a more livable planet by moderating our home planet's wobble on its axis, leading  \
      to a relatively stable climate. It also causes tides, creating a rhythm that has guided humans for thousands of    \
      years.\
    </p>\
    <p>\
      Our moon is the fifth largest of the 190+ moons orbiting planets in our solar system.\
    </p>\
    <p>\
      Earth's only natural satellite is simply called \"the Moon\" because people didn't know other moons existed until  \
      Galileo Galilei discovered four moons orbiting Jupiter in 1610. With a radius of 1,079.6 miles (1,737.5            \
      kilometers), the Moon is less than a third the width of Earth. If Earth were the size of a nickel, the Moon would  \
      be about as big as a coffee bean.\
    </p>\
    <p>\
      The Moon is farther away from Earth than most people realize. The Moon is an average of 238,855 miles (384,400     \
      kilometers) away. That means 30 Earth-sized planets could fit in between Earth and the Moon.\
    <\p>\
    <p>\
      The Moon is slowly moving away from Earth, getting about an inch farther away each year. The leading theory of the \
      Moon's origin is that a Mars-sized body collided with Earth about 4.5 billion years ago. The resulting debris from \
      both Earth and the impactor accumulated to form our natural satellite. The newly formed Moon was in a molten state,\
      but within about 100 million years, most of the global \"magma ocean\" had crystallized, with less-dense rocks     \
      floating upward and eventually forming the lunar crust.\
    </p>",
    // Asteroids
    Bennu: "<h4>\
      Asteroid\
    </h4>\
    <p>\
      Discovered in September of 1999, Bennu was the subject of the OSIRIS-REx mission, which touched down on the        \
      asteroid and collected a sample of the surface on October 20th, 2020. OSIRIS-REx departed Bennu in 2021, and       \
      delivered the capsule with pieces of the asteroid to Earth on September 24, 2023.\
    </p>\
    <p>\
      Bennu is a PHO, and will have multiple close approaches with Earth over time. The last close approach was in 2023, \
      at a distance of 0.497 AU\
    </p>",
    Leucus: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1997, Leucus is a Trojan Asteroid that will be visited by the Lucy mission in April of 2028.\
    </p>",
    Polymele: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1999, Polymele is a Trojan Asteroid that will be visited by the Lucy mission in September of 2027.\
    </p>",
    Psyche: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1852, the Psyche asteroid is the subject of the ongoing Psyche mission that launched in October 2023.\
    </p>",
    Ryugu: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1999, Ryugu was the target of the Hayabusa2 mission, which orbited the asteroid for a year and a     \
      half, landed small rovers on it, and collected samples that were returned to Earth in December of 2020.\
    </p>",
    Lutetia: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1852, the asteroid was visited by the European space probe Rosetta in July of 2010.\
    </p>",
    Orus: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1999, Orus is a Trojan Asteroid that will be visited by the Lucy mission in November of 2028.\
    </p>",
    Ida: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1884, Ida was visited by the Galileo spacecraft in August of 1993.\
    </p>",
    Itokawa: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1998, Itokawa was the first asteroid to be the target of a sample return mission. The Japanese space \
      probe Hayabusa took a sample from the comet in November of 2005.\
    </p>",
    Mathilde: "<h4>\
      Asteroid\
    <h4>\
    <p></p>",
    Eurybates: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1973, Eurybates is the first Trojan Asteroid that the Lucy mission will visit in August of 2027. It has a small satellite named Queta.\
    </p>",
    Vesta: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      One of the largest and earliest known asteroids, Vesta was discovered on March 29th, 1807, and was visited by the Dawn mission in 2011.\
    </p>",
    Eros: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered on August 13th, 1898, Eros was the first near-Earth Object (NEO) ever found, and the first asteroid ever orbited by a spacecraft, NEAR-Shoemaker.\
    </p>",
    Donaldjohanson: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1981, and named after the paleoanthropologist who discovered the \"Lucy\" fossil, this will be the second small body that the Lucy mission will encounter in 2025.\
    </p>",
    Annefrank: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1942, the main belt asteroid 5535 Annefrank was used as a practice flyby target by the Stardust mission on November 2nd, 2002.\
    </p>",
    Patroclus: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1906, Patroclus is a Trojan Asteroid that will be visited by the Lucy mission in 2033. In 2001, Patroclus was found to be part of a binary asteroid system with its smaller twin, named Menoetius.\
    </p>",
    Didymos: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1996, Didymos is part of a binary asteroid system with its smaller partner, Dimorphos. The DART mission targeted this system, successfully crashing a probe into Dimorphos on September 26th, 2022.\
      Didymos is a PHO, and approached Earth at a distance of 0.07123 AU on October 4th, 2022.\
    </p>",
    Gaspra: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1916, Gaspra is the first asteroid to be closely approached by a spacecraft, which was Galileo in 1991.\
    </p>",
    Braille: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1992, Braille was visited by the Deep Space 1 mission on July 29th, 1999. The spacecraft passed within 26 km (16 miles) of the asteroid, which was the closest asteroid flyby ever at that time.\
    </p>",
    Apophis: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered on June 19, 2004 at the Kitt Peak National Observatory in Arizona.\
      On April 13, 2029, the asteroid Apophis will pass less than 23,239 miles (37,399 kilometers) from our planet’s surface – just outside the distance of geosynchronous satellites, and closer to Earth than any similarly sized \
      PHO in recorded history. At that time, Apophis will be visible to observers on the ground in the Eastern Hemisphere without the aid of a telescope or binoculars.\
    </p>",
    Dinkinesh: "<h4>\
      Asteroid\
    <h4>\
    <p>\
      Discovered in 1999, Dinkinesh will be the Lucy mission's first flyby target in early November of 2023. It will become the smallest main-belt asteroid ever visited.\
    </p>",
    // Comets
    "Hartley 2": "<h4>\
      Comet\
    <h4>\
    <p>\
      Discovered in 1986, Comet Hartley 2 was the target of the Deep Impact/EPOXI mission, which flew by in November of 2010.\
    </p>",
    "Tempel 1": "<h4>\
      Comet\
    <h4>\
    <p>\
      Discovered in 1867, comet Tempel 1 was the target of the Deep Impact mission, which physically collided with the comet on July 4th, 2005.\
    </p>",
    "Wild 2": "<h4>\
      Comet\
    <h4>\
    <p>\
      This comet was discovered on January 6th, 1978, and was visited by the Stardust mission in January of 2004.\
    </p>",
    "Churyumov Gerasimenko": "<h4>\
      Comet\
    <h4>\
    <p>\
      Discovered in 1969, this comet was the first to be landed upon by a robotic mission from Earth, the European Space Agency's Rosetta mission. The Philae lander touched down in November of 2014.\
    </p>",
    Borrelly: "<h4>\
      Comet\
    <h4>\
    <p>\
      Discovered in 1904, comet Borrelly was the target of the Deep Space 1 mission, which flew by in September of 2001.\
    </p>",
    // Spacecraft
    Lucy: "<h4>\
      Spacecraft\
    <h4>\
    <p>\
      The <a href=\"https://science.nasa.gov/mission/lucy/\" target=\"_blank\">Lucy</a> spacecraft will explore a record-breaking number of asteroids, flying by two asteroids in the solar system’s main asteroid belt, and by eight Trojan asteroids that share an orbit around the Sun with Jupiter.\
    </p>",
    "Osiris rex": "<h4>\
      Spacecraft\
    <h4>\
    <p>\
      NASA’s <a href=\"https://www.nasa.gov/osiris-rex\" target=\"_blank\">OSIRIS-REx</a> was the first U.S. mission to deliver an asteroid sample to Earth on September 24th, 2023. The spacecraft, renamed OSIRIS-APEX after the delivery, is now headed to asteroid Apophis for a 2029 rendezvous.\
    </p>",
    Psyche: "<h4>\
      Spacecraft\
    <h4>\
    <p>\
      The <a href=\"https://www.jpl.nasa.gov/missions/psyche\" target=\"_blank\">Psyche</a> mission launched on October 13th, 2023, and will explore the origin of planetary cores by studying the metallic asteroid of the same name.\
    </p>",
  }