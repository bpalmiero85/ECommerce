import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import "../styles/AdminPage.css";

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

const getCroppedImg = async (imageSrc, crop) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.arc(crop.width / 2, crop.height / 2, crop.width / 2, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/png");
  });
};

const ProductPicture = ({
  onUpload,
  isPictureUploaded,
  productId,
  setIsPictureUploaded,
  setCroppingStatus,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [pictureVersion, setPictureVersion] = useState(Date.now());
  const [product, setProduct] = useState(null);


  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
      const response = await fetch(
        `http://localhost:8080/api/products/${productId}`, {
          method: "GET",
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const product = await response.json();
      setProduct(product);
    } catch (e) {
      console.error("Failed to load product", e);
    }
    };
    fetchProducts();
  }, [productId]);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setIsCropping(true);
      setCroppingStatus(true);
    } else {
      console.error("No file selected");
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropAndUpload = useCallback(
    async (productId) => {
      if (!selectedFile || !product) {
        console.error("No file selected or product not loaded");
        return;
      }

      try {
        const croppedImage = await getCroppedImg(
          URL.createObjectURL(selectedFile),
          croppedAreaPixels
        );

        const formData = new FormData();
        formData.append("file", croppedImage);
        formData.append("name", product.name);

        const response = await fetch(
          `http://localhost:8080/api/products/${productId}/uploadPicture`,
          {
            method: "POST",
            body: formData,
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Product picture uploaded successfully", data);

        setProduct(data);
        setPictureVersion(data.pictureVersion || Date.now());
        setIsPictureUploaded(true);
        onUpload();
        setIsCropping(false);
        setCroppingStatus(false);
      } catch (e) {
        console.error("Error cropping or uploading image:", e);
      }
    },
    [croppedAreaPixels, selectedFile, product, onUpload, setCroppingStatus]
  );

  return (
    <div className="product-picture-container">
      {product ? (
        <>
          {isCropping ? (
            <>
              <div className="crop-container">
                <Cropper
                  image={URL.createObjectURL(selectedFile)}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              {isCropping && (
                <div className="crop-button-container">
                  <button onClick={() => handleCropAndUpload(productId)} className="crop-button">
                    Crop & Save
                  </button>
                </div>
              )}
            </>
          ) : product?.productPicture ? (
            <div className="product-picture">
              <img
                src={`http://localhost:8080/api/products/${productId}/${product.productPicture}?version=${pictureVersion}`}
                alt="Product Picture"
                className="current-product-picture"
              />
            </div>
          ) : (
           ""
          )}

          <input
            type="file"
            accept="image/*, .png, .jpeg, .jpg"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: "none" }}
          />

          {product?.productPicture && !isCropping && (
            <div className="update-pic-container">
              <button onClick={handleFileSelect} className="update-pic-button">
                Update Product Picture
              </button>
            </div>
          )}
        </>
      ) : (
        <p>Loading product...</p>
      )}
    </div>
  );
};

export default ProductPicture;
