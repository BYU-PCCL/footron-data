/** @jsxImportSource @emotion/react */
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@material-ui/core";
import React from "react";

const images = [
  "Peace",
  "Y logo",
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

type ImageSelectorProps = {
  onSelect: (choice: string) => Promise<void>;
};

const ImageSelector = ({ onSelect }: ImageSelectorProps): React.ReactNode => {
  const select = (event: any) => {
    const image = event.target.value;
    onSelect(image);
  };

  return (
    <div className="full-width vert-container hidable-children">
      <div className="slider-description centered">
        {"Change the displayed image"}
      </div>
      <FormControl>
        {/* I think I like the react select better. Check on mobile view */}
        {/* <NativeSelect
          defaultValue={"-"}
          inputProps={{
            name: 'image',
            id: 'uncontrolled-native',
          }}
          onChange={select}
        >
          {images.map((img) => (
            <option value={img}>{img}</option>
          ))}
          </NativeSelect> */}
        <InputLabel>Image</InputLabel>
        <Select onChange={select}>
          {images.map((img, index) => (
            <MenuItem value={img} key={index}>{img}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
};

export default ImageSelector;
