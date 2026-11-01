import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../core/api_client.dart';
import '../core/emb_theme.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final emailCtrl = TextEditingController();
  final passwordCtrl = TextEditingController();
  final tenantCtrl = TextEditingController();
  final apiCtrl = TextEditingController();
  final emailFocus = FocusNode();
  final passwordFocus = FocusNode();

  bool showAdvanced = false;
  bool obscure = true;
  bool loading = false;
  String? error;

  late final AnimationController _enter;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();
    tenantCtrl.text = auth.tenantSubdomain;
    apiCtrl.text = auth.apiUrl;

    _enter = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade = CurvedAnimation(parent: _enter, curve: Curves.easeOutCubic);
    _slide = Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero).animate(
      CurvedAnimation(parent: _enter, curve: Curves.easeOutCubic),
    );
    _enter.forward();
  }

  @override
  void dispose() {
    _enter.dispose();
    emailCtrl.dispose();
    passwordCtrl.dispose();
    tenantCtrl.dispose();
    apiCtrl.dispose();
    emailFocus.dispose();
    passwordFocus.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (emailCtrl.text.trim().isEmpty || passwordCtrl.text.isEmpty) {
      setState(() => error = 'Please enter email and password.');
      return;
    }
    setState(() {
      loading = true;
      error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      if (showAdvanced) {
        await auth.setApiUrl(apiCtrl.text);
        await auth.setTenant(tenantCtrl.text);
      }
      if (kIsWeb) {
        await auth.setApiUrl(ApiClient.liveApiUrl);
      }
      await auth.login(
        emailCtrl.text.trim(),
        passwordCtrl.text,
        tenant: tenantCtrl.text.trim().isEmpty ? null : tenantCtrl.text.trim(),
      );
    } catch (e) {
      var msg = apiErrorMessage(e);
      if (msg.toLowerCase().contains('multiple accounts')) {
        msg =
            'Same email exists on multiple companies. Use API: https://crm.exploremybharat.info/api (Server settings), then try again.';
      } else if (msg.toLowerCase().contains('session expired')) {
        msg = 'Invalid email or password.';
      }
      if (kIsWeb && msg.contains('XMLHttpRequest')) {
        msg = 'Cannot reach API. Check internet / CORS. Try hard refresh.';
      }
      setState(() => error = msg);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final display = GoogleFonts.sora(fontWeight: FontWeight.w700, color: EmbTheme.ink, height: 1.05);
    final body = GoogleFonts.plusJakartaSans(color: EmbTheme.ink, height: 1.35);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: EmbTheme.pageGradient),
        child: Stack(
          children: [
            Positioned(
              top: -80,
              right: -40,
              child: _SoftBlob(size: 220, color: EmbTheme.sky.withValues(alpha: 0.12)),
            ),
            Positioned(
              top: 120,
              left: -60,
              child: _SoftBlob(size: 180, color: EmbTheme.saffron.withValues(alpha: 0.10)),
            ),
            Positioned(
              bottom: -40,
              right: 40,
              child: _SoftBlob(size: 160, color: EmbTheme.teal.withValues(alpha: 0.10)),
            ),
            SafeArea(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(22, 28, 22, 28),
                    child: FadeTransition(
                      opacity: _fade,
                      child: SlideTransition(
                        position: _slide,
                        child: Column(
                          children: [
                            Container(
                              width: 78,
                              height: 78,
                              decoration: BoxDecoration(
                                color: EmbTheme.white,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: EmbTheme.border),
                                boxShadow: [
                                  BoxShadow(
                                    color: EmbTheme.teal.withValues(alpha: 0.12),
                                    blurRadius: 24,
                                    offset: const Offset(0, 10),
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.terrain_rounded, color: EmbTheme.teal, size: 38),
                            ),
                            const SizedBox(height: 18),
                            Text('Explore My Bharat', textAlign: TextAlign.center, style: display.copyWith(fontSize: 34)),
                            const SizedBox(height: 8),
                            Text(
                              'Your travel desk, refined for the road.',
                              textAlign: TextAlign.center,
                              style: body.copyWith(color: EmbTheme.inkSoft, fontSize: 15),
                            ),
                            const SizedBox(height: 28),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.fromLTRB(22, 24, 22, 22),
                              decoration: BoxDecoration(
                                color: EmbTheme.white,
                                borderRadius: BorderRadius.circular(28),
                                border: Border.all(color: EmbTheme.border),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.06),
                                    blurRadius: 28,
                                    offset: const Offset(0, 14),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Text('Welcome back', style: display.copyWith(fontSize: 24, fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Sign in to continue to your CRM workspace',
                                    style: body.copyWith(color: EmbTheme.muted, fontSize: 13.5),
                                  ),
                                  const SizedBox(height: 22),
                                  Text('Email', style: body.copyWith(fontWeight: FontWeight.w600, fontSize: 13)),
                                  const SizedBox(height: 8),
                                  _LightField(
                                    controller: emailCtrl,
                                    focusNode: emailFocus,
                                    hint: 'you@company.com',
                                    prefix: Icons.mail_outline_rounded,
                                    keyboardType: TextInputType.emailAddress,
                                    textInputAction: TextInputAction.next,
                                    onSubmitted: (_) => passwordFocus.requestFocus(),
                                  ),
                                  const SizedBox(height: 14),
                                  Text('Password', style: body.copyWith(fontWeight: FontWeight.w600, fontSize: 13)),
                                  const SizedBox(height: 8),
                                  _LightField(
                                    controller: passwordCtrl,
                                    focusNode: passwordFocus,
                                    hint: 'Enter your password',
                                    prefix: Icons.lock_outline_rounded,
                                    obscure: obscure,
                                    textInputAction: TextInputAction.done,
                                    onSubmitted: (_) => _submit(),
                                    suffix: IconButton(
                                      onPressed: () => setState(() => obscure = !obscure),
                                      icon: Icon(
                                        obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                                        color: EmbTheme.muted,
                                        size: 20,
                                      ),
                                    ),
                                  ),
                                  Align(
                                    alignment: Alignment.centerLeft,
                                    child: TextButton(
                                      onPressed: () => setState(() => showAdvanced = !showAdvanced),
                                      style: TextButton.styleFrom(foregroundColor: EmbTheme.teal),
                                      child: Text(
                                        showAdvanced ? 'Hide server settings' : 'Server settings',
                                        style: body.copyWith(
                                          color: EmbTheme.teal,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                                  ),
                                  if (showAdvanced) ...[
                                    Text('Company subdomain', style: body.copyWith(fontWeight: FontWeight.w600, fontSize: 13)),
                                    const SizedBox(height: 8),
                                    _LightField(
                                      controller: tenantCtrl,
                                      hint: 'optional',
                                      prefix: Icons.apartment_outlined,
                                    ),
                                    if (true) ...[
                                      const SizedBox(height: 14),
                                      Text('API URL', style: body.copyWith(fontWeight: FontWeight.w600, fontSize: 13)),
                                      const SizedBox(height: 8),
                                      _LightField(
                                        controller: apiCtrl,
                                        hint: 'https://…/api',
                                        prefix: Icons.dns_outlined,
                                      ),
                                    ],
                                    const SizedBox(height: 8),
                                  ],
                                  if (error != null) ...[
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(
                                        color: EmbTheme.danger.withValues(alpha: 0.08),
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(color: EmbTheme.danger.withValues(alpha: 0.25)),
                                      ),
                                      child: Text(error!, style: body.copyWith(color: EmbTheme.danger, fontSize: 13)),
                                    ),
                                    const SizedBox(height: 12),
                                  ],
                                  const SizedBox(height: 4),
                                  SizedBox(
                                    height: 54,
                                    child: DecoratedBox(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(16),
                                        gradient: const LinearGradient(
                                          colors: [Color(0xFF17A2A2), EmbTheme.teal, Color(0xFF0A6F6F)],
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: EmbTheme.teal.withValues(alpha: 0.28),
                                            blurRadius: 18,
                                            offset: const Offset(0, 8),
                                          ),
                                        ],
                                      ),
                                      child: Material(
                                        color: Colors.transparent,
                                        child: InkWell(
                                          onTap: loading ? null : _submit,
                                          borderRadius: BorderRadius.circular(16),
                                          child: Center(
                                            child: loading
                                                ? const SizedBox(
                                                    width: 22,
                                                    height: 22,
                                                    child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                                                  )
                                                : Text(
                                                    'Sign In',
                                                    style: GoogleFonts.plusJakartaSans(
                                                      color: Colors.white,
                                                      fontWeight: FontWeight.w700,
                                                      fontSize: 16,
                                                    ),
                                                  ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  Text(
                                    'Secure access · Sales · Operations · Quotes',
                                    textAlign: TextAlign.center,
                                    style: body.copyWith(color: EmbTheme.muted, fontSize: 11.5),
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
            ),
          ],
        ),
      ),
    );
  }
}

class _SoftBlob extends StatelessWidget {
  const _SoftBlob({required this.size, required this.color});
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(shape: BoxShape.circle, color: color),
    );
  }
}

class _LightField extends StatelessWidget {
  const _LightField({
    required this.controller,
    required this.hint,
    required this.prefix,
    this.focusNode,
    this.obscure = false,
    this.keyboardType,
    this.textInputAction,
    this.onSubmitted,
    this.suffix,
  });

  final TextEditingController controller;
  final FocusNode? focusNode;
  final String hint;
  final IconData prefix;
  final bool obscure;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Widget? suffix;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      obscureText: obscure,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      onSubmitted: onSubmitted,
      autocorrect: false,
      style: GoogleFonts.plusJakartaSans(color: EmbTheme.ink, fontSize: 15.5, fontWeight: FontWeight.w500),
      cursorColor: EmbTheme.teal,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.plusJakartaSans(color: EmbTheme.muted.withValues(alpha: 0.8), fontSize: 15),
        prefixIcon: Icon(prefix, color: EmbTheme.inkSoft, size: 20),
        suffixIcon: suffix,
        filled: true,
        fillColor: EmbTheme.cream,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: EmbTheme.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: EmbTheme.teal, width: 1.5),
        ),
      ),
    );
  }
}
