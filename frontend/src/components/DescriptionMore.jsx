import "../styles/DescriptionMore.css";
import { useRef, useState, useEffect } from "react"; 
export default function DescriptionMore({ text = "", quantity = 0, onMore }) {
  const safeText = typeof text === "string" ? text : String(text ?? "");
  const isSoldOut = Number(quantity) <= 0;

  const pRef = useRef(null);
  const [needsMore, setNeedsMore] = useState(false);

  useEffect(() => {
    const el = pRef.current;
    if (!el) return;

    const hasOverflow = el.scrollHeight > el.clientHeight;
    setNeedsMore(hasOverflow);
  }, [safeText]);

  const handleMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onMore?.(); 
  };

  return (
    <div className={!isSoldOut ? "more-container" : "sold-out-more-container"}>
      <p ref={pRef} className="description-paragraph clamp">{safeText}</p>

      {needsMore && !isSoldOut && (
        <button type="button" className="more-link" onClick={handleMore}>
          see more
        </button>
      )}
    </div>
  );
}