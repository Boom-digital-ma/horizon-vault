"use client";

import { useEffect, useState } from "react";

interface Slide {
  id: number;
  title: string;
  quote: string;
  image: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Le Sanctuaire Millénaire",
    quote: "« Un royaume vert suspendu entre la terre et le ciel, où le temps a cessé de s'écouler. »",
    image: "/images/img1.jpeg",
  },
  {
    id: 2,
    title: "Le Refuge Absolu",
    quote: "« Une architecture qui s'efface avec respect devant l'immensité de la forêt. »",
    image: "/images/img2.jpeg",
  },
  {
    id: 3,
    title: "L'Espace sans Compromis",
    quote: "« L'expérience d'une déconnexion radicale face aux crêtes du Rif. »",
    image: "/images/img3.jpeg",
  },
  {
    id: 4,
    title: "L'Oasis des Sens",
    quote: "« Un espace de sérénité et de vitalité au rythme du miroir d'eau. »",
    image: "/images/img4.jpeg",
  },
];

export default function Carousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-container">

      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`carousel-slide ${idx === currentSlide ? "active" : ""}`}
          style={{ backgroundImage: `url('${slide.image}')` }}
        >
          <div className="slide-content">
            <h2>{slide.title}</h2>
            <p>{slide.quote}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
