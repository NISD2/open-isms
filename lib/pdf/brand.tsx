import React from "react";
import { Svg, Path, View, Text, StyleSheet } from "@react-pdf/renderer";
import { FONT } from "./fonts";

/**
 * Brand primitives shared by every generated PDF. Colours mirror the CSS
 * custom properties in app/globals.css so a printed document and the screen it
 * came from read as the same product.
 */
export const BRAND = {
  primary: "#284b63",
  primaryDeep: "#1d3a4d",
  accent: "#3c6e71",
  ink: "#0f172a",
  body: "#334155",
  muted: "#64748b",
  faint: "#94a3b8",
  rule: "#e2e8f0",
  ruleStrong: "#cbd5e1",
  surface: "#f8fafc",
  paper: "#ffffff",
} as const;

/** lucide-react `shield`, the same mark the site header uses. Vector rather
 *  than the PNG so it stays crisp at print resolution and can be recoloured. */
const SHIELD_PATH =
  "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z";

export function ShieldGlyph({
  size,
  color,
  strokeWidth = 2,
}: {
  size: number;
  color: string;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d={SHIELD_PATH}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

const logoStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  tile: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: BRAND.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontFamily: FONT.sans,
    fontWeight: 600,
    fontSize: 12.5,
    color: BRAND.ink,
    letterSpacing: -0.1,
  },
});

/** Tile + wordmark lockup, matching the public navbar. */
export function Logo() {
  return (
    <View style={logoStyles.row}>
      <View style={logoStyles.tile}>
        <ShieldGlyph size={14} color={BRAND.paper} strokeWidth={2.1} />
      </View>
      <Text style={logoStyles.wordmark}>NISD2.eu</Text>
    </View>
  );
}
