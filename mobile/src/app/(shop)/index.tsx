import React from 'react';
import { Redirect } from 'expo-router';

export default function ShopIndex() {
  return <Redirect href={"/(shop)/(tabs)" as never} />;
}
