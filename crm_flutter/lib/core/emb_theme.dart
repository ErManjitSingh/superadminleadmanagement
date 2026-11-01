import 'package:flutter/material.dart';

/// Explore My Bharat — light travel palette
class EmbTheme {
  static const ink = Color(0xFF1A2B3C);
  static const inkSoft = Color(0xFF4A6070);
  static const muted = Color(0xFF7A8F9E);
  static const cream = Color(0xFFF7F3EC);
  static const paper = Color(0xFFFFFCF8);
  static const white = Color(0xFFFFFFFF);
  static const teal = Color(0xFF0D8B8B);
  static const tealSoft = Color(0xFFE5F6F6);
  static const saffron = Color(0xFFE07A3D);
  static const saffronSoft = Color(0xFFFFF0E6);
  static const sky = Color(0xFF3B82C4);
  static const skySoft = Color(0xFFE8F2FB);
  static const mint = Color(0xFF1FA97A);
  static const mintSoft = Color(0xFFE6F7F0);
  static const coral = Color(0xFFE85D5D);
  static const border = Color(0xFFE4DDD2);
  static const danger = Color(0xFFD64545);

  // Compat aliases used by older screens
  static const night = ink;
  static const deep = Color(0xFF243B4D);
  static const gold = saffron;
  static const goldSoft = Color(0xFFF4A574);

  static const pageGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFFFFFBF6), cream, Color(0xFFF0EBE3)],
  );
}
