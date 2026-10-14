import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Svg, { Path, Rect } from 'react-native-svg';
import { WORLD_PATHS } from '@/data/worldPaths';

// Extending the viewBox to 1:1 (square) by adding ocean space above/below.
// Countries are projected to x: 0–1000, y: 0–500 (equirectangular).
// We add 250 units of ocean above (y=-250) and 250 below (y=500→750),
// giving a 1000×1000 square. This fills portrait screens with no letterboxing.
const SVG_W   = 1000;
const SVG_H   = 1000;
const VIEW_X  = 0;
const VIEW_Y  = -250;

const MIN_SCALE = 1;
const MAX_SCALE = 10;

interface Props {
  visitedSet: Set<string>;
  bucketSet?: Set<string>;
  onCountryPress: (code: string) => void;
}

export function WorldMap({ visitedSet, bucketSet, onCountryPress }: Props) {
  const scale      = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx         = useSharedValue(0);
  const savedTx    = useSharedValue(0);
  const ty         = useSharedValue(0);
  const savedTy    = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .activeOffsetY([-8, 8])
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX;
      ty.value = savedTy.value + e.translationY;
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .runOnJS(false)
    .onEnd(() => {
      scale.value      = withTiming(1, { duration: 300 });
      tx.value         = withTiming(0, { duration: 300 });
      ty.value         = withTiming(0, { duration: 300 });
      savedScale.value = 1;
      savedTx.value    = 0;
      savedTy.value    = 0;
    });

  const composed = Gesture.Simultaneous(
    Gesture.Race(doubleTap, pan),
    pinch,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  const handlePress = useCallback(
    (code: string) => onCountryPress(code),
    [onCountryPress],
  );

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Svg
          viewBox={`${VIEW_X} ${VIEW_Y} ${SVG_W} ${SVG_H}`}
          style={styles.svg}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Ocean — covers the full extended viewBox */}
          <Rect x={VIEW_X} y={VIEW_Y} width={SVG_W} height={SVG_H} fill="#c8dff0" />

          {/* Countries */}
          {WORLD_PATHS.map(({ code, d }) => (
            <Path
              key={code}
              d={d}
              fill={
                visitedSet.has(code)
                  ? '#c4501a'
                  : bucketSet?.has(code)
                  ? '#c8a84b'
                  : '#d4c9b0'
              }
              stroke="#f5f0e8"
              strokeWidth={0.5}
              onPress={() => handlePress(code)}
            />
          ))}
        </Svg>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
