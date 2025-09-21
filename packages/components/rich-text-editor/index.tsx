// // Fix 2: Use dynamic Import in Next.js
"use client";

// error happens because Quill (and therefore react-quill-new) tries to access document at build/SSR time, but in Next.js, the server doesn’t have document or window.
//Next.js–safe, drop-in RichTextEditor built on react-quill-new, with dynamic import (no SSR crashes), duplicate-toolbar cleanup, and a compact height.
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// Load react-quill-new only on the client
const ReactQuill = dynamic(
  () =>
    import("react-quill-new").then((mod: any) => mod.ReactQuill ?? mod.default),
  { ssr: false }
);

type Props = {
  value: string;
  onChange: (content: string) => void;
  className?: string;
  minHeight?: number; // customize editor height if you want
};

const RichTextEditor: React.FC<Props> = ({
  value,
  onChange,
  className = "",
  minHeight = 160, // compact by default
}) => {
  const [editorValue, setEditorValue] = useState<string>(value ?? "");
  const didInitRef = useRef(false);

  // Keep internal state in sync if parent updates `value`
  useEffect(() => {
    setEditorValue(value ?? "");
  }, [value]);

  // Remove duplicate toolbars if multiple instances mount
  useEffect(() => {
    if (typeof document === "undefined" || didInitRef.current) return;
    didInitRef.current = true;

    // Defer so Quill can mount first
    const id = window.setTimeout(() => {
      const toolbars = document.querySelectorAll(".ql-toolbar");
      toolbars.forEach((toolbar, idx) => {
        if (idx > 0) toolbar.remove();
      });
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ font: [] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ size: ["small", false, "large", "huge"] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ script: "sub" }, { script: "super" }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className={`relative ${className}`}>
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={(content: string) => {
          setEditorValue(content);
          onChange(content);
        }}
        modules={modules}
        placeholder="Write a detailed product description here..."
        className="bg-transparent border border-gray-700 text-white rounded-md"
        style={{ minHeight }}
      />
      <style>{`
        .ql-toolbar {
          background: transparent;
          border-color: #444;
        }
        .ql-container {
          background: transparent !important;
          border-color: #444;
          color: white;
        }
        .ql-picker, .ql-stroke {
          color: white !important;
          stroke: white !important;
        }
        .ql-editor {
          min-height: ${minHeight - 20}px; /* keep content area compact */
        }

.ql-editor.ql-blank::before {
  color: #888; /* placeholder color */
}
      `}</style>
    </div>
  );
};

export default RichTextEditor;

// "use client";
// import ReactQuill from "react-quill-new";
// import { useEffect, useMemo, useRef, useState } from "react";
// import "react-quill-new/dist/quill.snow.css";

// const RichTextEditor = ({
//   value,
//   onChange,
// }: {
//   value: string;
//   onChange: (content: string) => void;
// }) => {
//   const [editorValue, setEditorValue] = useState(value || "");
//   const quillRef = useRef(false);
//   // document.querySelectorAll(...) while rendering on the server (Next.js / SSR). On the server, document doesn’t exist.
//   // Fix 1: Check for window or document
//   // Wrap your DOM code in a safe check
//   useEffect(() => {
//     if (typeof document !== "undefined" && !quillRef.current) {
//       quillRef.current = true;
//       setTimeout(() => {
//         document.querySelectorAll(".ql-toolbar").forEach((toolbar, index) => {
//           if (index > 0) toolbar.remove();
//         });
//       }, 100);
//     }
//   }, []);

//   return (
//     <div className="relative">
//       {" "}
//       <ReactQuill
//         theme="snow"
//         value={editorValue}
//         onChange={(content) => {
//           setEditorValue(content);
//           onChange(content);
//         }}
//         modules={useMemo(
//           () => ({
//             toolbar: [
//               [{ font: [] }], //font picker
//               [{ header: [1, 2, 3, 4, 5, 6, false] }],
//               [{ size: ["small", false, "large", "huge"] }], //font sizes
//               ["bold", "italic", "underline", "strike"], //basic text styling
//               [{ color: [] }, { background: [] }], //font and background colors
//               [{ script: "sub" }, { script: "super" }], //subscript/superscript
//               [{ list: "ordered" }, { list: "bullet" }], //lists
//               [{ indent: "-1" }, { indent: "+1" }], //indentation
//               [{ align: [] }], //text alignment
//               ["blockquote", "code-block"], //blockquote and code block
//               ["link", "image", "video"], //insert link, image, video
//               ["clean"], //remove formatting
//             ],
//           }),
//           []
//         )}
//         placeholder="Write a detailed product description here ..."
//         className="bg-transparent border border-gray-700 text-white rounded-md"
//         style={{ minHeight: "250px" }}
//       />{" "}
//       <style>{`
//       .ql-toolbar {
//         background: transparent;
//         border-color: #444;
//       }
//       .ql-container {
//         background: transparent !important;
//         border-color: #444;
//         color: white;
//       }
//       .ql-picker, .ql-stroke {
//           color: white !important;
//           stroke: white !important;
//         }
//       .ql-editor {
//   color: white; /* text color */
//   min-height: 150px;
// }

// .ql-editor.ql-blank::before {
//   color: #888; /* placeholder color */
// }

//     `}</style>
//     </div>
//   );
// };

// export default RichTextEditor;
