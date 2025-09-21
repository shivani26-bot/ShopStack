import TitleBorder from "apps/user-ui/src/assets/svgs/title-border";
import React from "react";

const SectionTitle = ({ title }: { title: string }) => {
  return (
    <div className="relative">
      <h1 className="md:text-3xl text-xl relative z-10 font-semibold">
        {title}
      </h1>
      <TitleBorder className="absolute left-0 top-[95%] " />
    </div>
  );
};

export default SectionTitle;
// className="absolute top-1/2 left-0 right-0 text-white"
