import "../styles/HomePage.css"
import "../styles/ProductPage.css"

const Product = (props) => {
  return (
    <a className="product-anchor" href="/products">
      <div className="logo-card">
        <div className="logo-design">
          <div className="gothic-rose-container">
            <div className="gothic-rose">
              <img
                className="product-image"
                src={`http://localhost:8080/api/product/${props.id}/picture`}
              ></img>
            </div>
            <div className="rose-glitter-effect">
              <div className="glitter-particle">✨</div>
              <div className="glitter-particle">✦</div>
              <div className="glitter-particle">✧</div>
              <div className="glitter-particle">✨</div>
            </div>
          </div>
        </div>
        <div className="logo-text">{props.name}</div>
        <div className="logo-description2">{props.description}</div>{" "}
        <p className="click">-- click --</p>
      </div>
    </a>
  );
};

export default Product;
