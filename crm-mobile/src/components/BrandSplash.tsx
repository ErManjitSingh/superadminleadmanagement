import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

type BrandSplashProps = {
  title?: string;
  subtitle?: string;
  logoUri?: string | null;
  primaryColor?: string;
};

const { width: W, height: H } = Dimensions.get('window');

function Spark({
  x,
  y,
  size,
  delay,
  color,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      )
    );
    return () => cancelAnimation(t);
  }, [delay, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 1], [0.12, 0.95]),
    transform: [{ scale: interpolate(t.value, [0, 1], [0.55, 1.4]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function BrandSplash({
  title = 'CRM',
  subtitle = 'Loading your workspace…',
  logoUri = null,
  primaryColor = '#7C3AED',
}: BrandSplashProps) {
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(-16);
  const ring = useSharedValue(0);
  const spin = useSharedValue(0);
  const titleY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const subOpacity = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const orb1 = useSharedValue(0);
  const orb2 = useSharedValue(0);
  const glow = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700 });
    logoScale.value = withSequence(
      withTiming(1.14, { duration: 780, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 340, easing: Easing.inOut(Easing.quad) })
    );
    logoRotate.value = withTiming(0, { duration: 860, easing: Easing.out(Easing.cubic) });

    ring.value = withDelay(
      120,
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.linear }), -1, false)
    );
    spin.value = withRepeat(withTiming(1, { duration: 4800, easing: Easing.linear }), -1, false);

    glow.value = withDelay(
      180,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );

    titleOpacity.value = withDelay(420, withTiming(1, { duration: 650 }));
    titleY.value = withDelay(
      420,
      withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    subOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));

    shimmer.value = withDelay(
      550,
      withRepeat(withTiming(1, { duration: 1600, easing: Easing.linear }), -1, false)
    );
    sweep.value = withDelay(
      400,
      withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.quad) }), -1, false)
    );

    orb1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    orb2.value = withDelay(
      350,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );

    return () => {
      cancelAnimation(ring);
      cancelAnimation(spin);
      cancelAnimation(shimmer);
      cancelAnimation(orb1);
      cancelAnimation(orb2);
      cancelAnimation(glow);
      cancelAnimation(sweep);
    };
  }, [
    logoOpacity,
    logoScale,
    logoRotate,
    ring,
    spin,
    titleOpacity,
    titleY,
    subOpacity,
    shimmer,
    orb1,
    orb2,
    glow,
    sweep,
  ]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { rotate: `${logoRotate.value}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.2, 0.7]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.9, 1.2]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.5, 1], [0.55, 0.2, 0.55]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.92, 1.28]) }],
  }));

  const arcStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(spin.value, [0, 1], [0, 360])}deg` }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: subOpacity.value,
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${interpolate(shimmer.value, [0, 1], [12, 96])}%`,
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.55, 1, 0.7]),
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(sweep.value, [0, 1], [-80, 200]) }],
    opacity: interpolate(sweep.value, [0, 0.4, 1], [0, 0.7, 0]),
  }));

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(orb1.value, [0, 1], [0, -24]) },
      { translateX: interpolate(orb1.value, [0, 1], [0, 14]) },
    ],
    opacity: interpolate(orb1.value, [0, 1], [0.28, 0.7]),
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(orb2.value, [0, 1], [0, 18]) },
      { translateX: interpolate(orb2.value, [0, 1], [0, -16]) },
    ],
    opacity: interpolate(orb2.value, [0, 1], [0.25, 0.62]),
  }));

  const accent = primaryColor || '#7C3AED';

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0B0720', '#1A1040', accent, '#C4B5FD']}
        locations={[0, 0.28, 0.72, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.orb, styles.orbA, orb1Style]} />
      <Animated.View style={[styles.orb, styles.orbB, orb2Style]} />

      <Spark x={W * 0.1} y={H * 0.16} size={5} delay={0} color="#FBBF24" />
      <Spark x={W * 0.8} y={H * 0.2} size={4} delay={180} color="#fff" />
      <Spark x={W * 0.18} y={H * 0.74} size={6} delay={360} color="#FDE68A" />
      <Spark x={W * 0.86} y={H * 0.66} size={4} delay={520} color="#fff" />
      <Spark x={W * 0.48} y={H * 0.12} size={3} delay={260} color="#E9D5FF" />
      <Spark x={W * 0.06} y={H * 0.46} size={4} delay={440} color="#FBBF24" />
      <Spark x={W * 0.92} y={H * 0.4} size={5} delay={120} color="#fff" />

      <View style={styles.center}>
        <View style={styles.logoStage}>
          <Animated.View style={[styles.glow, glowStyle, { backgroundColor: `${accent}66` }]} />
          <Animated.View style={[styles.ring, ringStyle]} />
          <Animated.View style={[styles.arcWrap, arcStyle]}>
            <View style={[styles.arc, { borderTopColor: accent, borderRightColor: 'rgba(255,255,255,0.35)' }]} />
          </Animated.View>
          <Animated.View style={[styles.logoCard, logoStyle]}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
            ) : (
              <View style={[styles.fallbackMark, { backgroundColor: accent }]}>
                <Ionicons name="airplane" size={36} color="#fff" />
              </View>
            )}
          </Animated.View>
        </View>

        <Animated.View style={titleStyle}>
          <Text style={styles.brand} numberOfLines={2}>
            {title}
          </Text>
        </Animated.View>

        <Animated.Text style={[styles.subtitle, subStyle]} numberOfLines={2}>
          {subtitle}
        </Animated.Text>

        <View style={styles.loaderTrack}>
          <Animated.View style={[styles.loaderBar, barStyle, { backgroundColor: '#FBBF24' }]} />
          <Animated.View style={[styles.loaderSweep, sweepStyle]} />
        </View>
        <Animated.Text style={[styles.loadingText, subStyle]}>Please wait…</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0720',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbA: {
    width: 210,
    height: 210,
    top: '9%',
    left: -55,
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
  },
  orbB: {
    width: 250,
    height: 250,
    bottom: '7%',
    right: -75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoStage: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  glow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
  },
  ring: {
    position: 'absolute',
    width: 158,
    height: 158,
    borderRadius: 79,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  arcWrap: {
    position: 'absolute',
    width: 168,
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arc: {
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  logoCard: {
    width: 122,
    height: 122,
    borderRadius: 34,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  fallbackMark: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '600',
  },
  loaderTrack: {
    marginTop: 36,
    width: 196,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  loaderBar: {
    height: '100%',
    borderRadius: 999,
  },
  loaderSweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 48,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  loadingText: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
});
