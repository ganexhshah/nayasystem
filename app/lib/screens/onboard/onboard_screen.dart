import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme/colors.dart';

class OnboardScreen extends StatefulWidget {
  const OnboardScreen({super.key});
  @override
  State<OnboardScreen> createState() => _OnboardScreenState();
}

class _OnboardScreenState extends State<OnboardScreen> {
  static const int _total = 4;
  int _step = 0;

  final _nameCtrl = TextEditingController();
  final _slugCtrl = TextEditingController();
  bool _slugEdited = false;
  File? _logoFile;
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _indoorCtrl = TextEditingController();
  final _tablesCtrl = TextEditingController();
  final _cuisineCtrl = TextEditingController();
  final _hoursCtrl = TextEditingController();
  final _staffCtrl = TextEditingController();

  bool _saving = false;
  bool _done = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _slugCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _indoorCtrl.dispose();
    _tablesCtrl.dispose();
    _cuisineCtrl.dispose();
    _hoursCtrl.dispose();
    _staffCtrl.dispose();
    super.dispose();
  }

  String _toSlug(String s) => s
      .toLowerCase()
      .trim()
      .replaceAll(RegExp(r'[^a-z0-9\s-]'), '')
      .replaceAll(RegExp(r'\s+'), '-')
      .replaceAll(RegExp(r'-+'), '-');

  bool get _canNext => _step == 0 ? _nameCtrl.text.trim().length >= 2 : true;

  Future<void> _pickLogo() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
    );
    if (picked != null) setState(() => _logoFile = File(picked.path));
  }

  Future<void> _finish() async {
    setState(() => _saving = true);
    await Future.delayed(const Duration(milliseconds: 800));
    setState(() {
      _saving = false;
      _done = true;
    });
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) context.go('/auth/login');
  }

  @override
  Widget build(BuildContext context) {
    if (_done) return _SuccessScreen(name: _nameCtrl.text);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  if (_step > 0)
                    GestureDetector(
                      onTap: () => setState(() => _step--),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          color: AppColors.muted,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: const Icon(
                          Icons.arrow_back_ios_new,
                          color: AppColors.foreground,
                          size: 13,
                        ),
                      ),
                    )
                  else
                    const SizedBox(width: 34),
                  const Spacer(),
                  // Step dots
                  Row(
                    children: List.generate(
                      _total,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.only(left: 4),
                        width: i == _step ? 18 : 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: i <= _step
                              ? AppColors.primary
                              : AppColors.border,
                          borderRadius: BorderRadius.circular(3),
                        ),
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${_step + 1} of $_total',
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 12,
                      color: AppColors.mutedFg,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // ── Step heading ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _stepTitle,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _stepSubtitle,
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 13,
                      color: AppColors.mutedFg,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Content ──────────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: _buildContent(),
              ),
            ),

            // ── Bottom buttons ────────────────────────────────────────
            Container(
              padding: const EdgeInsets.fromLTRB(24, 12, 24, 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: Row(
                children: [
                  if (_step > 0) ...[
                    Expanded(
                      child: SizedBox(
                        height: 40,
                        child: OutlinedButton(
                          onPressed: () => _step == _total - 1
                              ? _finish()
                              : setState(() => _step++),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: Text(
                            'Skip',
                            style: GoogleFonts.getFont(
                              'Google Sans',
                              fontSize: 13,
                              color: AppColors.mutedFg,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Expanded(
                    flex: 2,
                    child: SizedBox(
                      height: 40,
                      child: ElevatedButton(
                        onPressed: (_canNext && !_saving)
                            ? () => _step < _total - 1
                                  ? setState(() => _step++)
                                  : _finish()
                            : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          disabledBackgroundColor: AppColors.primary.withValues(
                            alpha: 0.4,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ),
                        child: _saving
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(
                                _step < _total - 1 ? 'Continue' : 'Finish',
                                style: GoogleFonts.getFont(
                                  'Google Sans',
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.white,
                                ),
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    switch (_step) {
      case 0:
        return _StepName(
          nameCtrl: _nameCtrl,
          slugCtrl: _slugCtrl,
          slugEdited: _slugEdited,
          onNameChanged: (v) {
            if (!_slugEdited) _slugCtrl.text = _toSlug(v);
            setState(() {});
          },
          onSlugChanged: (_) => setState(() => _slugEdited = true),
        );
      case 1:
        return _StepLogo(
          logoFile: _logoFile,
          onPick: _pickLogo,
          onRemove: () => setState(() => _logoFile = null),
        );
      case 2:
        return _StepContact(
          phoneCtrl: _phoneCtrl,
          emailCtrl: _emailCtrl,
          addressCtrl: _addressCtrl,
          cityCtrl: _cityCtrl,
        );
      case 3:
        return _StepCapacity(
          indoorCtrl: _indoorCtrl,
          tablesCtrl: _tablesCtrl,
          cuisineCtrl: _cuisineCtrl,
          hoursCtrl: _hoursCtrl,
          staffCtrl: _staffCtrl,
        );
      default:
        return const SizedBox();
    }
  }

  String get _stepTitle => const [
    'Restaurant Name',
    'Brand Logo',
    'Contact & Location',
    'Capacity & Staff',
  ][_step];
  String get _stepSubtitle => const [
    "What's your restaurant called?",
    'Add your brand identity',
    'How can customers reach you?',
    'Set up seating and team size',
  ][_step];
}

// ── Shared field ──────────────────────────────────────────────────────────────
Widget _field({
  required TextEditingController ctrl,
  required String label,
  required String hint,
  required IconData icon,
  TextInputType? type,
  bool obscure = false,
  String? Function(String?)? validator,
  void Function(String)? onChanged,
}) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        label,
        style: GoogleFonts.getFont(
          'Google Sans',
          fontSize: 13,
          fontWeight: FontWeight.w500,
          color: AppColors.foreground,
        ),
      ),
      const SizedBox(height: 6),
      TextFormField(
        controller: ctrl,
        keyboardType: type,
        obscureText: obscure,
        onChanged: onChanged,
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
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 13,
          ),
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
            borderSide: const BorderSide(
              color: AppColors.destructive,
              width: 1.5,
            ),
          ),
          errorStyle: GoogleFonts.getFont(
            'Google Sans',
            fontSize: 11,
            color: AppColors.destructive,
          ),
        ),
      ),
    ],
  );
}

// ── Step 0 ────────────────────────────────────────────────────────────────────
class _StepName extends StatelessWidget {
  final TextEditingController nameCtrl, slugCtrl;
  final bool slugEdited;
  final ValueChanged<String> onNameChanged, onSlugChanged;
  const _StepName({
    required this.nameCtrl,
    required this.slugCtrl,
    required this.slugEdited,
    required this.onNameChanged,
    required this.onSlugChanged,
  });

  @override
  Widget build(BuildContext context) => Column(
    children: [
      _field(
        ctrl: nameCtrl,
        label: 'Restaurant Name *',
        hint: 'e.g. The Golden Fork',
        icon: Icons.business_outlined,
        onChanged: onNameChanged,
        validator: (v) =>
            (v == null || v.trim().length < 2) ? 'Name is required' : null,
      ),
      const SizedBox(height: 14),
      _field(
        ctrl: slugCtrl,
        label: 'URL Slug (optional)',
        hint: 'the-golden-fork',
        icon: Icons.link_outlined,
        onChanged: onSlugChanged,
      ),
      if (slugCtrl.text.isNotEmpty) ...[
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: AppColors.muted,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.link, color: AppColors.mutedFg, size: 13),
              const SizedBox(width: 6),
              Text(
                '/restaurant/${slugCtrl.text}',
                style: GoogleFonts.robotoMono(
                  fontSize: 11,
                  color: AppColors.mutedFg,
                ),
              ),
            ],
          ),
        ),
      ],
    ],
  );
}

// ── Step 1 ────────────────────────────────────────────────────────────────────
class _StepLogo extends StatelessWidget {
  final File? logoFile;
  final VoidCallback onPick, onRemove;
  const _StepLogo({
    required this.logoFile,
    required this.onPick,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.muted,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            const Icon(Icons.info_outline, color: AppColors.mutedFg, size: 15),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'You can skip and add your logo later from Settings.',
                style: GoogleFonts.getFont(
                  'Google Sans',
                  fontSize: 12,
                  color: AppColors.mutedFg,
                ),
              ),
            ),
          ],
        ),
      ),
      const SizedBox(height: 20),
      if (logoFile != null)
        Center(
          child: Stack(
            alignment: Alignment.topRight,
            children: [
              Container(
                width: 110,
                height: 110,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(11),
                  child: Image.file(logoFile!, fit: BoxFit.cover),
                ),
              ),
              GestureDetector(
                onTap: onRemove,
                child: Container(
                  margin: const EdgeInsets.all(4),
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                    color: AppColors.destructive,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close, color: Colors.white, size: 11),
                ),
              ),
            ],
          ),
        )
      else
        GestureDetector(
          onTap: onPick,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 40),
            decoration: BoxDecoration(
              color: AppColors.muted,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Icon(
                    Icons.upload_outlined,
                    color: AppColors.mutedFg,
                    size: 22,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Click to upload logo',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontWeight: FontWeight.w500,
                    fontSize: 13,
                    color: AppColors.foreground,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'PNG, JPG up to 5MB',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 11,
                    color: AppColors.mutedFg,
                  ),
                ),
              ],
            ),
          ),
        ),
    ],
  );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────
class _StepContact extends StatelessWidget {
  final TextEditingController phoneCtrl, emailCtrl, addressCtrl, cityCtrl;
  const _StepContact({
    required this.phoneCtrl,
    required this.emailCtrl,
    required this.addressCtrl,
    required this.cityCtrl,
  });

  @override
  Widget build(BuildContext context) => Column(
    children: [
      _field(
        ctrl: phoneCtrl,
        label: 'Contact Number',
        hint: '+1 (555) 000-0000',
        icon: Icons.phone_outlined,
        type: TextInputType.phone,
      ),
      const SizedBox(height: 14),
      _field(
        ctrl: emailCtrl,
        label: 'Business Email',
        hint: 'contact@restaurant.com',
        icon: Icons.mail_outline,
        type: TextInputType.emailAddress,
      ),
      const SizedBox(height: 14),
      _field(
        ctrl: addressCtrl,
        label: 'Address',
        hint: '123 Main St',
        icon: Icons.location_on_outlined,
      ),
      const SizedBox(height: 14),
      _field(
        ctrl: cityCtrl,
        label: 'City',
        hint: 'e.g. Kathmandu',
        icon: Icons.location_city_outlined,
      ),
    ],
  );
}

// ── Step 3 ────────────────────────────────────────────────────────────────────
class _StepCapacity extends StatelessWidget {
  final TextEditingController indoorCtrl,
      tablesCtrl,
      cuisineCtrl,
      hoursCtrl,
      staffCtrl;
  const _StepCapacity({
    required this.indoorCtrl,
    required this.tablesCtrl,
    required this.cuisineCtrl,
    required this.hoursCtrl,
    required this.staffCtrl,
  });

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Row(
        children: [
          Expanded(
            child: _field(
              ctrl: indoorCtrl,
              label: 'Indoor Seats',
              hint: '50',
              icon: Icons.chair_outlined,
              type: TextInputType.number,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _field(
              ctrl: tablesCtrl,
              label: 'Tables',
              hint: '15',
              icon: Icons.table_restaurant_outlined,
              type: TextInputType.number,
            ),
          ),
        ],
      ),
      const SizedBox(height: 14),
      _field(
        ctrl: cuisineCtrl,
        label: 'Cuisine Type',
        hint: 'e.g. Italian, Indian',
        icon: Icons.restaurant_outlined,
      ),
      const SizedBox(height: 14),
      _field(
        ctrl: hoursCtrl,
        label: 'Operating Hours',
        hint: 'Mon-Fri 9am-10pm',
        icon: Icons.access_time_outlined,
      ),
      const SizedBox(height: 14),
      _field(
        ctrl: staffCtrl,
        label: 'Total Staff',
        hint: '20',
        icon: Icons.people_outline,
        type: TextInputType.number,
      ),
    ],
  );
}

// ── Success ───────────────────────────────────────────────────────────────────
class _SuccessScreen extends StatelessWidget {
  final String name;
  const _SuccessScreen({required this.name});

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: AppColors.background,
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppColors.muted,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: const Icon(
                Icons.check_rounded,
                color: AppColors.foreground,
                size: 32,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              "You're all set!",
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              name.isNotEmpty
                  ? '$name has been successfully set up.'
                  : 'Your restaurant has been set up.',
              textAlign: TextAlign.center,
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 14,
                color: AppColors.mutedFg,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Redirecting to dashboard...',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 12,
                color: AppColors.mutedFg,
              ),
            ),
            const SizedBox(height: 24),
            const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                color: AppColors.foreground,
                strokeWidth: 1.5,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
