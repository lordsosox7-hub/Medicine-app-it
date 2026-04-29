import React from "react";
import { View } from "react-native";
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from "react-native-svg";

interface SparklineProps {
  points: number[];
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showFill?: boolean;
  showLastDot?: boolean;
}

export function Sparkline({
  points,
  color,
  width = 100,
  height = 28,
  strokeWidth = 1.6,
  showFill = true,
  showLastDot = true,
}: SparklineProps) {
  if (!points || points.length === 0) {
    return <View style={{ width, height }} />;
  }

  const padX = strokeWidth + 1;
  const padY = strokeWidth + 1;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  // If only one point, draw a flat dot in the middle
  const xs =
    points.length === 1
      ? [padX + w / 2]
      : points.map((_, i) => padX + (i / (points.length - 1)) * w);
  const ys = points.map(
    (v) => padY + h - ((v - min) / range) * h
  );

  const linePath = xs
    .map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${ys[i].toFixed(2)}`)
    .join(" ");

  const fillPath =
    points.length > 1
      ? `${linePath} L${xs[xs.length - 1].toFixed(2)},${(padY + h).toFixed(2)} L${xs[0].toFixed(2)},${(padY + h).toFixed(2)} Z`
      : "";

  const gradId = `spark-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <Svg width={width} height={height}>
      {showFill && points.length > 1 && (
        <>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={fillPath} fill={`url(#${gradId})`} />
        </>
      )}
      <Path
        d={linePath}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {showLastDot && (
        <Circle
          cx={xs[xs.length - 1]}
          cy={ys[ys.length - 1]}
          r={strokeWidth + 0.6}
          fill={color}
        />
      )}
    </Svg>
  );
}
