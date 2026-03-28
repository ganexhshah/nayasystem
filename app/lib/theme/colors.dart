import 'package:flutter/material.dart';

// Matches web globals.css light theme (oklch → hex approximations)
class AppColors {
  static const background = Colors.white; // oklch(1 0 0)
  static const foreground = Color(0xFF1C1C1C); // oklch(0.145 0 0)
  static const card = Colors.white;
  static const primary = Color(0xFF1C1C1C); // oklch(0.205 0 0)
  static const muted = Color(0xFFF7F7F7); // oklch(0.97 0 0)
  static const mutedFg = Color(0xFF737373); // oklch(0.556 0 0)
  static const border = Color(0xFFE8E8E8); // oklch(0.922 0 0)
  static const input = Color(0xFFE8E8E8);
  static const destructive = Color(0xFFEF4444);
  static const destructiveFg = Color(0xFFFEF2F2);
  static const ring = Color(0xFF1C1C1C);
}
