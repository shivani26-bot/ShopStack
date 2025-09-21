import HalfStar from "apps/user-ui/src/assets/svgs/half-star";
import StarFilled from "apps/user-ui/src/assets/svgs/star-filled";
import StarOutline from "apps/user-ui/src/assets/svgs/star-outline";
import React from "react";

type Props = {
  rating: number; // e.g., 4
};

// React.FC (or React.FunctionComponent) is a TypeScript type that defines a functional React component
// Here, Ratings is a function component.
// Props is the type of the props this component expects
const Ratings: React.FC<Props> = ({ rating }) => {
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(<StarFilled key={`star-${i}`} />);
    } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
      stars.push(<HalfStar key={`half-${i}`} />);
    } else {
      stars.push(<StarOutline key={`empty-${i}`} />);
    }
  }
  return <div className="flex gap-1">{stars}</div>;
};

export default Ratings;

// If i is less than or equal to rating, it’s filled.
// Example: rating = 3 → stars 1, 2, 3 are filled.
// Else, it’s outlined.
// Example: rating = 3 → stars 4 and 5 are outlined.
// key is required by React for list rendering.
