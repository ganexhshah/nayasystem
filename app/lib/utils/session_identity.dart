import '../services/api_client.dart';

String sessionUserName(Map<String, dynamic>? user) {
  return asString(user?['name'], fallback: 'User');
}

String sessionUserEmail(Map<String, dynamic>? user) {
  return asString(user?['email'], fallback: '');
}

String sessionRestaurantName(Map<String, dynamic>? user) {
  final restaurant = asMap(user?['restaurant']);
  return asString(
    restaurant['name'],
    fallback: asString(user?['restaurant_name'], fallback: 'Restaurant'),
  );
}

String sessionRestaurantSubtitle(Map<String, dynamic>? user) {
  final restaurant = asMap(user?['restaurant']);
  final slug = asString(restaurant['slug']);
  if (slug.isNotEmpty) return slug;

  final email = sessionUserEmail(user);
  if (email.isNotEmpty) return email;

  return 'naya-system';
}

String sessionUserInitial(Map<String, dynamic>? user) {
  final name = sessionUserName(user).trim();
  if (name.isEmpty) return 'U';
  return name.substring(0, 1).toUpperCase();
}
