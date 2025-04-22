/** @jsxImportSource @emotion/react */
import React, { useState } from "react";
import { Box, ClickAwayListener, Dialog } from "@material-ui/core";
import { Close, Settings } from "@material-ui/icons";
import { useMessaging } from "@footron/controls-client";
import PropTypes from "prop-types";

import AsteroidWatch from "./AsteroidWatch";
import FlyTo from "./flyTo";
import Info from "./Info";
import Learn from "./Learn";
import SettingsMenu from "./SettingsMenu";
import {
  dynamicUiwrapperStyle,
  overlayMenuWrapperStyle,
  overlayStyle,
  selectedTabStyle,
  tabPanelStyle,
  tabsStyle,
  tabStyle,
  wrapperStyle
} from "./style";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      css={tabPanelStyle}
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {children}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  value: PropTypes.number,
  index: PropTypes.number
}

const ControlsComponent = () => {
  const { sendMessage } = useMessaging();
  const [menuOpen, setMenuOpen] = useState(false);
  const [value, setValue] = useState(2);

  const handleOpenSettings = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleClickAwaySettings = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setMenuOpen(false);
  };

  const getWatch = () => {
    setValue(1);
    sendMessage({ type: "context", value: "watch" });
  };

  const getFly = () => {
    setValue(2);
    sendMessage({ type: "context", value: "fly" });
  };

  const getLearn = () => {
    setValue(3);
    sendMessage({ type: "context", value: "learn" });
  };

  const getInfo = () => {
    setValue(4);
  };

  function Tab(props) {
    const { children, onClick, selected, ...other } = props;

    return (
      <Box
        css={selected ? selectedTabStyle : tabStyle}
        onClick={onClick}
        {...other}
      >
        {children}
      </Box>
    );
  }

  Tab.propTypes = {
    children: PropTypes.node,
    onClick: PropTypes.func,
    selected: PropTypes.string // This might be wrong
  }

  return (
    <Box css={wrapperStyle}>
      {/* Settings overlay */}
      {menuOpen ? (
        <Dialog open={true} css={overlayStyle}>
          <ClickAwayListener onClickAway={handleClickAwaySettings}>
            <Box css={overlayMenuWrapperStyle}>
              <SettingsMenu
                toggle={menuOpen}
                onToggle={handleOpenSettings}
              />
            </Box>
          </ClickAwayListener>
        </Dialog>
      ) : null}
      <Box css={dynamicUiwrapperStyle}>
        <CustomTabPanel value={value} index={1}>
          <AsteroidWatch />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <FlyTo />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={3}>
          <Learn />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={4}>
          <Info />
        </CustomTabPanel>
      </Box>
      <Box css={tabsStyle}>
        <Tab selected={false} onClick={handleOpenSettings}>
          {menuOpen ? <Close /> : <Settings />}
        </Tab>
        <Tab selected={value == 1} onClick={getWatch}>
          Watch
        </Tab>
        <Tab selected={value == 2} onClick={getFly}>
          Fly
        </Tab>
        <Tab selected={value == 3} onClick={getLearn}>
          Learn
        </Tab>
        <Tab selected={value == 4} onClick={getInfo}>
          Info
        </Tab>
      </Box>
    </Box>
  );
};

export default ControlsComponent;
