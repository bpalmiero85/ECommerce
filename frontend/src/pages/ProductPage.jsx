import { useEffect } from "react";
import "../styles/ProductPage.css"


const addLogoEffects = () => {
  
  // Click effect for logo-design
  document.querySelectorAll('.logo-design').forEach(logo => {
    logo.addEventListener('click', function () {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  });
  

  // Add extra sparkle effects on hover
  document.querySelectorAll('.logo-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
      const sparkles = ['✨', '⭐', '✦', '✧'];
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const sparkle = document.createElement('div');
          sparkle.innerHTML = sparkles[Math.floor(Math.random() * sparkles.length)];
          Object.assign(sparkle.style, {
            position: 'absolute',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            pointerEvents: 'none',
            animation: 'sparkle 1s ease-out forwards',
          });
          this.appendChild(sparkle);
          setTimeout(() => sparkle.remove(), 1000);
        }, i * 100);
      }
    });
  });
  
};



const ProductPage = (product) => {
    useEffect(() => {
    addLogoEffects();
  }, []);
  
  return(
    
    <>
    <div className="product-body">
    <div className="container">
        <h1 className="product-page-header">✨ Goth & Glitter Animated Logos ✨</h1>
        
        <div className="logo-grid">
           
            <div className="logo-card">
                <div className="logo-design">
                    <div className="gothic-crown">
                        👑
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
            
           
            <div className="logo-card">
                <div className="logo-design">
                    <div className="moon-stars-combo">
                        <div className="crescent-moon">🌙</div>
                        <div className="floating-stars">
                            <div className="floating-star">⭐</div>
                            <div className="floating-star">✨</div>
                            <div className="floating-star">⭐</div>
                        </div>
                    </div>
                </div>
                <div className="logo-text">Goth & Glitter</div>
                <div className="logo-description">Floating crescent moon with orbiting animated stars - Mystical and enchanting, perfect for the gothic magical aesthetic</div>
            </div>
            
            
            <div className="logo-card">
                <div className="logo-design">
                    <div className="magic-wand-container">
                        <div className="magic-wand">🪄</div>
                        <div className="wand-sparkles">
                            <div className="wand-sparkle">✨</div>
                            <div className="wand-sparkle">⭐</div>
                            <div className="wand-sparkle">✦</div>
                            <div className="wand-sparkle">✧</div>
                            <div className="wand-sparkle">✨</div>
                        </div>
                    </div>
                </div>
                <div className="logo-text">Goth & Glitter</div>
                <div className="logo-description">Glowing magic wand with cascading animated sparkles - Represents the magical 3D printing process and whimsical creation</div>
            </div>
            
          
            <div className="logo-card">
                <div className="logo-design">
                    <div className="winged-skull-container">
                        <div className="skull-wings wing-left">🦋</div>
                        <div className="skull-main">💀</div>
                        <div className="skull-wings wing-right">🦋</div>
                        <div className="skull-aura">
                            <div className="aura-particle"></div>
                            <div className="aura-particle"></div>
                            <div className="aura-particle"></div>
                            <div className="aura-particle"></div>
                        </div>
                    </div>
                </div>
                <div className="logo-text">Goth & Glitter</div>
                <div className="logo-description">Adorable skull with animated butterfly wings and mystical aura - Perfect balance of cute and gothic with magical elements</div>
            </div>
            
           
            <div className="logo-card">
                <div className="logo-design">
                    <div className="gothic-rose-container">
                        <div className="gothic-rose">
                        

<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="45" 
          fill="none" 
          stroke="#8B5CF6" 
          stroke-width="7"/>
  <polygon points="50,85 61.8,54.6 88.2,54.6 68.2,37.7 76.4,11.2 50,25.4 23.6,11.2 31.8,37.7 11.8,54.6 38.2,54.6" 
           fill="#8B5CF6" 
           stroke="#7C3AED" 
           stroke-width="4"/>
</svg>                        </div>
                        <div className="rose-glitter-effect">
                            <div className="glitter-particle">✨</div>
                            <div className="glitter-particle">✦</div>
                            <div className="glitter-particle">✧</div>
                            <div className="glitter-particle">✨</div>
                        </div>
                    </div>
                </div>
                <div className="logo-text">Goth & Glitter</div>
                <div className="logo-description">Dark rose with falling glitter particles - Romantic gothic aesthetic with continuous sparkling animation</div>
            </div>
        <a className="product-anchor" href="/products">
              <div className="logo-card">
              
                <div className="logo-design">
               
                    <div className="gothic-rose-container">
                   
                        <div className="gothic-rose">
                          <img className="product-image" src="/demonica.jpg"></img>
                        </div>
                        <div className="rose-glitter-effect">
                            <div className="glitter-particle">✨</div>
                            <div className="glitter-particle">✦</div>
                            <div className="glitter-particle">✧</div>
                            <div className="glitter-particle">✨</div>
                        </div>
                      
                    </div>
                      
                 
                </div>
                
                <div className="logo-text">Figurines</div>
                <div className="logo-description2">Cute but dark figurines, sure to adore with gore.</div>
                <p className="click">-- click --</p>
            </div>
               </a>
        </div>
    </div>
    </div>
    
    </>
  )
};



export default ProductPage;