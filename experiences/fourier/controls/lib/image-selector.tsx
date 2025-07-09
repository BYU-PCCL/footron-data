import { FormControl, InputLabel, MenuItem, Select } from "@material-ui/core";
import { ChangeEvent, useState } from "react";
import HelpText from "./help-text";

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

type ImageSelectorProps = {
  sendMessage: (message: any) => void;
};

const ImageSelector = ({ sendMessage }: ImageSelectorProps): JSX.Element => {
  const [selectedImage, setSelectedImage] = useState("");

  const select = (
    event: ChangeEvent<{
      name?: string | undefined;
      value: unknown;
    }>
  ) => {
    let image = event.target.value;
    let stringImage = images.find((value) => value == image);
    if (stringImage == undefined) stringImage = "";
    setSelectedImage(stringImage);
    sendMessage({ type: "setImage", value: stringImage });
  };

  return (
    <>
      <HelpText
        initialHelp="Change the image"
        subsequentHelp=""
        helpUsed={selectedImage != ""}
      />
      <FormControl fullWidth={true}>
        <InputLabel>Image</InputLabel>
        <Select value={selectedImage} onChange={select}>
          {images.map((img) => (
            <MenuItem value={img} key={img}>
              {img}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );
};

export default ImageSelector;
