import React, { useCallback, useState } from "react";
import {
  Backdrop,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select
} from "@material-ui/core";
import { Close } from "@material-ui/icons";
import { useMessaging } from "@footron/controls-client";

import {
  flyCategories,
  flyTargets,
  sortedFlyTargets,
  targetToId,
} from "./flytargets";
import StandardBottomUi from "./standardBottomUi";
import {
  definitionListStyle,
  fullSizeStyle,
  fullUIStyle,
  overlayMenuHeaderStyle,
  overlayMenuWrapperStyle,
  overlayStyle,
  thinWidgetStyle,
  topUI,
} from "./style";

interface DescriptionsProps {
  blurb: string[];
  more?: string[];
}

interface Content {
  title: string;
  data: { [key: string]: number };
  description?: DescriptionsProps;
  related?: string[];
  approach?: any;
  stats?: any;
  cards?: any;
}

interface DescriptionMessageProms {
  content?: Content;
  title: string;
}

const addUnit = (dataType: string, value: number) => {
  switch (dataType) {
    case "radius":
      return `${value} km`;
    case "volume":
      return `${value} km³`;
    case "density":
      return `${value} g/cm³`;
    default:
      return value;
  }
};

export default function FlyTo() {
  const emptyDescription: Content = {
    title: "None",
    related: [],
    description: { blurb: [], more: [] },
    data: {},
  };
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [targetInfoID, setTargetInfoID] = useState<string>("");
  const [preselectedTarget, setPreSelectedTarget] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandData, setExpandData] = useState(false);
  const [infoText, setInfoText] = useState<Content>(emptyDescription);
  const { sendMessage } = useMessaging((message: DescriptionMessageProms) => {
    console.log(message);
    if (message.title != null && message.content != null) {
      setTargetInfoID(message.title);
      setInfoText(message.content);
    }
  });

  const handleCategoryChange = (
    event: React.ChangeEvent<{ value: unknown }>
  ) => {
    const category = event.target.value as string;
    setSelectedCategory(category);
    setSelectedTarget(flyTargets[category][0]);
    setInfoText(emptyDescription);
  };
  const handleTargetChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedTarget(event.target.value as string);
    setInfoText(emptyDescription);
  };

  const getInfoText = useCallback(
    async (target: string) => {
      await sendMessage({ type: "fly", value: targetToId[target] });
    },
    [sendMessage]
  );

  const clickLink = (target: string) => {
    let targetObject = sortedFlyTargets[target];
    let category = "";
    switch (targetObject.type) {
      case "system":
        category = "Systems";
        break;
      case "planet":
        category = "Planets";
        break;
      case "asteroid":
        category = "Asteroids";
        break;
      case "comet":
        category = "Comets";
        break;
      case "spacecraft":
        category = "Spacecraft";
        break;
      default:
        console.error(`target ${target} not found`);
    }
    setPreSelectedTarget(target);
    setMenuOpen(false);
    setInfoText(emptyDescription);
    getInfoText(targetObject.name);
  };

  const handleClickAwaySettings = (event: globalThis.MouseEvent | globalThis.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
  };

  const ButtonList: React.FC<{ items: string[] }> = ({ items }) => {
    let filteredItems = items.filter((item) => sortedFlyTargets[item] != null);
    return (
      <div css={definitionListStyle}>
        {filteredItems.map((item, index) => (
          <Button
            key={"button" + item}
            onClick={() => clickLink(item)}
            variant="contained"
            color="primary"
          >
            {sortedFlyTargets[item].name}
          </Button>
        ))}
      </div>
    );
  };

  const DefinitionOverlay: React.FC<Content> = (content: Content) => {
    const dataEntries = content.data
      ? Object.entries(content.data).filter(
          (element) => element[0] !== "distance"
        )
      : [];
    const visibleEntries = expandData ? dataEntries : dataEntries.slice(0, 3);
    console.log(visibleEntries);
    return (
      <Box css={fullSizeStyle}>
        <Box css={overlayMenuHeaderStyle}>
          <Box> </Box>
          <h3>{content.title}</h3>
          <IconButton
            onClick={() => {
              setMenuOpen(false);
              setInfoText(emptyDescription);
            }}
          >
            <Close />
          </IconButton>
        </Box>
        {content.description?.blurb != null && (
          <Box>
            {content.description.blurb.map((item, index) => (
              <strong
                key={"blurb" + index}
                dangerouslySetInnerHTML={{ __html: item }}
              ></strong>
            ))}
          </Box>
        )}
        {content.data && (
          <Box>
            <br />
            <table>
              <tbody>
                {visibleEntries.map(([key, value]) => (
                  <tr key={key}>
                    <td css={{ textAlign: "right" }}>
                      <strong>{key}</strong>
                    </td>
                    <td>
                      {": \t"}
                      {addUnit(key, value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dataEntries.length > 3 && expandData == false && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setExpandData(true)}
                size="small"
              >
                Show more
              </Button>
            )}
          </Box>
        )}
        {content.description?.more != null && (
          <Box>
            {content.description.more.map((item, index) => (
              <p
                key={"blurb" + index}
                dangerouslySetInnerHTML={{ __html: item }}
              ></p>
            ))}
          </Box>
        )}
        {content.related && content.related.length > 0 && (
          <Box>
            <Divider />
            <h5>Related</h5>
            <ButtonList items={content.related} />
          </Box>
        )}
        <br />
      </Box>
    );
  };

  return (
    <Box css={fullUIStyle}>
      {menuOpen ? (
        <Backdrop open={true} css={overlayStyle}>
          <ClickAwayListener onClickAway={handleClickAwaySettings}>
            <Box css={overlayMenuWrapperStyle}>
              {infoText.title != "" && infoText.description && (
                <DefinitionOverlay
                  title={infoText.title}
                  description={infoText.description}
                  data={infoText.data}
                  related={infoText.related}
                />
              )}
            </Box>
          </ClickAwayListener>
        </Backdrop>
      ) : null}
      <Box css={topUI}>
        <h3>Fly to somewhere in space</h3>
        {preselectedTarget ? (
          <Box>
            <Box css={thinWidgetStyle}>
              <h3>
                Selected Target: {sortedFlyTargets[preselectedTarget].name}
              </h3>{" "}
            </Box>
            <Box css={thinWidgetStyle}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setPreSelectedTarget("")}
              >
                Choose a different target
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <FormControl fullWidth>
              <InputLabel id="make-label">Select Category</InputLabel>
              <Select value={selectedCategory} onChange={handleCategoryChange}>
                {flyCategories.map((category, index) => (
                  <MenuItem key={index} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!selectedCategory}>
              <InputLabel>Select Destination</InputLabel>
              <Select
                labelId="model-label"
                value={selectedTarget}
                onChange={handleTargetChange}
              >
                {selectedCategory &&
                  flyTargets[selectedCategory].map((target) => (
                    <MenuItem key={target} value={target}>
                      {target}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        )}
        <Box css={thinWidgetStyle}>
          {preselectedTarget == "" && selectedTarget && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => getInfoText(selectedTarget)}
            >
              Fly to Target
            </Button>
          )}
        </Box>
        {(infoText.title == selectedTarget ||
          (sortedFlyTargets[targetInfoID] &&
            sortedFlyTargets[targetInfoID].name == selectedTarget) ||
          (sortedFlyTargets[preselectedTarget] &&
            infoText.title == sortedFlyTargets[preselectedTarget].name)) && (
          <Box css={thinWidgetStyle}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setMenuOpen(true)}
            >
              About
            </Button>
          </Box>
        )}
      </Box>
      <StandardBottomUi />
    </Box>
  );
}
