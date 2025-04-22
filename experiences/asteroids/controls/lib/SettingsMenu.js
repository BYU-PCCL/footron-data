import React, { useEffect, useState } from "react";
import { useMessaging } from "@footron/controls-client";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
} from "@material-ui/core";
import { Close, Settings, Label } from "@material-ui/icons";
import PropTypes from "prop-types";

import {
  AsteroidIcon,
  CometIcon,
  ConstellationIcon,
  FloodLightingIcon,
  NaturalLightingIcon,
  OrbitIcon,
  PHOIcon,
  PlanetIcon,
  ShadowLightingIcon,
  StarsIcon,
  Satellite
} from "./icons";
import {
  overlayMenuHeaderStyle,
  overlayMenuStyle,
  overlaySettingsMenuStyle,
} from "./style";


export default function SettingsMenu({ toggle, onToggle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { sendMessage } = useMessaging();
  const [state, setState] = useState({
    asteroidsFilter: false,
    cometsFilter: false,
    phosFilter: false,
  });
  const [lighting, setLighting] = useState("none");

  useEffect(() => {
    setMenuOpen(toggle);
  }, [toggle]);

  const handleChange = (event) => {
    sendMessage({
      type: "settings",
      setting: event.target.name,
      value: event.target.checked,
    });
    setState({
      ...state,
      [event.target.name]: event.target.checked,
    });
  };

  const toggleButton = (setting) => {
    sendMessage({
      type: "settings",
      setting: setting,
    });
  };

  const handleLightingChange = (event) => {
    sendMessage({
      type: "settings",
      setting: "lighting",
      value: event.target.name,
    });
    setLighting(event.target.name);
  };

  return (
    <Box css={overlaySettingsMenuStyle}>
      <Box css={overlayMenuHeaderStyle}>
        <Box> </Box>
        <h4>Settings</h4>
        <IconButton onClick={onToggle}>
          <Close />
        </IconButton>
      </Box>
      <List css={overlayMenuStyle}>
        <h5>Filters</h5>
        <ListItem>
          <ListItemIcon>
            <AsteroidIcon />
          </ListItemIcon>
          <ListItemText primary="Asteroids" />
          <Switch
            edge="end"
            onChange={handleChange}
            name="asteroidsFilter"
            checked={state.asteroidsFilter}
            inputProps={{
              "aria-labelledby": "switch-list-label-bluetooth",
            }}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <CometIcon />
          </ListItemIcon>
          <ListItemText primary="Comets" />
          <Switch
            edge="end"
            onChange={handleChange}
            name="cometsFilter"
            checked={state.cometsFilter}
            inputProps={{
              "aria-labelledby": "switch-list-label-bluetooth",
            }}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <PHOIcon />
          </ListItemIcon>
          <ListItemText primary="Only PHOs" />
          <Switch
            edge="end"
            onChange={handleChange}
            name="phosFilter"
            checked={state.phosFilter}
            inputProps={{
              "aria-labelledby": "switch-list-label-bluetooth",
            }}
          />
        </ListItem>
        <h5>Lighting</h5>
        <ListItem>
          <ListItemIcon>
            <FloodLightingIcon />
          </ListItemIcon>
          <ListItemText primary="Flood" />
          <Switch
            edge="end"
            onChange={handleLightingChange}
            name="flood"
            checked={lighting == "flood"}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ShadowLightingIcon />
          </ListItemIcon>
          <ListItemText primary="Shadow" />
          <Switch
            edge="end"
            onChange={handleLightingChange}
            name="shadow"
            checked={lighting == "shadow"}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <NaturalLightingIcon />
          </ListItemIcon>
          <ListItemText primary="Natural" />
          <Switch
            edge="end"
            onChange={handleLightingChange}
            name="natural"
            checked={lighting == "natural"}
          />
        </ListItem>
        <h5>Layers</h5>
        <ListItem>
          <ListItemIcon>
            <PlanetIcon />
          </ListItemIcon>
          <Button
            variant="contained"
            color="primary"
            onClick={() => toggleButton("planets")}
          >
            planets
          </Button>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Satellite />
          </ListItemIcon>
          <Button
            variant="contained"
            color="primary"
            onClick={() => toggleButton("spacecraft")}
          >
            spacecraft
          </Button>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <OrbitIcon />
          </ListItemIcon>
          <Button
            variant="contained"
            color="primary"
            onClick={() => toggleButton("trails")}
          >
            trails
          </Button>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Label />
          </ListItemIcon>
          <Button
            variant="contained"
            color="primary"
            onClick={() => toggleButton("labels")}
          >
            labels
          </Button>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <AsteroidIcon />
          </ListItemIcon>
          <Button
            variant="contained"
            color="primary"
            onClick={() => toggleButton("icons")}
          >
            icons
          </Button>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <StarsIcon />
          </ListItemIcon>
          <Button
            variant="contained"
            color="primary"
            onClick={() => toggleButton("starfield")}
          >
            starfield
          </Button>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ConstellationIcon />
          </ListItemIcon>
          <Button
            variant="contained"
            color="primary"
            onClick={() => toggleButton("constellations")}
          >
            constellations
          </Button>
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <Button
            variant="contained"
            color="primary"
            onClick={() => toggleButton("ui")}
          >
            userInterface
          </Button>
        </ListItem>
      </List>
    </Box>
  );
}

SettingsMenu.propType = {
  toggle: PropTypes.bool,
  onToggle: PropTypes.func
};
