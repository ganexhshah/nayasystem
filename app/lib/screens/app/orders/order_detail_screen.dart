import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../app_shell.dart';

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  bool _loading = false;
  Map<String, dynamic> _order = const {};
  List<Map<String, dynamic>> _items = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final payload = asMap(
        await ApiClient.instance.get('/orders/${widget.orderId}'),
      );
      if (!mounted) return;
      setState(() {
        _order = payload;
        _items = extractDataList(payload['items']);
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load order details'),
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
            'Order Details',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Order #${asString(_order['order_number'], fallback: widget.orderId)}',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 16),
          if (_loading)
            const CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.primary,
            )
          else ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Status: ${asString(_order['status'])}'),
                  Text('Payment: ${asString(_order['payment_status'])}'),
                  Text(
                    'Total: Rs. ${asDouble(_order['total']).toStringAsFixed(2)}',
                  ),
                ],
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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Items',
                    style: GoogleFonts.getFont(
                      'Google Sans',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppColors.foreground,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (_items.isEmpty)
                    Text(
                      'No items',
                      style: GoogleFonts.getFont(
                        'Google Sans',
                        fontSize: 12,
                        color: AppColors.mutedFg,
                      ),
                    )
                  else
                    ..._items.map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          children: [
                            Expanded(child: Text(asString(item['name']))),
                            Text('x${asInt(item['quantity'])}'),
                            const SizedBox(width: 10),
                            Text(
                              'Rs. ${asDouble(item['price']).toStringAsFixed(2)}',
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
