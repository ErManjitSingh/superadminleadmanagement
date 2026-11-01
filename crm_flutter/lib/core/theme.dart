import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'emb_theme.dart';

class AppColors {
  static const primary = EmbTheme.teal;
  static const primaryDark = Color(0xFF0A6F6F);
  static const primaryLight = EmbTheme.tealSoft;
  static const background = EmbTheme.cream;
  static const surface = EmbTheme.white;
  static const text = EmbTheme.ink;
  static const textSecondary = EmbTheme.inkSoft;
  static const textMuted = EmbTheme.muted;
  static const border = EmbTheme.border;
  static const success = EmbTheme.mint;
  static const warning = EmbTheme.saffron;
  static const danger = EmbTheme.danger;
  static const info = EmbTheme.sky;
  static const hot = EmbTheme.saffron;
}

ThemeData buildAppTheme({Color? primary}) {
  final seed = primary ?? EmbTheme.teal;

  final bodyBase = GoogleFonts.plusJakartaSansTextTheme().apply(
    bodyColor: EmbTheme.ink,
    displayColor: EmbTheme.ink,
  );
  final display = GoogleFonts.soraTextTheme(bodyBase);

  final textTheme = display.copyWith(
    displayLarge: display.displayLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.8),
    displayMedium: display.displayMedium?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.5),
    displaySmall: display.displaySmall?.copyWith(fontWeight: FontWeight.w700),
    headlineLarge: display.headlineLarge?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.4),
    headlineMedium: display.headlineMedium?.copyWith(fontWeight: FontWeight.w700, letterSpacing: -0.3),
    headlineSmall: display.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
    titleLarge: GoogleFonts.sora(fontSize: 20, fontWeight: FontWeight.w700, color: EmbTheme.ink, letterSpacing: -0.2),
    titleMedium: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w700, color: EmbTheme.ink),
    titleSmall: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700, color: EmbTheme.ink),
    bodyLarge: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w500, color: EmbTheme.ink, height: 1.45),
    bodyMedium: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w500, color: EmbTheme.ink, height: 1.45),
    bodySmall: GoogleFonts.plusJakartaSans(fontSize: 12.5, fontWeight: FontWeight.w500, color: EmbTheme.inkSoft, height: 1.4),
    labelLarge: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w700, color: EmbTheme.ink),
    labelMedium: GoogleFonts.plusJakartaSans(fontSize: 12, fontWeight: FontWeight.w600, color: EmbTheme.inkSoft),
    labelSmall: GoogleFonts.plusJakartaSans(fontSize: 11, fontWeight: FontWeight.w600, color: EmbTheme.muted, letterSpacing: 0.2),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: seed,
      primary: seed,
      surface: EmbTheme.white,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: EmbTheme.cream,
    textTheme: textTheme,
    primaryTextTheme: textTheme,
    fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
    appBarTheme: AppBarTheme(
      backgroundColor: EmbTheme.white,
      foregroundColor: EmbTheme.ink,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.sora(
        color: EmbTheme.ink,
        fontWeight: FontWeight.w700,
        fontSize: 20,
        letterSpacing: -0.2,
      ),
    ),
    cardTheme: CardThemeData(
      color: EmbTheme.white,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: EmbTheme.border),
      ),
    ),
    chipTheme: ChipThemeData(
      labelStyle: GoogleFonts.plusJakartaSans(fontSize: 13, fontWeight: FontWeight.w600),
      secondaryLabelStyle: GoogleFonts.plusJakartaSans(fontSize: 13, fontWeight: FontWeight.w600),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: EmbTheme.white,
      labelStyle: GoogleFonts.plusJakartaSans(color: EmbTheme.inkSoft, fontWeight: FontWeight.w500),
      hintStyle: GoogleFonts.plusJakartaSans(color: EmbTheme.muted, fontWeight: FontWeight.w500),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: EmbTheme.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: EmbTheme.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: seed, width: 1.5),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: seed,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: EmbTheme.ink,
        textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: EmbTheme.teal,
        textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 14),
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: seed,
      foregroundColor: Colors.white,
      extendedTextStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 14),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      selectedLabelStyle: GoogleFonts.plusJakartaSans(fontSize: 11, fontWeight: FontWeight.w700),
      unselectedLabelStyle: GoogleFonts.plusJakartaSans(fontSize: 11, fontWeight: FontWeight.w500),
    ),
    snackBarTheme: SnackBarThemeData(
      contentTextStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600, color: Colors.white),
    ),
  );
}
