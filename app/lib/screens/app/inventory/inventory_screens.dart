import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../services/api_client.dart';
import '../../../theme/colors.dart';
import '../../../utils/api_error.dart';
import '../../../widgets/app_list_screen.dart';
import '../app_shell.dart';

class InventoryDashboardScreen extends StatefulWidget {
  const InventoryDashboardScreen({super.key});

  @override
  State<InventoryDashboardScreen> createState() =>
      _InventoryDashboardScreenState();
}

class _InventoryDashboardScreenState extends State<InventoryDashboardScreen> {
  bool _loading = false;
  Map<String, dynamic> _summary = const {};
  List<Map<String, dynamic>> _lowStock = const [];
  List<Map<String, dynamic>> _recent = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final payload = asMap(
        await ApiClient.instance.get('/inventory/dashboard'),
      );
      if (!mounted) return;
      setState(() {
        _summary = {
          'total_items': asInt(payload['total_items']),
          'low_stock_count': asInt(payload['low_stock_count']),
          'pending_purchase_orders': asInt(payload['pending_purchase_orders']),
        };
        _lowStock = extractDataList(payload['low_stock_items']);
        _recent = extractDataList(payload['recent_movements']);
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(
              error,
              fallback: 'Failed to load inventory dashboard',
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Inventory Dashboard',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: AppColors.foreground,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Inventory summary and alerts',
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 13,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 20),
          if (_loading)
            const Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppColors.primary,
              ),
            )
          else ...[
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                _summaryCard(
                  'Total Items',
                  '${asInt(_summary['total_items'])}',
                ),
                _summaryCard(
                  'Low Stock',
                  '${asInt(_summary['low_stock_count'])}',
                ),
                _summaryCard(
                  'Pending PO',
                  '${asInt(_summary['pending_purchase_orders'])}',
                ),
              ],
            ),
            const SizedBox(height: 16),
            AppListScreen(
              title: 'Low Stock Items',
              description: 'Items below reorder level',
              rows: _lowStock
                  .map(
                    (row) => {
                      'name': asString(row['name']),
                      'sku': asString(row['sku']),
                      'reorder': asDouble(
                        row['reorder_level'],
                      ).toStringAsFixed(2),
                      'qty': asDouble(
                        asMap(row['stock'])['quantity'],
                      ).toStringAsFixed(2),
                    },
                  )
                  .toList(),
              searchKey: 'name',
              columns: const [
                ColDef(key: 'name', label: 'Item'),
                ColDef(key: 'sku', label: 'SKU'),
                ColDef(key: 'qty', label: 'Current Qty'),
                ColDef(key: 'reorder', label: 'Reorder Level'),
              ],
            ),
            const SizedBox(height: 16),
            AppListScreen(
              title: 'Recent Movements',
              description: 'Latest stock movements',
              rows: _recent
                  .map(
                    (row) => {
                      'item': asString(asMap(row['item'])['name']),
                      'type': asString(row['type']),
                      'qty': asDouble(row['quantity']).toStringAsFixed(2),
                      'date': asString(row['created_at']).split('T').first,
                    },
                  )
                  .toList(),
              searchKey: 'item',
              columns: const [
                ColDef(key: 'item', label: 'Item'),
                ColDef(key: 'type', label: 'Type'),
                ColDef(key: 'qty', label: 'Qty'),
                ColDef(key: 'date', label: 'Date'),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _summaryCard(String label, String value) {
    return Container(
      width: 160,
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
            label,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 11,
              color: AppColors.mutedFg,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.getFont(
              'Google Sans',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class InventoryCategoriesScreen extends StatelessWidget {
  const InventoryCategoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Inventory Categories',
      description: 'Inventory item categories',
      endpoint: '/inventory/categories',
      searchKey: 'name',
      columns: const [
        ColDef(key: 'name', label: 'Name'),
        ColDef(key: 'description', label: 'Description'),
        ColDef(key: 'status', label: 'Status'),
      ],
      rowMapper: (row) => {
        'name': asString(row['name']),
        'description': asString(row['description']),
        'status': asBool(row['is_active'], fallback: true)
            ? 'Active'
            : 'Inactive',
      },
    );
  }
}

class InventoryUnitsScreen extends StatelessWidget {
  const InventoryUnitsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Inventory Units',
      description: 'Measurement units',
      endpoint: '/inventory/units',
      searchKey: 'name',
      columns: const [
        ColDef(key: 'name', label: 'Name'),
        ColDef(key: 'abbreviation', label: 'Abbreviation'),
      ],
      rowMapper: (row) => {
        'name': asString(row['name']),
        'abbreviation': asString(row['abbreviation']),
      },
    );
  }
}

class InventoryItemsScreen extends StatelessWidget {
  const InventoryItemsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Inventory Items',
      description: 'All inventory products',
      endpoint: '/inventory/items',
      searchKey: 'name',
      columns: const [
        ColDef(key: 'name', label: 'Item'),
        ColDef(key: 'sku', label: 'SKU'),
        ColDef(key: 'category', label: 'Category'),
        ColDef(key: 'unit', label: 'Unit'),
        ColDef(key: 'stock', label: 'Stock'),
      ],
      rowMapper: (row) => {
        'name': asString(row['name']),
        'sku': asString(row['sku']),
        'category': asString(asMap(row['category'])['name']),
        'unit': asString(asMap(row['unit'])['abbreviation']),
        'stock': asDouble(asMap(row['stock'])['quantity']).toStringAsFixed(2),
      },
    );
  }
}

class InventoryStocksScreen extends StatelessWidget {
  const InventoryStocksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Inventory Stocks',
      description: 'Current stock balances',
      endpoint: '/inventory/stocks',
      searchKey: 'item',
      columns: const [
        ColDef(key: 'item', label: 'Item'),
        ColDef(key: 'category', label: 'Category'),
        ColDef(key: 'unit', label: 'Unit'),
        ColDef(key: 'qty', label: 'Quantity'),
      ],
      rowMapper: (row) => {
        'item': asString(asMap(row['item'])['name']),
        'category': asString(asMap(asMap(row['item'])['category'])['name']),
        'unit': asString(asMap(asMap(row['item'])['unit'])['abbreviation']),
        'qty': asDouble(row['quantity']).toStringAsFixed(2),
      },
    );
  }
}

class InventoryMovementsScreen extends StatelessWidget {
  const InventoryMovementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Inventory Movements',
      description: 'Purchase, sale and adjustment logs',
      endpoint: '/inventory/movements',
      searchKey: 'item',
      columns: const [
        ColDef(key: 'item', label: 'Item'),
        ColDef(key: 'type', label: 'Type'),
        ColDef(key: 'qty', label: 'Quantity'),
        ColDef(key: 'date', label: 'Date'),
      ],
      rowMapper: (row) => {
        'item': asString(asMap(row['item'])['name']),
        'type': asString(row['type']),
        'qty': asDouble(row['quantity']).toStringAsFixed(2),
        'date': asString(row['created_at']).split('T').first,
      },
    );
  }
}

class InventorySuppliersScreen extends StatelessWidget {
  const InventorySuppliersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Inventory Suppliers',
      description: 'Supplier and vendor list',
      endpoint: '/inventory/suppliers',
      searchKey: 'name',
      columns: const [
        ColDef(key: 'name', label: 'Name'),
        ColDef(key: 'contact', label: 'Contact'),
        ColDef(key: 'phone', label: 'Phone'),
        ColDef(key: 'email', label: 'Email'),
      ],
      rowMapper: (row) => {
        'name': asString(row['name']),
        'contact': asString(row['contact_person']),
        'phone': asString(row['phone']),
        'email': asString(row['email']),
      },
    );
  }
}

class InventoryPurchaseOrdersScreen extends StatelessWidget {
  const InventoryPurchaseOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Purchase Orders',
      description: 'Inventory purchase orders',
      endpoint: '/inventory/purchase-orders',
      searchKey: 'po_number',
      columns: const [
        ColDef(key: 'po_number', label: 'PO Number'),
        ColDef(key: 'supplier', label: 'Supplier'),
        ColDef(key: 'status', label: 'Status'),
        ColDef(key: 'total', label: 'Total'),
      ],
      rowMapper: (row) => {
        'po_number': asString(row['po_number']),
        'supplier': asString(asMap(row['supplier'])['name']),
        'status': asString(row['status']),
        'total': asDouble(row['total']).toStringAsFixed(2),
      },
    );
  }
}

class InventoryRecipesScreen extends StatelessWidget {
  const InventoryRecipesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Inventory Recipes',
      description: 'Recipe definitions and ingredients',
      endpoint: '/inventory/recipes',
      searchKey: 'name',
      columns: const [
        ColDef(key: 'name', label: 'Recipe'),
        ColDef(key: 'menu_item', label: 'Menu Item'),
        ColDef(key: 'yield', label: 'Yield'),
        ColDef(key: 'ingredients', label: 'Ingredients'),
      ],
      rowMapper: (row) => {
        'name': asString(row['name']),
        'menu_item': asString(asMap(row['menu_item'])['name']),
        'yield': asDouble(row['yield_quantity']).toStringAsFixed(2),
        'ingredients': '${extractDataList(row['ingredients']).length}',
      },
    );
  }
}

class InventoryBatchInventoryScreen extends StatelessWidget {
  const InventoryBatchInventoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Batch Inventory',
      description: 'Batch production, waste and adjustments',
      endpoint: '/inventory/batch-inventory',
      searchKey: 'batch_number',
      columns: const [
        ColDef(key: 'batch_number', label: 'Batch Number'),
        ColDef(key: 'type', label: 'Type'),
        ColDef(key: 'status', label: 'Status'),
        ColDef(key: 'items', label: 'Items'),
      ],
      rowMapper: (row) => {
        'batch_number': asString(row['batch_number']),
        'type': asString(row['type']),
        'status': asString(row['status']),
        'items': '${extractDataList(row['items']).length}',
      },
    );
  }
}

class InventoryBatchReportsScreen extends StatelessWidget {
  const InventoryBatchReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _EndpointListScreen(
      title: 'Batch Reports',
      description: 'Completed batch inventory reports',
      endpoint: '/inventory/batch-reports',
      searchKey: 'batch_number',
      columns: const [
        ColDef(key: 'batch_number', label: 'Batch Number'),
        ColDef(key: 'type', label: 'Type'),
        ColDef(key: 'status', label: 'Status'),
        ColDef(key: 'processed_at', label: 'Processed At'),
      ],
      rowMapper: (row) => {
        'batch_number': asString(row['batch_number']),
        'type': asString(row['type']),
        'status': asString(row['status']),
        'processed_at': asString(row['processed_at']).split('T').first,
      },
    );
  }
}

class _EndpointListScreen extends StatefulWidget {
  final String title;
  final String description;
  final String endpoint;
  final String searchKey;
  final List<ColDef> columns;
  final Map<String, dynamic> Function(Map<String, dynamic>) rowMapper;

  const _EndpointListScreen({
    required this.title,
    required this.description,
    required this.endpoint,
    required this.searchKey,
    required this.columns,
    required this.rowMapper,
  });

  @override
  State<_EndpointListScreen> createState() => _EndpointListScreenState();
}

class _EndpointListScreenState extends State<_EndpointListScreen> {
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
          ..addAll(rows.map(widget.rowMapper));
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            apiErrorMessage(error, fallback: 'Failed to load ${widget.title}'),
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
