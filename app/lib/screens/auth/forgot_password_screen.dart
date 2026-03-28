import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/colors.dart';
import '../../services/api_client.dart';
import '../../services/app_api.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
      _success = null;
    });
    try {
      await AppApi.instance.forgotPassword(_emailCtrl.text);
      setState(() {
        _success = "If this email is registered, a reset link has been sent.";
      });
    } on ApiException catch (e) {
      setState(() => _error = _apiErrorMessage(e));
    } catch (_) {
      setState(() => _error = 'Unable to send reset link right now.');
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
                    // Back button
                    GestureDetector(
                      onTap: () => context.go('/auth/login'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.arrow_back,
                            size: 16,
                            color: AppColors.mutedFg,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Back to sign in',
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 13,
                              color: AppColors.mutedFg,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    Text(
                      'Forgot password?',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Enter your email and we'll send you a reset link",
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.mutedFg,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Error
                    if (_error != null) ...[
                      _banner(text: _error!, isError: true),
                      const SizedBox(height: 16),
                    ],

                    // Success
                    if (_success != null) ...[
                      _banner(text: _success!, isError: false),
                      const SizedBox(height: 16),
                    ],

                    // Email
                    Text(
                      'Email',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.foreground,
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Email is required';
                        }
                        if (!v.contains('@')) {
                          return 'Enter a valid email address';
                        }
                        return null;
                      },
                      decoration: _inputDecoration(
                        hint: 'you@example.com',
                        icon: Icons.mail_outline,
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Submit
                    SizedBox(
                      width: double.infinity,
                      height: 40,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          disabledBackgroundColor: AppColors.primary.withValues(
                            alpha: 0.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ),
                        child: _loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                'Send reset link',
                                style: GoogleFonts.getFont(
                                  'Google Sans',
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.white,
                                ),
                              ),
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

// ── Reset Password Screen ─────────────────────────────────────────────────────
class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});
  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _tokenCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _showPassword = false;
  bool _showConfirm = false;
  bool _loading = false;
  String? _error;
  String? _success;

  @override
  void dispose() {
    _tokenCtrl.dispose();
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
      _success = null;
    });
    try {
      await AppApi.instance.resetPassword(
        token: _tokenCtrl.text.trim(),
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
      );
      setState(() => _success = "Password updated. Redirecting to sign in...");
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) context.go('/auth/login');
    } on ApiException catch (e) {
      setState(() => _error = _apiErrorMessage(e));
    } catch (_) {
      setState(() => _error = 'Unable to reset password right now.');
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
                    // Back button
                    GestureDetector(
                      onTap: () => context.go('/auth/login'),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.arrow_back,
                            size: 16,
                            color: AppColors.mutedFg,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Back to sign in',
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 13,
                              color: AppColors.mutedFg,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    Text(
                      'Set new password',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Choose a strong password for your account',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.mutedFg,
                      ),
                    ),

                    const SizedBox(height: 24),

                    if (_error != null) ...[
                      _banner(text: _error!, isError: true),
                      const SizedBox(height: 16),
                    ],
                    if (_success != null) ...[
                      _banner(text: _success!, isError: false),
                      const SizedBox(height: 16),
                    ],

                    // Token
                    Text(
                      'Reset Token',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _tokenCtrl,
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.foreground,
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty)
                          ? 'Token is required'
                          : null,
                      decoration: _inputDecoration(
                        hint: 'Paste reset token',
                        icon: Icons.vpn_key_outlined,
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Email
                    Text(
                      'Email',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.foreground,
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Email is required';
                        }
                        if (!v.contains('@')) {
                          return 'Enter a valid email address';
                        }
                        return null;
                      },
                      decoration: _inputDecoration(
                        hint: 'you@example.com',
                        icon: Icons.mail_outline,
                      ),
                    ),

                    const SizedBox(height: 14),

                    // New password
                    Text(
                      'New password',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _passwordCtrl,
                      obscureText: !_showPassword,
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.foreground,
                      ),
                      validator: (v) => (v == null || v.length < 8)
                          ? 'Min 8 characters'
                          : null,
                      decoration: _inputDecoration(
                        hint: '••••••••',
                        icon: Icons.lock_outline,
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
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Confirm password
                    Text(
                      'Confirm new password',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: AppColors.foreground,
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _confirmCtrl,
                      obscureText: !_showConfirm,
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 14,
                        color: AppColors.foreground,
                      ),
                      validator: (v) => v != _passwordCtrl.text
                          ? 'Passwords do not match'
                          : null,
                      decoration: _inputDecoration(
                        hint: '••••••••',
                        icon: Icons.lock_outline,
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
                      ),
                    ),

                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 40,
                      child: ElevatedButton(
                        onPressed: _loading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          disabledBackgroundColor: AppColors.primary.withValues(
                            alpha: 0.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ),
                        child: _loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                'Update password',
                                style: GoogleFonts.getFont(
                                  'Google Sans',
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.white,
                                ),
                              ),
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

// ── Shared helpers ────────────────────────────────────────────────────────────
Widget _banner({required String text, required bool isError}) {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    decoration: BoxDecoration(
      color: isError ? AppColors.destructiveFg : const Color(0xFFECFDF5),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(
        color: isError
            ? AppColors.destructive.withValues(alpha: 0.3)
            : const Color(0xFF10B981).withValues(alpha: 0.4),
      ),
    ),
    child: Text(
      text,
      style: GoogleFonts.getFont(
        'Google Sans',
        fontSize: 13,
        color: isError ? AppColors.destructive : const Color(0xFF065F46),
      ),
    ),
  );
}

InputDecoration _inputDecoration({
  required String hint,
  required IconData icon,
  Widget? suffix,
}) {
  return InputDecoration(
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
  );
}

String _apiErrorMessage(ApiException e) {
  if (e.data is Map && (e.data as Map)['errors'] is Map) {
    final errors = (e.data as Map)['errors'] as Map;
    final first = errors.values.isNotEmpty ? errors.values.first : null;
    if (first is List && first.isNotEmpty) {
      return first.first.toString();
    }
  }
  return e.message;
}
