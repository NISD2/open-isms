import { Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { FONT } from "./fonts";
import { BRAND, RADIUS } from "./theme";

/**
 * The brand marks: the shield, the logo lockup and the seal.
 *
 * Tokens live in theme.ts and are imported from there by every consumer;
 * this file only draws.
 */

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

const sealStyles = StyleSheet.create({
  seal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.1,
    borderColor: BRAND.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    position: "absolute",
    top: 3.5,
    left: 3.5,
    right: 3.5,
    bottom: 3.5,
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: "#a8bcc9",
  },
  text: {
    marginTop: 3,
    fontFamily: FONT.sans,
    fontSize: 6,
    fontWeight: 600,
    letterSpacing: 1.2,
    color: BRAND.primary,
  },
});

/** Embossed-looking double ring around the shield. Marks a document as issued
 *  rather than merely printed; the label names what it attests to. */
export function Seal({ label }: { label: string }) {
  return (
    <View style={sealStyles.seal}>
      <View style={sealStyles.inner} />
      <ShieldGlyph size={17} color={BRAND.primary} strokeWidth={1.9} />
      <Text style={sealStyles.text}>{label}</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: BRAND.rule,
    overflow: "hidden",
  },
  fill: { height: 5, borderRadius: RADIUS.sm },
});

/** Horizontal meter. Used wherever a percentage needs a shape as well as a
 *  number, so a reader can scan a column of scores without reading each one. */
export function Meter({ percent, color }: { percent: number; color: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${clamped}%`, backgroundColor: color }]} />
    </View>
  );
}
