import React, { useState } from "react";
import styles from "../Styles/Navbar.module.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoverTimeout, setHoverTimeout] = useState(null);

  const categories = {
    men: {
      name: "MEN",
      items: [
        {
          name: "T-Shirts",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Casual Shirts",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Formal Shirts",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Polo Tops",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Jeans",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Trousers",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Shorts",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Blazers",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Suits",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Jackets",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Hoodies",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Sweaters",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Activewear",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Underwear",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Accessories",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
      ],
      slides: [
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "Summer Collection",
        },
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "New Arrivals",
        },
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "Best Sellers",
        },
      ],
    },
    women: {
      name: "WOMEN",
      items: [
        {
          name: "Dresses",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Tops",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Blouses",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "T-Shirts",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Skirts",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Pants",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Jeans",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Jackets",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Coats",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Knitwear",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Activewear",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Lingerie",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Swimwear",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Accessories",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Jewelry",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
      ],
      slides: [
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "Evening Collection",
        },
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "Casual Wear",
        },
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "Accessories",
        },
      ],
    },
    sale: {
      name: "SALE",
      items: [
        {
          name: "Up to 50% Off",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Clearance",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Last Chance",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Bundle Deals",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Summer Sale",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Winter Clearance",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Flash Sales",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Member Only",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Student Discount",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Limited Offers",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Outlet",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Buy 1 Get 1",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Season End",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Special Deals",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
        {
          name: "Gift Cards",
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
        },
      ],
      slides: [
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "50% Off Everything",
        },
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "Clearance Sale",
        },
        {
          image:
            "https://imgs.search.brave.com/OxhwZMzEGjw1VIIcmMxmpgSV8m9Fg_C6NCqnJIKbrBY/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jb3R0/b253b3JsZC5uZXQv/Y2RuL3Nob3AvZmls/ZXMvTS1TSElSVFMt/MTA1MjEtMjExNjIt/V0hJVEVOQVZZXzEu/anBnP3Y9MTc1MzY4/MzI1NCZ3aWR0aD0x/Mjgw",
          title: "Last Sizes",
        },
      ],
    },
  };

  const handleCategoryHover = (categoryId) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredCategory(categoryId);
  };

  const handleCategoryLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredCategory(null);
    }, 200);
    setHoverTimeout(timeout);
  };

  const handleDropdownEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
  };

  const handleDropdownLeave = () => {
    setHoveredCategory(null);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (hoveredCategory) {
      setCurrentSlide(
        (prev) => (prev + 1) % categories[hoveredCategory].slides.length,
      );
    }
  };

  const prevSlide = () => {
    if (hoveredCategory) {
      setCurrentSlide(
        (prev) =>
          (prev - 1 + categories[hoveredCategory].slides.length) %
          categories[hoveredCategory].slides.length,
      );
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        {/* Mobile Menu Button */}
        <button className={styles.menuToggle} onClick={toggleMenu}>
          <div
            className={`${styles.hamburger} ${isMenuOpen ? styles.open : ""}`}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>

        {/* Left Section - Categories */}
        <div
          className={`${styles.leftSection} ${isMenuOpen ? styles.mobileOpen : ""}`}
        >
          {Object.entries(categories).map(([id, category]) => (
            <div
              key={id}
              className={styles.categoryWrapper}
              onMouseEnter={() => handleCategoryHover(id)}
              onMouseLeave={handleCategoryLeave}
            >
              <button className={styles.categoryBtn}>{category.name}</button>
            </div>
          ))}
        </div>

        {/* Center Section - Logo */}
        <div className={styles.centerSection}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoText}>LUXURIA</span>
            <span className={styles.logoAccent}></span>
          </a>
        </div>

        {/* Right Section - Icons */}
        <div className={styles.rightSection}>
          <button className={styles.iconBtn} aria-label="Search">
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button className={styles.iconBtn} aria-label="Profile">
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button className={styles.iconBtn} aria-label="Liked Items">
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M4.31802 6.31802C2.56066 8.07538 2.56066 10.9246 4.31802 12.682L12 20.364L19.682 12.682C21.4393 10.9246 21.4393 8.07538 19.682 6.31802C17.9246 4.56066 15.0754 4.56066 13.318 6.31802L12 7.63609L10.682 6.31802C8.92462 4.56066 6.07538 4.56066 4.31802 6.31802Z"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className={styles.badge}>3</span>
          </button>

          <button className={styles.iconBtn} aria-label="Cart">
            <svg
              className={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11M5 9H19L18 19H6L5 9Z"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className={styles.badge}>2</span>
          </button>
        </div>
      </div>

      {/* Full Width Dropdown */}
      {hoveredCategory && (
        <div
          className={styles.fullWidthDropdown}
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
        >
          <div className={styles.dropdownContainer}>
            {/* Left Section - 70% Categories Grid */}
            <div className={styles.categoriesGrid}>
              <div className={styles.gridHeader}>
                <h3>{categories[hoveredCategory].name} COLLECTION</h3>
                <a href={`/${hoveredCategory}`} className={styles.viewAllLink}>
                  View All →
                </a>
              </div>
              <div className={styles.itemsGrid}>
                {categories[hoveredCategory].items.map((item, index) => (
                  <a
                    href={`/${hoveredCategory}/${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    key={index}
                    className={styles.gridItem}
                  >
                    <div className={styles.itemImage}>
                      <img src={item.image} alt={item.name} />
                    </div>
                    <span className={styles.itemName}>{item.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Right Section - 30% Slideshow */}
            <div className={styles.slideshowSection}>
              <div className={styles.slideshowContainer}>
                {categories[hoveredCategory].slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`${styles.slide} ${index === currentSlide ? styles.activeSlide : ""}`}
                  >
                    <img src={slide.image} alt={slide.title} />
                    <div className={styles.slideOverlay}>
                      <h4>{slide.title}</h4>
                      <button className={styles.shopNowBtn}>Shop Now</button>
                    </div>
                  </div>
                ))}

                {/* Slideshow Controls */}
                <button
                  className={`${styles.slideControl} ${styles.prevSlide}`}
                  onClick={prevSlide}
                >
                  ←
                </button>
                <button
                  className={`${styles.slideControl} ${styles.nextSlide}`}
                  onClick={nextSlide}
                >
                  →
                </button>

                <div className={styles.slideIndicators}>
                  {categories[hoveredCategory].slides.map((_, index) => (
                    <span
                      key={index}
                      className={`${styles.indicator} ${index === currentSlide ? styles.activeIndicator : ""}`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
