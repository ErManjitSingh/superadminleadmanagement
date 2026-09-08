import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

const FALLBACK: keyof typeof Ionicons.glyphMap = 'ellipse';

/** Map aliases / invalid names → valid Ionicons glyphs */
const ALIASES: Record<string, keyof typeof Ionicons.glyphMap> = {
  inbox: 'file-tray-outline',
  sparkles: 'sparkles',
  flame: 'flame',
  trophy: 'trophy',
  ribbon: 'ribbon',
  analytics: 'analytics',
  'bar-chart': 'bar-chart',
  warning: 'warning',
  clipboard: 'clipboard',
  today: 'today',
  airplane: 'airplane',
  card: 'card',
  briefcase: 'briefcase',
  construct: 'construct-outline',
  refresh: 'refresh',
  alarm: 'alarm',
  timer: 'timer',
  trash: 'trash',
  settings: 'settings',
  grid: 'grid',
  'grid-outline': 'grid-outline',
};

export function resolveIonicon(name?: string | null): keyof typeof Ionicons.glyphMap {
  if (!name) return FALLBACK;
  if (ALIASES[name]) return ALIASES[name];
  if (name in Ionicons.glyphMap) {
    return name as keyof typeof Ionicons.glyphMap;
  }
  const outline = `${name}-outline`;
  if (outline in Ionicons.glyphMap) {
    return outline as keyof typeof Ionicons.glyphMap;
  }
  return FALLBACK;
}

export function AppIcon({
  name,
  size = 20,
  color = '#0F172A',
  style,
}: {
  name?: string | null;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Ionicons name={resolveIonicon(name)} size={size} color={color} style={style} />;
}
