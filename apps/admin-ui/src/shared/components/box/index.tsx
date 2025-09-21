"use client"; //styled-components works on the client.

import styled from "styled-components";

// Defines the prop types for Box.
// css is optional (?).
// Type: React.CSSProperties → ensures that only valid CSS properties can be passed (like backgroundColor, padding, etc.).
interface BoxProps {
  css?: React.CSSProperties;
}

//attrs lets you attach attributes or props to a styled-component.
// Here, we take props.css and attach it as the style attribute.
// That means whatever you pass in css will become inline styles on the <div>.
// ex:
// <Box css={{ backgroundColor: "red", padding: "10px" }} />
// becomes:
// <div style="background-color:red; padding:10px; box-sizing:border-box"></div>
// default styles always applied to the Box.
// So every <Box> will always have box-sizing: border-box;.
const Box = styled.div.attrs<BoxProps>((props) => ({
  style: props.css, //apply css prop as inline styles
}))<BoxProps>`
  box-sizing: border-box;
`;

export default Box;
