// import React, { forwardRef } from "react";

// // ? means optional
// // Base props shared between inputs and textarea
// interface BaseProps {
//   label?: string;
//   type?: "text" | "number" | "password" | "email" | "textarea";
//   className?: string; //lets you pass custom Tailwind classes.
// }

// // Define props separately for <input> and <textarea></textarea>
// // merges your BaseProps with native HTML props for <input> or <textarea>.Example: placeholder, onChange, value etc. will automatically be typed correctly.
// type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
// type TextareaProps = BaseProps &
//   React.TextareaHTMLAttributes<HTMLTextAreaElement>;
// type Props = InputProps | TextareaProps; //component can accept either input props or textarea props

// // forwardRef is a React higher-order function that lets you pass a ref from a parent component down to a child component.
// // Normally, refs only work with DOM elements (like <input />, <div />) or class components. If you try to attach a ref directly to a functional component, it doesn’t work because function components don’t have instances.
// // forwardRef solves this by allowing your functional component to “forward” the ref to a child DOM node or component
// // without forwardRef:
// // function MyInput(props) {
// //   return <input {...props} />;
// // }
// // function Parent() {
// //   const inputRef = React.useRef();

// //   return <MyInput ref={inputRef} />; // ❌ Error: functional components can’t take refs directly
// // }

// // with forwardRef:
// // const MyInput = forwardRef((props, ref) => {
// //   return <input {...props} ref={ref} />;
// // });

// // function Parent() {
// //   const inputRef = useRef(null);

// //   function focusInput() {
// //     inputRef.current?.focus();
// //   }
// //   return (
// //     <div>
// //       <MyInput ref={inputRef} placeholder="Type here..." />
// //       <button onClick={focusInput}>Focus Input</button>
// //     </div>
// //   );
// // }
// // Why/When Use forwardRef?
// // Reusable components → e.g. custom Input, Button, Modal, etc. where parent needs access to the DOM node.
// // Ref is typed as either HTMLInputElement or HTMLTextAreaElement.Default type is "text".
// // forwardRef makes it possible for a parent to attach a ref to this component (so you can focus(), etc).
// const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
//   ({ label, type = "text", className, ...props }, ref) => {
//     return (
//       <div className="w-full">
//         {label && (
//           <label className="block font-semibold text-gray-300 mb-1">
//             {label}
//           </label>
//         )}
//         {/* Both spread {...props} so you can pass placeholder, onChange, etc. Casting with as ensures TypeScript knows which props belong where.*/}
//         {type === "textarea" ? (
//           <textarea
//             ref={ref as React.Ref<HTMLTextAreaElement>}
//             className={`w-full border outline-none border-gray-700 p-2 rounded-md text-white bg-transparent ${className}`}
//             {...(props as TextareaProps)}
//           />
//         ) : (
//           <input
//             ref={ref as React.Ref<HTMLInputElement>}
//             className={`w-full border outline-none border-gray-700 bg-transparent  p-2 rounded-md text-white ${className}`}
//             {...(props as InputProps)}
//           />
//         )}
//       </div>
//     );
//   }
// );

// Input.displayName = "Input"; //Helps React DevTools show a proper component name instead of ForwardRef.
// export default Input;

import React, { forwardRef } from "react";

interface BaseProps {
  label?: string;
  type?: "text" | "number" | "password" | "email" | "textarea";
  className?: string;
  integerOnly?: boolean; // New prop to enforce integer input
}

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = BaseProps &
  React.TextareaHTMLAttributes<HTMLTextAreaElement>;
type Props = InputProps | TextareaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ label, type = "text", className, integerOnly = false, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (integerOnly && type === "number") {
        //         ctrlKey for Windows/Linux
        // metaKey for Mac (Cmd key)
        const { key, ctrlKey, metaKey, shiftKey } = e;

        // Cross-platform modifier key (Ctrl on Windows/Linux, Cmd on Mac)
        const isModifierPressed = ctrlKey || metaKey;

        // Allow special navigation and editing keys
        const allowedKeys = [
          "Backspace",
          "Delete",
          "Tab",
          "Escape",
          "Enter",
          "Home",
          "End",
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
        ];

        // Allow keyboard shortcuts (cross-platform)
        const allowedShortcuts = ["a", "c", "v", "x", "z", "y"]; // Select All, Copy, Paste, Cut, Undo, Redo

        // Allow if it's a special key
        if (allowedKeys.includes(key)) {
          return;
        }

        // Allow if it's a keyboard shortcut with modifier
        if (isModifierPressed && allowedShortcuts.includes(key.toLowerCase())) {
          return;
        }

        // Allow numeric keys (0-9) without shift
        if (/^[0-9]$/.test(key) && !shiftKey) {
          return;
        }

        // Block everything else
        e.preventDefault();
      }

      // Call original onKeyDown if provided
      if ("onKeyDown" in props && props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    // Handler to clean input on paste
    // Triggers when: User pastes content (Ctrl+V / Cmd+V or right-click → Paste)
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (integerOnly && type === "number") {
        const paste = e.clipboardData.getData("text");
        //validate the content:check if the pasted text contains ONLY digits
        if (!/^\d+$/.test(paste)) {
          e.preventDefault(); // If paste contains letters, symbols, or spaces, e.preventDefault() stops it
        }
      }
      //       Paste "123" → Allowed (only digits)
      // ❌ Paste "12a" → Blocked (contains letter)
      // ❌ Paste "12.5" → Blocked (contains decimal)
      // ❌ Paste "1 2 3" → Blocked (contains spaces)

      // Call original onPaste if provided
      if ("onPaste" in props && props.onPaste) {
        props.onPaste(e);
      }
    };

    // Handler to filter input
    // Triggers when: Input value changes (after typing, pasting, or any modification)
    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      if (integerOnly && type === "number") {
        const target = e.target as HTMLInputElement;
        target.value = target.value.replace(/[^0-9]/g, "");
        //          removes anything that's NOT a digit
        // [^0-9] = any character that's NOT 0-9
        // g = global flag (replace all occurrences)
        // Updates field immediately: Directly modifies target.value
      }
      //       Input has "12a3" → Becomes "123"
      // Input has "1.5" → Becomes "15"
      // Input has "abc123def" → Becomes "123"

      // Call original onInput if provided
      if ("onInput" in props && props.onInput) {
        props.onInput(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block font-semibold text-gray-300 mb-1">
            {label}
          </label>
        )}
        {type === "textarea" ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={`w-full border outline-none border-gray-700 p-2 rounded-md text-white bg-transparent ${className}`}
            {...(props as TextareaProps)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            className={`w-full border outline-none border-gray-700 bg-transparent p-2 rounded-md text-white ${className}`}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onInput={handleInput}
            {...(props as InputProps)}
          />
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
