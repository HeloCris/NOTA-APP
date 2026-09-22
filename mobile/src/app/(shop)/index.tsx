import React from 'react';
import { Redirect } from 'expo-router';

// --- Custom Vector Icons for Categorias Rápidas ---

function DropletIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
        stroke="#9E4732"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FlowerIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="2.8" stroke="#4D6B53" strokeWidth={2} />
      <Circle cx="12" cy="5.5" r="2.8" stroke="#4D6B53" strokeWidth={1.8} />
      <Circle cx="12" cy="18.5" r="2.8" stroke="#4D6B53" strokeWidth={1.8} />
      <Circle cx="5.5" cy="12" r="2.8" stroke="#4D6B53" strokeWidth={1.8} />
      <Circle cx="18.5" cy="12" r="2.8" stroke="#4D6B53" strokeWidth={1.8} />
    </Svg>
  );
}

function CitrusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke="#2C4659" strokeWidth={2} />
      <Path
        d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M5.64 18.36L18.36 5.64"
        stroke="#2C4659"
        strokeWidth={1.4}
      />
      <Circle cx="12" cy="12" r="2.2" fill="#2C4659" />
    </Svg>
  );
}

function OrientalIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5c-2 3-5 6.5-5 10a5 5 0 0 0 10 0c0-3.5-3-7-5-10z"
        stroke="#9E512F"
        strokeWidth={2}
      />
      <Circle cx="12" cy="13" r="1.8" fill="#9E512F" />
    </Svg>
  );
}

function GourmandIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l2.4 5.6 6 .8-4.4 4.2 1.2 6-5.2-3-5.2 3 1.2-6-4.4-4.2 6-.8z"
        stroke="#B45309"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// --- Perfume Bottle Illustrations for "Para Você" ---

function LavenderBottle() {
  return (
    <Svg width={100} height={135} viewBox="0 0 110 140">
      <Defs>
        <LinearGradient id="lavenderGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#DDD6FE" />
          <Stop offset="35%" stopColor="#C4B5FD" />
          <Stop offset="75%" stopColor="#A78BFA" />
          <Stop offset="100%" stopColor="#8B5CF6" />
        </LinearGradient>
        <LinearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="50%" stopColor="#CA8A04" />
          <Stop offset="100%" stopColor="#854D0E" />
        </LinearGradient>
      </Defs>
      {/* Golden Cap */}
      <Rect x="46" y="14" width="18" height="16" rx="2" fill="url(#goldGrad)" />
      {/* Golden Neck */}
      <Rect x="49" y="30" width="12" height="7" rx="1" fill="#CA8A04" />
      {/* Bottle Body */}
      <Rect x="26" y="37" width="58" height="88" rx="8" fill="url(#lavenderGrad)" />
      {/* Minimalist Label Frame */}
      <Rect
        x="37"
        y="58"
        width="36"
        height="32"
        rx="3"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.6"
        strokeOpacity="0.85"
      />
    </Svg>
  );
}

function AmberBottle() {
  return (
    <Svg width={100} height={135} viewBox="0 0 110 140">
      <Defs>
        <LinearGradient id="amberGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FCD34D" />
          <Stop offset="40%" stopColor="#F59E0B" />
          <Stop offset="80%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#92400E" />
        </LinearGradient>
        <LinearGradient id="goldCapGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="60%" stopColor="#D97706" />
          <Stop offset="100%" stopColor="#78350F" />
        </LinearGradient>
      </Defs>
      {/* Golden Spherical Cap */}
      <Circle cx="55" cy="22" r="11" fill="url(#goldCapGrad)" />
      {/* Neck */}
      <Rect x="50" y="33" width="10" height="7" fill="#B45309" />
      {/* Cylinder Bottle Body */}
      <Rect x="38" y="40" width="34" height="90" rx="6" fill="url(#amberGrad)" />
    </Svg>
  );
}

export default function ShopIndex() {
  return <Redirect href={"/(shop)/(tabs)" as never} />;
}
