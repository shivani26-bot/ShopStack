import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller } from "react-hook-form";

const defaultColors = [
  "#000000", //black
  "#ffffff", //white
  "#ff00ff", //magenta
  "#F87171", // red-400
  "#60A5FA", // blue-400
  "#FACC15", // yellow-400
  "#4ADE80", // green-400
  "#22D3EE", // cyan-400
];

// const defaultColors = [
//   "#000000", //black
//   "#ffffff", //white
//   "#ff00ff", //magenta
//   "#FF0000", //red
//   "#00FF00", //green
//   "#0000FF", //blue
//   "#FFFF00", //yelow
//   "#00FFFF", //cyan
// ];

const ColorSelector = ({ control, errors }: any) => {
  // array of string, each string will represent a color.Initial value = empty array [].
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [showColorPicker, setShowColorPicker] = useState(false); //controls visibility of a color picker UI.
  const [newColor, setNewColor] = useState("#ffffff"); //Holds the currently selected color from the color picker.Default = "#ffffff" (white).
  return (
    <div className="mt-2">
      <label className="block font-semibold text-gray-300 mb-1"> Colors</label>
      <Controller
        name="colors" //name="colors" → the form field will be stored under "colors" in form state.
        control={control} //control={control} → links this field to the useForm instance.
        render={({ field }) => (
          // React Hook Form passes an object field containing:
          // value → current value of this form field (colors array).
          // onChange → function to update the value.
          // Other handlers like onBlur, etc.
          <div className="flex gap-3 flex-wrap">
            {/* Combines two arrays:
defaultColors → predefined set (like ["#000000", "#ffffff"]).
customColors → user-added colors. */}
            {[...defaultColors, ...customColors].map((color) => {
              // Checks whether the current color is already selected by the user.
              // field.value should be an array of selected colors (e.g., ["#ff0000", "#00ff00"]).
              const isSelected = (field.value || []).includes(color);
              // Special case styling for very light colors (white and yellow).
              // These would otherwise be hard to see on the background, so an extra border class is applied.
              const isLightColor = ["#ffffff", "#ffff00"].includes(color);
              return (
                <button
                  type="button"
                  key={color} //React needs a unique key for lists.
                  onClick={() =>
                    // Handles selecting/deselecting this color:If isSelected, remove it Else, add it
                    // field.onChange updates form state.
                    field.onChange(
                      isSelected
                        ? field.value.filter((c: string) => c !== color)
                        : [...(field.value || []), color]
                    )
                  }
                  className={`w-7 h-7 p-2 rounded-md my-1 flex items-center justify-center border-2 transition ${
                    isSelected ? "scale-110 border-white" : "border-transparent"
                  } ${isLightColor ? "border-gray-600" : ""}`}
                  style={{ backgroundColor: color }}
                />
              );
            })}
            {/* add new color  */}
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-500 bg-gray-800 hover:bg-gray-700 transition"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <Plus size={16} />
            </button>

            {/* color picker  */}
            {showColorPicker && (
              <div className="relative flex items-center gap-2">
                <input
                  type="color" //Shows a small color box; when clicked, opens the browser’s color picker dialog.
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-10 p-0 border-none cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomColors([...customColors, newColor]);
                    setShowColorPicker(false);
                  }}
                  className="px-3 py-1 bg-gray-700 text-white rounded-md text-sm"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default ColorSelector;
