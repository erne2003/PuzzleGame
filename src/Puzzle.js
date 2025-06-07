import React from "react";
import "./Puzzle.css"; // adjust path as needed
import { useState } from "react";


function Puzzle() {
  const [image, setImage] = useState(null);

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
  }
  return (
    <div className="puzzle">
  
    <div className="puzzle-container">
<input className="Input-Button" type="file" accept="image/*" onChange={handleUpload}/>
      {image && <img src ={image} alt="Uploaded" className="uploaded-image" style={{maxWidth:'100%'}} />}

    </div>
     
    </div>

  );
}
export default Puzzle;