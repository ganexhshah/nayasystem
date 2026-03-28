import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/colors.dart';
import '../../services/api_client.dart';
import '../../services/app_api.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _showPassword = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AppApi.instance.login(
        email: _emailCtrl.text,
        password: _passwordCtrl.text,
      );
      if (!mounted) return;
      context.go('/app/dashboard');
    } on ApiException catch (e) {
      setState(() => _error = _errorMessageFromApi(e));
    } catch (_) {
      setState(() => _error = 'Unable to sign in right now.');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      'Welcome back',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Sign in to your account',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.mutedFg,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Error
                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.destructiveFg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppColors.destructive.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          _error!,
                          style: GoogleFonts.getFont(
                            'Google Sans',
                            fontSize: 13,
                            color: AppColors.destructive,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Google button
                    _googleButton('Continue with Google', onTap: () {}),

                    const SizedBox(height: 16),

                    // Divider
                    _divider('or sign in with email'),

                    const SizedBox(height: 16),

                    // Email
                    _label('Email'),
                    const SizedBox(height: 6),
                    _input(
                      controller: _emailCtrl,
                      hint: 'you@example.com',
                      icon: Icons.mail_outline,
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Email is required';
                        if (!v.contains('@')) return 'Invalid email';
                        return null;
                      },
                    ),

                    const SizedBox(height: 14),

                    // Password label + forgot
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _label('Password'),
                        GestureDetector(
                          onTap: () => context.go('/auth/forgot-password'),
                          child: Text(
                            'Forgot password?',
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    _input(
                      controller: _passwordCtrl,
                      hint: '••••••••',
                      icon: Icons.lock_outline,
                      obscure: !_showPassword,
                      suffix: GestureDetector(
                        onTap: () =>
                            setState(() => _showPassword = !_showPassword),
                        child: Icon(
                          _showPassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: AppColors.mutedFg,
                          size: 18,
                        ),
                      ),
                      validator: (v) => (v == null || v.isEmpty)
                          ? 'Password is required'
                          : null,
                    ),

                    const SizedBox(height: 20),

                    // Submit
                    _primaryButton(
                      label: 'Sign in',
                      loading: _loading,
                      onTap: _submit,
                    ),

                    const SizedBox(height: 24),

                    // Sign up link
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            "Don't have an account? ",
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 13,
                              color: AppColors.mutedFg,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/auth/signup'),
                            child: Text(
                              'Sign up',
                              style: GoogleFonts.getFont(
                                'Google Sans',
                                fontSize: 13,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w500,
                                decoration: TextDecoration.underline,
                                decorationColor: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Signup screen ─────────────────────────────────────────────────────────────
class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _restaurantCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _showPassword = false;
  bool _showConfirm = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _restaurantCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AppApi.instance.register(
        name: _nameCtrl.text,
        email: _emailCtrl.text,
        password: _passwordCtrl.text,
        restaurantName: _restaurantCtrl.text,
      );
      if (!mounted) return;
      context.go('/onboard');
    } on ApiException catch (e) {
      setState(() => _error = _errorMessageFromApi(e));
    } catch (_) {
      setState(() => _error = 'Unable to create account right now.');
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Create an account',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Set up your restaurant on Naya System',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.mutedFg,
                      ),
                    ),

                    const SizedBox(height: 24),

                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.destructiveFg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppColors.destructive.withValues(alpha: 0.3),
                          ),
                        ),
                        child: Text(
                          _error!,
                          style: GoogleFonts.getFont(
                            'Google Sans',
                            fontSize: 13,
                            color: AppColors.destructive,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    _googleButton('Continue with Google', onTap: () {}),
                    const SizedBox(height: 16),
                    _divider('or sign up with email'),
                    const SizedBox(height: 16),

                    _label('Full Name'),
                    const SizedBox(height: 6),
                    _input(
                      controller: _nameCtrl,
                      hint: 'John Doe',
                      icon: Icons.person_outline,
                      validator: (v) => (v == null || v.trim().length < 2)
                          ? 'Name is required'
                          : null,
                    ),

                    const SizedBox(height: 14),
                    _label('Restaurant Name'),
                    const SizedBox(height: 6),
                    _input(
                      controller: _restaurantCtrl,
                      hint: 'My Restaurant',
                      icon: Icons.storefront_outlined,
                      validator: (v) => (v == null || v.trim().length < 2)
                          ? 'Restaurant name is required'
                          : null,
                    ),

                    const SizedBox(height: 14),
                    _label('Email'),
                    const SizedBox(height: 6),
                    _input(
                      controller: _emailCtrl,
                      hint: 'you@example.com',
                      icon: Icons.mail_outline,
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Email is required';
                        if (!v.contains('@')) return 'Invalid email';
                        return null;
                      },
                    ),

                    const SizedBox(height: 14),
                    _label('Password'),
                    const SizedBox(height: 6),
                    _input(
                      controller: _passwordCtrl,
                      hint: '••••••••',
                      icon: Icons.lock_outline,
                      obscure: !_showPassword,
                      suffix: GestureDetector(
                        onTap: () =>
                            setState(() => _showPassword = !_showPassword),
                        child: Icon(
                          _showPassword
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: AppColors.mutedFg,
                          size: 18,
                        ),
                      ),
                      validator: (v) => (v == null || v.length < 8)
                          ? 'Min 8 characters'
                          : null,
                    ),

                    const SizedBox(height: 14),
                    _label('Confirm Password'),
                    const SizedBox(height: 6),
                    _input(
                      controller: _confirmCtrl,
                      hint: '••••••••',
                      icon: Icons.lock_outline,
                      obscure: !_showConfirm,
                      suffix: GestureDetector(
                        onTap: () =>
                            setState(() => _showConfirm = !_showConfirm),
                        child: Icon(
                          _showConfirm
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: AppColors.mutedFg,
                          size: 18,
                        ),
                      ),
                      validator: (v) => v != _passwordCtrl.text
                          ? "Passwords don't match"
                          : null,
                    ),

                    const SizedBox(height: 20),
                    _primaryButton(
                      label: 'Create account',
                      loading: _loading,
                      onTap: _submit,
                    ),

                    const SizedBox(height: 24),
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Already have an account? ',
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 13,
                              color: AppColors.mutedFg,
                            ),
                          ),
                          GestureDetector(
                            onTap: () => context.go('/auth/login'),
                            child: Text(
                              'Sign in',
                              style: GoogleFonts.getFont(
                                'Google Sans',
                                fontSize: 13,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w500,
                                decoration: TextDecoration.underline,
                                decorationColor: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Shared widgets ────────────────────────────────────────────────────────────

Widget _label(String text) => Text(
  text,
  style: GoogleFonts.getFont(
    'Google Sans',
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: AppColors.foreground,
  ),
);

Widget _input({
  required TextEditingController controller,
  required String hint,
  required IconData icon,
  TextInputType? keyboardType,
  bool obscure = false,
  Widget? suffix,
  String? Function(String?)? validator,
}) {
  return TextFormField(
    controller: controller,
    keyboardType: keyboardType,
    obscureText: obscure,
    validator: validator,
    style: GoogleFonts.getFont(
      'Google Sans',
      fontSize: 14,
      color: AppColors.foreground,
    ),
    decoration: InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.getFont(
        'Google Sans',
        color: AppColors.mutedFg,
        fontSize: 14,
      ),
      prefixIcon: Icon(icon, color: AppColors.mutedFg, size: 17),
      suffixIcon: suffix != null
          ? Padding(padding: const EdgeInsets.only(right: 10), child: suffix)
          : null,
      suffixIconConstraints: const BoxConstraints(minWidth: 0, minHeight: 0),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 13),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.ring, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.destructive),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.destructive, width: 1.5),
      ),
      errorStyle: GoogleFonts.getFont(
        'Google Sans',
        fontSize: 11,
        color: AppColors.destructive,
      ),
    ),
  );
}

Widget _primaryButton({
  required String label,
  required bool loading,
  required VoidCallback onTap,
}) {
  return SizedBox(
    width: double.infinity,
    height: 40,
    child: ElevatedButton(
      onPressed: loading ? null : onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        disabledBackgroundColor: AppColors.primary.withValues(alpha: 0.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        elevation: 0,
      ),
      child: loading
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Text(
              label,
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.white,
              ),
            ),
    ),
  );
}

Widget _googleButton(String label, {required VoidCallback onTap}) {
  return SizedBox(
    width: double.infinity,
    height: 40,
    child: OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        backgroundColor: Colors.white,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CustomPaint(painter: _GooglePainter(), size: const Size(16, 16)),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: AppColors.foreground,
            ),
          ),
        ],
      ),
    ),
  );
}

Widget _divider(String text) {
  return Row(
    children: [
      const Expanded(child: Divider(color: AppColors.border)),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Text(
          text,
          style: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 11,
            color: AppColors.mutedFg,
          ),
        ),
      ),
      const Expanded(child: Divider(color: AppColors.border)),
    ],
  );
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size s) {
    final p = Paint()..style = PaintingStyle.fill;
    final c = Offset(s.width / 2, s.height / 2);
    final r = s.width / 2;
    p.color = const Color(0xFFEA4335);
    canvas.drawArc(Rect.fromCircle(center: c, radius: r), -1.57, 1.57, true, p);
    p.color = const Color(0xFFFBBC05);
    canvas.drawArc(Rect.fromCircle(center: c, radius: r), 1.57, 1.57, true, p);
    p.color = const Color(0xFF34A853);
    canvas.drawArc(Rect.fromCircle(center: c, radius: r), 3.14, 1.57, true, p);
    p.color = const Color(0xFF4285F4);
    canvas.drawArc(Rect.fromCircle(center: c, radius: r), -3.14, 1.57, true, p);
    p.color = Colors.white;
    canvas.drawCircle(c, r * 0.52, p);
    p.color = const Color(0xFF4285F4);
    canvas.drawRect(
      Rect.fromLTWH(c.dx, c.dy - r * 0.18, r * 0.95, r * 0.36),
      p,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter o) => false;
}

String _errorMessageFromApi(ApiException e) {
  if (e.statusCode == 0) {
    return 'Cannot connect to backend (${ApiClient.instance.baseUrl}). '
        'Check backend server and API_BASE_URL.';
  }
  if (e.data is Map && (e.data as Map)['errors'] is Map) {
    final errors = (e.data as Map)['errors'] as Map;
    final first = errors.values.isNotEmpty ? errors.values.first : null;
    if (first is List && first.isNotEmpty) {
      return first.first.toString();
    }
  }
  return e.message;
}
