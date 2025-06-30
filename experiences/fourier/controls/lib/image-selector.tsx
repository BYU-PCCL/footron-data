/** @jsxImportSource @emotion/react */
import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
import { useMessaging } from "@footron/controls-client";

const images = [
  "Peace",
  "Y logo",
  "Infinity",
  "Sailor",
  "Moore curve",
  "Po",
  "Fourier",
  "Fouriest",
  "Rick",
  "Line",
  "Triangle",
  "Square",
  "Pentagon",
  "Hexagon",
];

const ImageSelector = (): JSX.Element => {
  const [selectedImage, setSelectedImage] = React.useState("");

  const { sendMessage } = useMessaging()
  
  const select = (event: any) => {
    const image = event.target.value;
    setSelectedImage(image);
    sendMessage({ type: "setImage", value: image });
  };

  return (
    <div className="full-width vert-container hidable-children">
      <div className="slider-description centered">
        {"Change the displayed image"}
      </div>
      <FormControl>
        <InputLabel>Image</InputLabel>
        <Select value={selectedImage} onChange={select}>
          {images.map((img) => (
            <MenuItem value={img} key={img}>
              {img}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default ImageSelector;
