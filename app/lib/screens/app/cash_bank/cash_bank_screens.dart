import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class CashAccountScreen extends StatefulWidget {
  const CashAccountScreen({super.key});

  @override
  State<CashAccountScreen> createState() => _CashAccountScreenState();
}

class _CashAccountScreenState extends State<CashAccountScreen> {
  bool _loading = false;
  double _balance = 0;
  List<Map<String, dynamic>> _entries = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final payload = asMap(await ApiClient.instance.get('/cash-account'));
      if (!mounted) return;
      setState(() {
        _balance = asDouble(payload['balance']);
        _entries = extractDataList(payload['entries'])
            .map(
              (row) => {
                'date': asString(row['date']),
                'particulars': asString(row['particulars']),
                'txn': asString(row['txn']),
                'cash_in': asDouble(row['cash_in']).toStringAsFixed(2),
                'cash_out': asDouble(row['cash_out']).toStringAsFixed(2),
                'balance': asDouble(row['balance']).toStringAsFixed(2),
              },
            )
            .toList();
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load cash account'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Cash Account',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Cash ledger and running balance',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: 220,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Current Balance',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 11,
                    color: AppColors.mutedFg,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Rs. ${_balance.toStringAsFixed(2)}',
                  style: GoogleFonts.getFont(
                    'Google Sans',
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.foreground,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          AppListScreen(
            title: 'Cash Ledger',
            description: 'Latest cash transactions',
            rows: _entries,
            loading: _loading,
            searchKey: 'particulars',
            columns: const [
              ColDef(key: 'date', label: 'Date'),
              ColDef(key: 'particulars', label: 'Particulars'),
              ColDef(key: 'txn', label: 'Txn'),
              ColDef(key: 'cash_in', label: 'Cash In'),
              ColDef(key: 'cash_out', label: 'Cash Out'),
              ColDef(key: 'balance', label: 'Balance'),
            ],
          ),
        ],
      ),
    );
  }
}

class BankAccountsScreen extends StatelessWidget {
  const BankAccountsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ListEndpointScreen(
      title: 'Bank Accounts',
      description: 'Linked business bank accounts',
      endpoint: '/bank-accounts',
      searchKey: 'bank_name',
      columns: const [
        ColDef(key: 'bank_name', label: 'Bank'),
        ColDef(key: 'account_name', label: 'Account Name'),
        ColDef(key: 'account_number', label: 'Account Number'),
        ColDef(key: 'current_balance', label: 'Current Balance'),
      ],
      mapper: (row) => {
        'bank_name': asString(row['bank_name']),
        'account_name': asString(row['account_name']),
        'account_number': asString(row['account_number']),
        'current_balance': asDouble(row['current_balance']).toStringAsFixed(2),
      },
    );
  }
}

class ChequeBooksScreen extends StatelessWidget {
  const ChequeBooksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ListEndpointScreen(
      title: 'Cheque Books',
      description: 'Issued cheque series by bank',
      endpoint: '/cheque-books',
      searchKey: 'bank_name',
      columns: const [
        ColDef(key: 'bank_name', label: 'Bank'),
        ColDef(key: 'series', label: 'Series'),
        ColDef(key: 'total_cheques', label: 'Total'),
        ColDef(key: 'unassigned_count', label: 'Unassigned'),
      ],
      mapper: (row) => {
        'bank_name': asString(row['bank_name']),
        'series': asString(row['series']),
        'total_cheques': asInt(row['total_cheques']).toString(),
        'unassigned_count': asInt(row['unassigned_count']).toString(),
      },
    );
  }
}

class ChequesScreen extends StatelessWidget {
  const ChequesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _ListEndpointScreen(
      title: 'Cheques',
      description: 'Cheque register and statuses',
      endpoint: '/cheques',
      searchKey: 'cheque_no',
      columns: const [
        ColDef(key: 'cheque_no', label: 'Cheque No'),
        ColDef(key: 'bank_name', label: 'Bank'),
        ColDef(key: 'party_name', label: 'Party'),
        ColDef(key: 'amount', label: 'Amount'),
        ColDef(key: 'status', label: 'Status'),
      ],
      mapper: (row) => {
        'cheque_no': asString(row['cheque_no']),
        'bank_name': asString(row['bank_name']),
        'party_name': asString(row['party_name']),
        'amount': asDouble(row['amount']).toStringAsFixed(2),
        'status': asString(row['status']),
      },
    );
  }
}

class ChequesManagementScreen extends StatelessWidget {
  const ChequesManagementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Cheques Management',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Manage cheque books and cheque entries in one place.',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _QuickNavCard(
                title: 'Cheque Books',
                description: 'View and manage cheque book series',
                onTap: () => context.go('/app/cash-bank/cheque-books'),
              ),
              _QuickNavCard(
                title: 'Cheques',
                description: 'Track cheque numbers and statuses',
                onTap: () => context.go('/app/cash-bank/cheques'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class BalanceTransferScreen extends StatelessWidget {
  const BalanceTransferScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Balance Transfer',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Transfer between cash and bank accounts.',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border),
            ),
            child: Text(
              'Balance transfer endpoint is not available in backend routes yet. Add API route, then this screen can be connected.',
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 13,
                color: AppColors.mutedFg,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickNavCard extends StatelessWidget {
  final String title;
  final String description;
  final VoidCallback onTap;

  const _QuickNavCard({
    required this.title,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 280,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppColors.foreground,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              description,
              style: GoogleFonts.getFont(
                'Google Sans',
                fontSize: 12,
                color: AppColors.mutedFg,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ListEndpointScreen extends StatefulWidget {
  final String title;
  final String description;
  final String endpoint;
  final String searchKey;
  final List<ColDef> columns;
  final Map<String, dynamic> Function(Map<String, dynamic>) mapper;

  const _ListEndpointScreen({
    required this.title,
    required this.description,
    required this.endpoint,
    required this.searchKey,
    required this.columns,
    required this.mapper,
  });

  @override
  State<_ListEndpointScreen> createState() => _ListEndpointScreenState();
}

class _ListEndpointScreenState extends State<_ListEndpointScreen> {
  final List<Map<String, dynamic>> _rows = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final payload = await ApiClient.instance.get(widget.endpoint);
      final rows = extractDataList(payload);
      if (!mounted) return;
      setState(() {
        _rows
          ..clear()
          ..addAll(rows.map(widget.mapper));
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(
              error,
              fallback: 'Failed to load ${widget.title.toLowerCase()}',
            ),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppShell(
      child: AppListScreen(
        title: widget.title,
        description: widget.description,
        rows: _rows,
        loading: _loading,
        searchKey: widget.searchKey,
        columns: widget.columns,
      ),
    );
  }
}
