const Product = (props) => {
  return (
     <div className="logo-card">
                <div className="logo-design">
                    <div className="gothic-crown">
                             <img
                  key={`pic-${props.id}-${props.pictureVersion || props.pictureType}`}
                    src={`http://localhost:8080/api/product/${props.id}/picture`}
                    className="product-image"
                    alt={props.name}
                  ></img>
                        <div className="crown-stars">
                            <div className="crown-star">✦</div>
                            <div className="crown-star">✧</div>
                            <div className="crown-star">✦</div>
                        </div>
                    </div>
                </div>
                <div className="logo-text">Goth & Glitter</div>
                <div className="logo-description">Gothic Crown with twinkling stars - Perfect for the royal figurine aesthetic with dark elegance and magical sparkles</div>
            </div>
            
  )
}
export default Product