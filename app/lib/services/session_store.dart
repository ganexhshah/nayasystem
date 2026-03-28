import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SessionStore {
  SessionStore._();

  static final SessionStore instance = SessionStore._();

  static const _tokenKey = 'auth_token';
  static const _userKey = 'auth_user';

  final ValueNotifier<bool> initialized = ValueNotifier<bool>(false);

  String? _token;
  Map<String, dynamic>? _user;

  String? get token => _token;
  Map<String, dynamic>? get user => _user;
  bool get isAuthenticated => (_token ?? '').isNotEmpty;

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
    final rawUser = prefs.getString(_userKey);
    if (rawUser != null && rawUser.isNotEmpty) {
      try {
        _user = Map<String, dynamic>.from(jsonDecode(rawUser) as Map);
      } catch (_) {
        _user = null;
      }
    }
    initialized.value = true;
  }

  Future<void> saveSession({
    required String token,
    required Map<String, dynamic> user,
  }) async {
    _token = token;
    _user = user;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user));
  }

  Future<void> clear() async {
    _token = null;
    _user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}
