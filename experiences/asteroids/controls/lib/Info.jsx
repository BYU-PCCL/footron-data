import React, { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  IconButton,
  Link,
  ButtonGroup,
} from "@material-ui/core";
import { Close, NavigateBefore, NavigateNext } from "@material-ui/icons";

import {
  definitionListStyle,
  fullUIStyle,
  overlayMenuHeaderStyle,
  overlayMenuStyle,
  overlayMenuWrapperStyle,
  overlayStyle,
  thinWidgetStyle,
  topUI
} from "./style.jsx";

export default function Info() {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentDefinition, setCurrentDefinition] = useState("asteroid");
  const [menuOpen, setMenuOpen] = useState(false);

  const openDef = (word) => {
    setCurrentDefinition(word);
    setMenuOpen(true);
  };

  const pages = [
    <div key="page1">
      <h2>
        <small>Welcome to</small>
        <br />
        Eyes on Asteroids!
      </h2>
      <p>
        You are looking at a real-time visualization of every known{" "}
        <Link href="#" onClick={() => openDef("asteroid")}>
          asteroid
        </Link>{" "}
        or{" "}
        <Link href="#" onClick={() => openDef("comet")}>
          comet
        </Link>{" "}
        that is classified as a{" "}
        <Link href="#" onClick={() => openDef("neo")}>
          Near-Earth Object (NEO)
        </Link>
        .
        <br />
        With asteroids represented as blue points, and comets as white points,
        our database is updated daily to give you approximately 36,000 NEOs (and
        counting). Additionally, you can explore most of NASA&#39;s asteroid and
        comet missions (past and present), from Galileo, to Lucy and DART.
      </p>
      <div>
        <h5>Extra fact:</h5>
        <p>
          Farther from Earth, the full asteroid belt contains over a million
          members, with the majority lying between Mars and Jupiter.
        </p>
      </div>
    </div>,
    <div key="page2">
      <h2>
        <small>From 1990 to 2033</small>
        <br />
        You Control Time.
      </h2>
      <p>
        Drag the time slider left to go backwards, or right to go forwards in
        time. The LIVE button will always return you to the present time.
      </p>
    </div>,
    <div key="page3">
      <h2>Learn with the footron</h2>
      <p>
        Select &#39;Learn&#39; to access three different stories about asteroids and
        comets, including a tour through NASA&#39;s historic missions.
      </p>
    </div>,
    <div key="page4">
      <h2>Keep an Eye Out!</h2>
      <p>
        Select the &#39;Watch&#39; option to see the next five closest approaches to
        Earth, complete with a countdown.
      </p>
      <div>
        <h5>Hint:</h5>
        <p>Don&#39;t forget to play with that time slider!</p>
      </div>
    </div>,
    <div key="page5">
      <h2>Fine Tuning</h2>
      <p>
        Use the settings menu to toggle display layers, set filters, or change
        the lighting when the sun is not enough.
      </p>
      <p>
        toggle the filters to see just the comets, or just the asteroids, or
        just the{" "}
        <Link href="#" onClick={() => openDef("pho")}>
          Potentially Hazardous Objects (PHOs)
        </Link>
        .
      </p>
      <div>
        <h5>Just in case:</h5>
        <p>The info tab will take you back here if you ever need a recap.</p>
      </div>
    </div>,
    <div key="page6">
      <h2>Dare Mighty Things</h2>
      <p>
        You are now armed with all the knowledge to explore Eyes on Asteroids
        like a pro. Happy Learning!
      </p>
      <div>
        <h5>Learning can be addictive!</h5>
        <p>
          Watch out for any links; they may lead you down a rabbit hole of space
          knowledge...
        </p>
      </div>
    </div>,
    <div key="page7">
      <h2>Thank You</h2>
      <h3>for engaging with this experience</h3>
      <p>
        This experience was ported by Christian Price to the Footron from the
        original NASA website{" "}
        <a href="https://eyes.nasa.gov/apps/asteroids">Eyes on Asteroids</a>.
      </p>
      <p>I hope you enjoyed it!</p>
      <p>
        The data used to generate this visualization is from the{" "}
        <a href="https://cneos.jpl.nasa.gov" target="_blank" rel="noreferrer">
          Center for Near-Earth Object Studies
        </a>{" "}
        and JPL&#39;s{" "}
        <a href="https://ssd.jpl.nasa.gov" target="_blank" rel="noreferrer">
          Solar System Dynamics
        </a>{" "}
        website. Visit the{" "}
        <a
          href="https://www.nasa.gov/planetarydefense/overview"
          target="_blank"
          rel="noreferrer"
        >
          Planetary Defense Coordination Office
        </a>{" "}
        for more information on how NASA monitors for potentially hazardous
        asteroids and comets.
      </p>
      <br />
      <b>One last secret:</b>
      <br />
      <q>
        I wonder what would happen if you spun the joysticks counterclockwise?
      </q>
      <br />
      -Christian
    </div>,
  ];

  const definitions = {
    asteroid: {
      title: "Asteroid",
      description: (
        <div>
          <p>
            Sometimes called minor planets, asteroids are rocky, airless
            remnants left over from the early formation of our solar system
            about 4.6 billion years ago.
          </p>
          <p>
            Most of this ancient space rubble can be found orbiting the Sun
            between Mars and Jupiter within the main asteroid belt.
          </p>
          <p>
            Unlike{" "}
            <Link href="#" onClick={() => openDef("comet")}>
              comets
            </Link>
            , asteroids remain solid under extreme temperatures; this is due to
            their formation in the high heat, high density center of the solar
            nebula.
          </p>
          <p>
            Learn more by starting the Asteroids 101 deep dive in the learn tab
          </p>
        </div>
      ),
      relatedTerms: ["comet"],
    },
    comet: {
      title: "Comet",
      description: (
        <div>
          <p>
            Comets are frozen leftovers from the formation of the solar system
            composed of dust, rock, and ice. They range from a few kilometers,
            to hundreds of kilometers wide.
          </p>
          <p>
            As they orbit closer to the Sun, they heat up and spew gases and
            dust into a glowing head that can be larger than a planet. This
            material forms a tail that stretches millions of kilometers.
          </p>
          <p>
            Unlike{" "}
            <Link href="#" onClick={() => openDef("asteroid")}>
              asteroids
            </Link>
            , comets formed in areas of the solar nebula where it was cold
            enough for water and gases to freeze. Consequently, they are larger
            and rarer than asteroids, and tend to originate in the far reaches
            of the solar system.
          </p>
        </div>
      ),
      relatedTerms: ["asteroid"],
    },
    neo: {
      title: "Near Earth Object (NEO)",
      description: (
        <div>
          <p>
            {" "}
            A near-Earth object is any small solar system body whose orbit
            brings it within a certain distance of Earth. This distance is
            defined by having the closest approach to the sun, the{" "}
            <Link href="#" onClick={() => openDef("perihelion")}>
              perihelion
            </Link>
            , be within 1.3{" "}
            <Link href="#" onClick={() => openDef("au")}>
              AU
            </Link>
          </p>
          <p>
            A sub-category of the NEO is the{" "}
            <Link href="#" onClick={() => openDef("pho")}>
              PHO
            </Link>
            .
          </p>
        </div>
      ),
      relatedTerms: ["perihelion", "pho", "au"],
    },
    perihelion: {
      title: "Perihelion",
      description: (
        <div>
          <p>
            The perihelion is the point in the orbit of an object at which it is
            closest to the sun.{" "}
          </p>
          <p>
            The opposite case is called the{" "}
            <Link href="#" onClick={() => openDef("aphelion")}>
              aphelion
            </Link>
            .
          </p>
        </div>
      ),
      relatedTerms: ["aphelion"],
    },
    aphelion: {
      title: "Aphelion",
      description: (
        <div>
          <p>
            The aphelion is the point in the orbit of an object at which it is
            farthest from the sun.
          </p>
          <p>
            The opposite case is called the{" "}
            <Link href="#" onClick={() => openDef("perihelion")}>
              perihelion
            </Link>
            .
          </p>
        </div>
      ),
      relatedTerms: ["perihelion"],
    },
    au: {
      title: "Astronomical Unit (AU)",
      description: (
        <div>
          <p>
            An AU is defined as exactly 92,955,807.273 miles (149,597,871
            kilometers), or roughly the distance between the Earth and the Sun.
          </p>
          <p>
            Jupiter orbits at about 5.2 times the Sun-Earth distance, so
            Jupiter’s distance from the Sun can be expressed as 5.2 AU.
          </p>
          <p>
            1 AU is equivalent to 389,174{" "}
            <Link href="#" onClick={() => openDef("ld")}>
              LD
            </Link>
            s.
          </p>
        </div>
      ),
      relatedTerms: ["moid", "ld"],
    },
    ld: {
      title: "Lunar Distance (LD)",
      description: (
        <div>
          <p>
            A lunar distance is defined exactly as 384,398 kilometers (238,854
            miles); the average distance between the centers of the Earth and
            the Moon.
          </p>
          <p>
            More technically, it&#39;s the length of the semi-major axis of the
            geocentric lunar orbit.
          </p>
          <p>
            1 LD is equivalent to about 0.00257{" "}
            <Link href="#" onClick={() => openDef("au")}>
              AU
            </Link>
            .
          </p>
        </div>
      ),
      relatedTerms: ["au"],
    },
    moid: {
      title: "Minimum Orbit Intersection Distance (MOID)",
      description: (
        <div>
          <p>
            The MOID is the minimum distance between the orbits of two objects.
            It indicates the closest possible approach of two objects to each
            other.
          </p>
          <p>
            For Earth, an object with a MOID of less than or equal to 0.05{" "}
            <Link href="#" onClick={() => openDef("au")}>
              AU
            </Link>{" "}
            is considered a possible{" "}
            <Link href="#" onClick={() => openDef("pho")}>
              Potentially Hazardous Object
            </Link>{" "}
            if it&#39;s large enough.
          </p>
        </div>
      ),
      relatedTerms: ["au", "pho"],
    },
    pho: {
      title: "Potentially Hazardous Object (PHO)",
      description: (
        <div>
          <p>To be defined as potentially hazardous, an object must be:</p>
          <ul>
            <li>
              Larger than 150 meters (almost 500 feet), roughly twice as big as
              the Statue of Liberty is tall.
            </li>
            <li>
              Approach Earth&#39;s orbit to within about 7.5 million kilometers (4.6
              million miles). This can also be expressed as having a{" "}
              <Link href="#" onClick={() => openDef("moid")}>
                MOID
              </Link>{" "}
              of less than 0.05{" "}
              <Link href="#" onClick={() => openDef("au")}>
                AU
              </Link>{" "}
              (within 19.5{" "}
              <Link href="#" onClick={() => openDef("ld")}>
                LD
              </Link>
              s).
            </li>
          </ul>
          <p>
            PHOs can be both{" "}
            <Link href="#" onClick={() => openDef("asteroid")}>
              asteroids
            </Link>{" "}
            and{" "}
            <Link href="#" onClick={() => openDef("comet")}>
              comets
            </Link>
            , but the vast majority are asteroids. Learn more about the PHO,
            Apophis by starting the Close Approaches deep dive in the learn tab.
          </p>
        </div>
      ),
      relatedTerms: ["asteroid", "comet", "moid", "au", "ld"],
    },
  };

  const handleClickAwaySettings = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    console.log("Clicked away");
  };

  const ButtonList = ({ items }) => {
    return (
      <div
        css={definitionListStyle}
      >
        {items.map((item) => (
          <Button
            key={item}
            onClick={() => openDef(item)}
            variant="contained"
            color="primary"
          >
            {item}
          </Button>
        ))}
      </div>
    );
  };

  const Pagination = () => {
    return (
      <Box css={thinWidgetStyle}>
        <ButtonGroup>
          <Button
            color="primary"
            variant="contained"
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage == 1}
          >
            <NavigateBefore />
          </Button>
          {pages.map((page, index) => {
            const highlight = currentPage == index + 1;
            return (
              <Button key={index} onClick={() => setCurrentPage(index + 1)} variant={highlight ? "contained" : "text"} disabled={highlight} color="primary">
                {index + 1}
              </Button>
            )
          })}
          <Button
            color="primary"
            variant="contained"
            onClick={() => setCurrentPage(Math.min(currentPage + 1, pages.length))}
            disabled={currentPage == pages.length}
          >
            <NavigateNext />
          </Button>
        </ButtonGroup>
        {/* <Pagination inProps={paginationProps}/> */}
      </Box>
    )
  }

  ButtonList.propTypes = {
    items: PropTypes.arrayOf(PropTypes.string)
  }

  const DefinitionOverlay = ({
    definition,
  }) => {
    return (
      <Box css={overlayMenuStyle}>
        <Box css={overlayMenuHeaderStyle}>
          <Box> </Box>
          <h3>{definitions[definition].title}</h3>
          <IconButton onClick={() => setMenuOpen(false)}>
            <Close />
          </IconButton>
        </Box>
        {definitions[definition].description}
        <Divider />
        <h5>RELATED TERMS</h5>
        <ButtonList items={definitions[definition].relatedTerms} />
      </Box>
    );
  };

  DefinitionOverlay.propTypes = {
    definition: PropTypes.string
  }

  return (
    <Box css={fullUIStyle}>
      {menuOpen ? (
        <Dialog open={true} css={overlayStyle}>
          <ClickAwayListener onClickAway={handleClickAwaySettings}>
            <Box css={overlayMenuWrapperStyle}>
              <DefinitionOverlay definition={currentDefinition} />
            </Box>
          </ClickAwayListener>
        </Dialog>
      ) : null}
      <Box css={topUI}>{pages[currentPage - 1]}</Box>
      <Pagination />
    </Box>
  );
}
