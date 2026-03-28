import '../services/api_client.dart';

String apiErrorMessage(
  Object error, {
  String fallback = 'Something went wrong',
}) {
  if (error is ApiException) {
    if (error.statusCode == 0) {
      return 'Cannot connect to backend (${ApiClient.instance.baseUrl}). '
          'Check backend server and API_BASE_URL.';
    }
    if (error.data is Map && (error.data as Map)['errors'] is Map) {
      final errors = (error.data as Map)['errors'] as Map;
      final first = errors.values.isNotEmpty ? errors.values.first : null;
      if (first is List && first.isNotEmpty) {
        return first.first.toString();
      }
    }
    return error.message;
  }
  return fallback;
}
