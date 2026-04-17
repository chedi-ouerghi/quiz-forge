import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Canvas, Blur, Circle, Group, Fill } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const AnimatedCircle = ({
  color,
  baseRadius,
  baseX,
  baseY,
  delay = 0
}: {
  color: string,
  baseRadius: number,
  baseX: number,
  baseY: number,
  delay?: number
}) => {
  const x = useSharedValue(baseX);
  const y = useSharedValue(baseY);
  const r = useSharedValue(baseRadius);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(baseX + Math.random() * 100 - 50, {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.inOut(Easing.sine),
      }),
      -1,
      true
    );
    y.value = withRepeat(
      withTiming(baseY + Math.random() * 100 - 50, {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.inOut(Easing.sine),
      }),
      -1,
      true
    );
  }, []);

  return (
    <Circle cx={x} cy={y} r={r} color={color} opacity={0.4}>
      <Blur blur={60} />
    </Circle>
  );
};

export const DynamicBackground = () => {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color={Colors.bg} />
        <Group>
          <AnimatedCircle
            color="#7C3AED"
            baseRadius={width * 0.6}
            baseX={width * 0.8}
            baseY={height * 0.1}
          />
          <AnimatedCircle
            color="#2563EB"
            baseRadius={width * 0.5}
            baseX={width * 0.1}
            baseY={height * 0.4}
            delay={1000}
          />
          <AnimatedCircle
            color="#06B6D4"
            baseRadius={width * 0.7}
            baseX={width * 0.5}
            baseY={height * 0.8}
            delay={500}
          />
          <AnimatedCircle
            color="#A855F7"
            baseRadius={width * 0.4}
            baseX={width * 0.9}
            baseY={height * 0.6}
          />
        </Group>
      </Canvas>
    </View>
  );
};
