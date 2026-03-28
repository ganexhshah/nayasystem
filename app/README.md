# naya_system

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Backend Connection

The app expects backend API at `http://localhost:8000/api` family URLs.

- Android emulator default: `http://10.0.2.2:8000/api`
- iOS simulator default: `http://127.0.0.1:8000/api`
- Real device: pass your PC LAN IP explicitly:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:8000/api
```
