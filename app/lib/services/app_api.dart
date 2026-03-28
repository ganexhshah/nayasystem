import 'api_client.dart';
import 'session_store.dart';

class AppApi {
  AppApi._();

  static final AppApi instance = AppApi._();

  final ApiClient _client = ApiClient.instance;

  Future<void> initializeSession() => SessionStore.instance.load();

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = asMap(
      await _client.post(
        '/auth/login',
        body: {'email': email.trim(), 'password': password},
        auth: false,
      ),
    );

    final token = asString(response['token']);
    final user = asMap(response['user']);
    if (token.isEmpty || user.isEmpty) {
      throw const ApiException(
        statusCode: 500,
        message: 'Invalid login response',
      );
    }

    await SessionStore.instance.saveSession(token: token, user: user);
    return user;
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    required String restaurantName,
    String? phone,
  }) async {
    final response = asMap(
      await _client.post(
        '/auth/register',
        body: {
          'name': name.trim(),
          'email': email.trim(),
          'password': password,
          'password_confirmation': password,
          'restaurant_name': restaurantName.trim(),
          'phone': (phone ?? '').trim().isEmpty ? null : phone!.trim(),
        },
        auth: false,
      ),
    );

    final token = asString(response['token']);
    final user = asMap(response['user']);
    if (token.isEmpty || user.isEmpty) {
      throw const ApiException(
        statusCode: 500,
        message: 'Invalid register response',
      );
    }

    await SessionStore.instance.saveSession(token: token, user: user);
    return user;
  }

  Future<void> forgotPassword(String email) async {
    await _client.post(
      '/auth/forgot-password',
      body: {'email': email.trim()},
      auth: false,
    );
  }

  Future<void> resetPassword({
    required String token,
    required String email,
    required String password,
  }) async {
    await _client.post(
      '/auth/reset-password',
      body: {
        'token': token,
        'email': email.trim(),
        'password': password,
        'password_confirmation': password,
      },
      auth: false,
    );
  }

  Future<void> logout() async {
    try {
      await _client.post('/auth/logout');
    } catch (_) {}
    await SessionStore.instance.clear();
  }

  Future<Map<String, dynamic>> me() async {
    final response = asMap(await _client.get('/auth/me'));
    if (response.isNotEmpty) {
      await SessionStore.instance.saveSession(
        token: SessionStore.instance.token ?? '',
        user: response,
      );
    }
    return response;
  }

  Future<List<Map<String, dynamic>>> list(
    String endpoint, {
    Map<String, dynamic>? query,
  }) async {
    final response = await _client.get(endpoint, query: query);
    return extractDataList(response);
  }

  Future<Map<String, dynamic>> create(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    final response = await _client.post(endpoint, body: body);
    return asMap(response);
  }

  Future<Map<String, dynamic>> update(
    String endpoint,
    Map<String, dynamic> body, {
    bool patch = false,
  }) async {
    final response = patch
        ? await _client.patch(endpoint, body: body)
        : await _client.put(endpoint, body: body);
    return asMap(response);
  }

  Future<void> remove(String endpoint) async {
    await _client.delete(endpoint);
  }
}
