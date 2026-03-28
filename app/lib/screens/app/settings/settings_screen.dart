import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../services/app_api.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../app_shell.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _countryCtrl = TextEditingController();
  final _currencyCtrl = TextEditingController();
  final _timezoneCtrl = TextEditingController();
  final _taxCtrl = TextEditingController();
  final _serviceCtrl = TextEditingController();

  bool _loading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _countryCtrl.dispose();
    _currencyCtrl.dispose();
    _timezoneCtrl.dispose();
    _taxCtrl.dispose();
    _serviceCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    setState(() => _loading = true);
    try {
      final settings = asMap(await ApiClient.instance.get('/settings'));
      if (!mounted) return;
      _nameCtrl.text = asString(settings['name']);
      _emailCtrl.text = asString(settings['email']);
      _phoneCtrl.text = asString(settings['phone']);
      _addressCtrl.text = asString(settings['address']);
      _cityCtrl.text = asString(settings['city']);
      _countryCtrl.text = asString(settings['country']);
      _currencyCtrl.text = asString(settings['currency']);
      _timezoneCtrl.text = asString(settings['timezone']);
      _taxCtrl.text = asDouble(settings['tax_rate']).toString();
      _serviceCtrl.text = asDouble(settings['service_charge']).toString();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load settings'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ApiClient.instance.patch(
        '/settings',
        body: {
          'name': _nameCtrl.text.trim(),
          'email': _emailCtrl.text.trim().isEmpty
              ? null
              : _emailCtrl.text.trim(),
          'phone': _phoneCtrl.text.trim().isEmpty
              ? null
              : _phoneCtrl.text.trim(),
          'address': _addressCtrl.text.trim().isEmpty
              ? null
              : _addressCtrl.text.trim(),
          'city': _cityCtrl.text.trim().isEmpty ? null : _cityCtrl.text.trim(),
          'country': _countryCtrl.text.trim().isEmpty
              ? null
              : _countryCtrl.text.trim(),
          'currency': _currencyCtrl.text.trim().isEmpty
              ? null
              : _currencyCtrl.text.trim(),
          'timezone': _timezoneCtrl.text.trim().isEmpty
              ? null
              : _timezoneCtrl.text.trim(),
          'tax_rate': double.tryParse(_taxCtrl.text.trim()),
          'service_charge': double.tryParse(_serviceCtrl.text.trim()),
        },
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Settings saved')));
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to save settings'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _logout() async {
    await AppApi.instance.logout();
    if (!mounted) return;
    context.go('/auth/login');
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Settings',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Configure your restaurant',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 20),
          if (_loading)
            const CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.primary,
            )
          else
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  _field('Restaurant Name', _nameCtrl),
                  _field('Email', _emailCtrl),
                  _field('Phone', _phoneCtrl),
                  _field('Address', _addressCtrl),
                  _field('City', _cityCtrl),
                  _field('Country', _countryCtrl),
                  _field('Currency', _currencyCtrl),
                  _field('Timezone', _timezoneCtrl),
                  _field('Tax Rate', _taxCtrl),
                  _field('Service Charge', _serviceCtrl),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: _saving ? null : _save,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: Text(_saving ? 'Saving...' : 'Save'),
                      ),
                      const SizedBox(width: 12),
                      OutlinedButton(
                        onPressed: _loadSettings,
                        child: const Text('Reload'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          const SizedBox(height: 20),
          InkWell(
            onTap: _logout,
            borderRadius: BorderRadius.circular(10),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.logout,
                    size: 20,
                    color: AppColors.destructive,
                  ),
                  const SizedBox(width: 14),
                  Text(
                    'Sign Out',
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppColors.destructive,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _field(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        style: GoogleFonts.getFont(
          'Google Sans',
          fontSize: 14,
          color: AppColors.foreground,
        ),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 12,
            color: AppColors.mutedFg,
          ),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.border),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: AppColors.ring),
          ),
        ),
      ),
    );
  }
}
