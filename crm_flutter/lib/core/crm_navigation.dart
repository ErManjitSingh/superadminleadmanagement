import 'package:flutter/material.dart';

import '../screens/home_shell.dart';
import 'module_router.dart';

/// Opens a CRM module from menu / dashboard.
///
/// Filtered list screens (leads/quotes/bookings…) always push a fresh page so
/// the filter is applied. Unfiltered shortcuts can switch the bottom tab.
Future<T?> openCrmModule<T>(
  BuildContext context,
  String nativeId, {
  String? filter,
  String? title,
}) {
  final f = (filter ?? '').trim();
  final needsFreshPage = f.isNotEmpty &&
      f != 'all' &&
      const {
        'leads',
        'quotes',
        'ops_bookings',
        'ops_vouchers',
        'reminders',
        'packages',
        'payments',
      }.contains(nativeId);

  if (needsFreshPage) {
    return ModuleRouter.open<T>(context, nativeId, filter: f, title: title);
  }

  final shell = HomeShell.controllerOf(context);
  if (shell != null && shell.openInShell(nativeId, filter: filter, title: title)) {
    return Future<T?>.value(null);
  }
  return ModuleRouter.open<T>(context, nativeId, filter: filter, title: title);
}
