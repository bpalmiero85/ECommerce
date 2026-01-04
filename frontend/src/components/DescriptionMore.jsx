import "../styles/DescriptionMore.css";

export default function DescriptionMore({ text = "", quantity = 0, onMore }) {
  const safeText = typeof text === "string" ? text : String(text ?? "");
  const needsMore = safeText.trim().length > 65;
  const isSoldOut = Number(quantity) <= 0;

  const handleMore = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onMore?.(); // ✅ only runs on click
  };

  return (
    <div className={!isSoldOut ? "more-container" : "sold-out-more-container"}>
      <p className="description-paragraph clamp">{safeText}</p>

      {needsMore && !isSoldOut && (
        <button type="button" className="more-link" onClick={handleMore}>
          more
        </button>
      )}
    </div>
  );
}