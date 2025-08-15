import { useState } from "react";
import "../styles/DescriptionMore.css";
import "../styles/styles.css";

export default function DescriptionMore({
  text = "",
  quantity = 0,
}) {
  const needsMore = text.trim().length > 65;
  const [isOpen, setIsOpen] = useState(false);
  const isSoldOut = Number(quantity) <= 0;

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((v) => !v);
  };

  return (
    <>
      <div className={!isSoldOut ? "more-container" : "sold-out-more-container"}>
        <p className={`description-paragraph ${isOpen ? "open" : "clamp"}`}>
          {text}
        </p>
        {!isOpen && needsMore && !isSoldOut && (
          <button type="button" className="more-link" onClick={toggle}>more</button>
        )}
        {isOpen && needsMore && (
          <button type="button" className="less-link" onClick={toggle}>...less</button>
        )}
      </div>
    </>
  );
}
