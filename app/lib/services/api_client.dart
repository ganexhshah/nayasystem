import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'session_store.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final dynamic data;

  const ApiException({
    required this.statusCode,
    required this.message,
    this.data,
  });

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  String get baseUrl => _baseUrl;

  String get _baseUrl {
    const fromDefine = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (fromDefine.isNotEmpty) {
      return fromDefine.endsWith('/')
          ? fromDefine.substring(0, fromDefine.length - 1)
          : fromDefine;
    }

    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }

    // Localhost mapping differs by platform.
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:8000/api';
      case TargetPlatform.iOS:
      case TargetPlatform.macOS:
      case TargetPlatform.windows:
      case TargetPlatform.linux:
        return 'http://127.0.0.1:8000/api';
      case TargetPlatform.fuchsia:
        return 'http://localhost:8000/api';
    }
  }

  String get _networkHint {
    if (kIsWeb) {
      return 'Ensure backend is running at $baseUrl.';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'For real device, run with --dart-define=API_BASE_URL=http://<PC-LAN-IP>:8000/api.';
    }
    return 'Set --dart-define=API_BASE_URL=http://<PC-LAN-IP>:8000/api when using a real device.';
  }

  Future<dynamic> get(
    String path, {
    Map<String, dynamic>? query,
    bool auth = true,
  }) => _request('GET', path, query: query, auth: auth);

  Future<dynamic> post(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) => _request('POST', path, body: body, auth: auth);

  Future<dynamic> put(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) => _request('PUT', path, body: body, auth: auth);

  Future<dynamic> patch(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) => _request('PATCH', path, body: body, auth: auth);

  Future<dynamic> delete(
    String path, {
    Map<String, dynamic>? body,
    bool auth = true,
  }) => _request('DELETE', path, body: body, auth: auth);

  Future<dynamic> _request(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse(
      '$_baseUrl$normalizedPath',
    ).replace(queryParameters: query?.map((k, v) => MapEntry(k, v.toString())));

    final headers = <String, String>{'Accept': 'application/json'};
    if (body != null) {
      headers['Content-Type'] = 'application/json';
    }

    if (auth && SessionStore.instance.isAuthenticated) {
      headers['Authorization'] = 'Bearer ${SessionStore.instance.token}';
    }

    late http.Response response;
    try {
      response = switch (method) {
        'GET' => await http.get(uri, headers: headers),
        'POST' => await http.post(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'PUT' => await http.put(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'PATCH' => await http.patch(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'DELETE' => await http.delete(
          uri,
          headers: headers,
          body: body == null ? null : jsonEncode(body),
        ),
        _ => throw const ApiException(
          statusCode: 500,
          message: 'Unsupported HTTP method',
        ),
      };
    } on Exception catch (e) {
      throw ApiException(
        statusCode: 0,
        message:
            'Network request failed. Could not reach $baseUrl. $_networkHint',
        data: {'error': e.toString(), 'url': uri.toString()},
      );
    }

    final data = _decodeBody(response.bodyBytes);
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    if (response.statusCode == 401) {
      await SessionStore.instance.clear();
    }

    final message =
        _extractErrorMessage(data) ?? response.reasonPhrase ?? 'Request failed';
    throw ApiException(
      statusCode: response.statusCode,
      message: message,
      data: data,
    );
  }

  dynamic _decodeBody(List<int> bytes) {
    if (bytes.isEmpty) return null;
    final raw = utf8.decode(bytes);
    if (raw.trim().isEmpty) return null;
    try {
      return jsonDecode(raw);
    } catch (_) {
      return raw;
    }
  }

  String? _extractErrorMessage(dynamic data) {
    if (data is Map) {
      if (data['message'] is String) return data['message'] as String;
      if (data['error'] is String) return data['error'] as String;
    }
    return null;
  }
}

List<Map<String, dynamic>> extractDataList(dynamic payload) {
  if (payload is List) {
    return payload
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }
  if (payload is Map && payload['data'] is List) {
    final data = payload['data'] as List;
    return data
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }
  return <Map<String, dynamic>>[];
}

Map<String, dynamic> asMap(dynamic value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}

String asString(dynamic value, {String fallback = ''}) {
  if (value == null) return fallback;
  final text = value.toString().trim();
  return text.isEmpty ? fallback : text;
}

int asInt(dynamic value, {int fallback = 0}) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(asString(value)) ?? fallback;
}

double asDouble(dynamic value, {double fallback = 0}) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(asString(value)) ?? fallback;
}

bool asBool(dynamic value, {bool fallback = false}) {
  if (value is bool) return value;
  final text = asString(value).toLowerCase();
  if (text == 'true' || text == '1') return true;
  if (text == 'false' || text == '0') return false;
  return fallback;
}
