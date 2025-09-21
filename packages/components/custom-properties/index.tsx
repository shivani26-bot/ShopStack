import React, { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import Input from "../input";
import { Plus, X } from "lucide-react";

// functional React component called CustomProperties.accepts props: (control:(React Hook Form’s controller). and errors:contains validation errors) from reach hook form
// : any → TypeScript typing that says “I don’t care about the type, accept anything”.
const CustomProperties = ({ control, errors }: any) => {
  // properties is an array of objects.
  //   Each object has two fields:
  // label: string → the name of the property (e.g., "Color").
  // values: string[] → a list of values for that property (e.g., ["Red", "Blue"]).
  const [properties, setProperties] = useState<
    {
      label: string;
      values: string[];
    }[]
  >([]);

  // for tracking the label the user is typing when adding a new property.Example: if a user types "Material" in an input box, newLabel will temporarily store that string.
  const [newLabel, setNewLabel] = useState("");
  //   Same as above, but for the value of a property the user is typing.
  // Example: if the property is "Color", this could hold "Green" before being added to the values array.
  // const [newValue, setNewValue] = useState("");
  // Instead of one newValue, you should store an array of input values (one per property index).
  const [newValue, setNewValue] = useState<string[]>([]);
  return (
    <div>
      <div className="flex flex-col gap-3">
        {/* Controller comes from React Hook Form.
It’s used when you want to hook up a custom or complex component (not just a simple <input />) to React Hook Form’s state.
name="custom-properties" → tells RHF: “store the data of this field under the key custom-properties in the form state”.
control={control} → passes in the control object from useForm(), so this field is connected to RHF.
render={({ field }) => { ... }} → RHF gives you a field object with properties like:
field.value (the current value)
field.onChange (a function to update the value in RHF)
field.onBlur, etc. */}
        {/* Controller links properties state with React Hook Form.
useEffect ensures form data stays synced.
addProperty → add a new property with empty values.
addValue → add a value to a specific property.
removeProperty → remove a property entirely. */}
        <Controller
          name="custom-properties"
          control={control}
          render={({ field }) => {
            // Whenever your local state properties changes, this effect calls field.onChange(properties).
            // That way, the React Hook Form value for "custom-properties" is always kept in sync with your custom state.
            // Example: if you add a property like { label: "Color", values: ["Red"] }, it immediately updates the form state too.
            useEffect(() => {
              field.onChange(properties);
            }, [properties]);

            // Creates a new property (like "Size") and adds it to the properties state.
            // !newLabel.trim() → prevents adding if the label is empty.
            // setProperties([...properties, { label: newLabel, values: [] }]) → spreads the existing properties and appends a new object with:
            // label: newLabel
            // values: [] (empty initially)
            // setNewLabel("") → clears the input field for the next property.
            const addProperty = () => {
              if (!newLabel.trim()) return;
              setProperties([...properties, { label: newLabel, values: [] }]);
              setNewLabel("");
            };

            //index → which property you’re adding a value to (e.g., Color at index 0).
            // !newValue.trim() → ignore empty values.
            // const updatedProperties = [...properties]; → make a shallow copy (important for immutability).
            // updatedProperties[index].values.push(newValue); → add the new value to the correct property’s values array.
            // setProperties(updatedProperties); → update state with the modified list.
            // setNewValue("") → clear the input box for values.
            // Example: if properties = [{ label: "Color", values: [] }] and you call addValue(0) with "Red", it becomes:[{ label: "Color", values: ["Red"] }]

            // const addValue = (index: number) => {
            //   if (!newValue.trim()) return;
            //   const updatedProperties = [...properties];
            //   updatedProperties[index].values.push(newValue);
            //   setProperties(updatedProperties);
            //   setNewValue("");
            // };

            const addValue = (index: number) => {
              const value = newValue[index]?.trim();
              if (!value) return;
              const updatedProperties = [...properties];
              updatedProperties[index].values.push(value);
              setProperties(updatedProperties);
              // clear only this input field
              const updatedNewValues = [...newValue];
              updatedNewValues[index] = "";
              setNewValue(updatedNewValues);
            };
            const removeProperty = (index: number) => {
              // keep all properties except the one at index
              setProperties(properties.filter((_, i) => i !== index));
            };
            return (
              <div className="mt-2">
                <label className="block font-semibold text-gray-300 mb-1">
                  Custom Properties
                </label>
                <div className="flex flex-col gap-3">
                  {properties.map((property, index) => (
                    <div
                      key={index}
                      className="border border-gray-700 p-3 rounded-lg bg-gray-900"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">
                          {property.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProperty(index)}
                        >
                          <X size={18} className="text-red-500" />
                        </button>
                      </div>

                      {/* add values to property  */}
                      <div className="flex items-center mt-2 gap-2">
                        <input
                          type="text"
                          className="border outline-none border-gray-700 bg-gray-800 rounded-md text-white w-full"
                          placeholder="Enter value..."
                          // value={newValue}
                          // onChange={(e) => setNewValue(e.target.value)}
                          value={newValue[index] || ""} // keep it specific to this property,newValues[index] → each input manages its own value inside the array.
                          onChange={(e) => {
                            const updated = [...newValue];
                            updated[index] = e.target.value;
                            setNewValue(updated);
                          }}
                        />
                        <button
                          type="button"
                          className="px-3 py-1 bg-blue-500 text-white rounded-md"
                          onClick={() => addValue(index)}
                        >
                          Add
                        </button>
                      </div>
                      {/* show values  */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {property.values.map((value, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-700 text-white rounded-md"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {/* add new property  */}
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      placeholder="Enter property label (e.g.,Material,Warranty)"
                      value={newLabel}
                      onChange={(e: any) => setNewLabel(e.target.value)}
                    />
                    <button
                      type="button"
                      className="px-3 py-2 bg-blue-500 rounded-md flex items-center"
                      onClick={addProperty}
                    >
                      <Plus size={16} />
                      Add
                    </button>
                  </div>
                </div>
                {errors["custom-properties"] && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors["custom-properties"].message as string}
                  </p>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default CustomProperties;

// What Controller actually does
// Normally in React Hook Form, you just do:
// <input {...register("email")} />
// and RHF wires the input automatically.

// But in complex cases (custom components, stateful logic, controlled inputs), RHF can’t just “spread props”.
// That’s where Controller comes in.
// Controller acts like a wrapper around your component.
// You give it:
// name → the form field’s key.
// control → the form’s control object (from useForm).
// render → a function that returns your JSX.
// 🔹 The render function
// Inside render, RHF gives you a special object:
// render={({ field, fieldState, formState }) => JSX }
// field has the methods & values to connect your component to RHF:
// field.value → current form value for this input
// field.onChange(newValue) → update RHF state
// field.onBlur() → tell RHF the input was touched
// field.ref → reference to the input (for focus, etc.)
// You then use those to build any JSX you want.
