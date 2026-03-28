<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Restaurant;
use App\Models\User;
use App\Models\InventoryUnit;
use App\Models\InventoryCategory;
use App\Models\InventoryItem;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use App\Models\BatchInventory;
use App\Models\BatchInventoryItem;
use App\Models\MenuItem;

class DemoInventorySeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::where('slug', 'khushi-shha-41zP')->firstOrFail();
        $rid = $restaurant->id;
        $user = User::where('restaurant_id', $rid)->first();
        $uid = $user?->id;

        // ── 1. Units ────────────────────────────────────────────────────────
        $unitsData = [
            ['name' => 'Kilogram',   'abbreviation' => 'kg'],
            ['name' => 'Gram',       'abbreviation' => 'g'],
            ['name' => 'Litre',      'abbreviation' => 'L'],
            ['name' => 'Millilitre', 'abbreviation' => 'ml'],
            ['name' => 'Piece',      'abbreviation' => 'pcs'],
            ['name' => 'Dozen',      'abbreviation' => 'doz'],
            ['name' => 'Packet',     'abbreviation' => 'pkt'],
            ['name' => 'Bottle',     'abbreviation' => 'btl'],
        ];
        $units = [];
        foreach ($unitsData as $u) {
            $units[$u['abbreviation']] = InventoryUnit::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $u['name']],
                ['abbreviation' => $u['abbreviation']]
            );
        }

        // ── 2. Inventory Categories ─────────────────────────────────────────
        $catData = [
            ['name' => 'Dairy & Eggs',    'description' => 'Milk, paneer, butter, eggs'],
            ['name' => 'Meat & Poultry',  'description' => 'Chicken, mutton, fish'],
            ['name' => 'Vegetables',      'description' => 'Fresh vegetables'],
            ['name' => 'Spices & Masala', 'description' => 'Dry spices and blends'],
            ['name' => 'Grains & Flour',  'description' => 'Rice, wheat, flour'],
            ['name' => 'Oils & Fats',     'description' => 'Cooking oils and ghee'],
            ['name' => 'Beverages',       'description' => 'Drinks and concentrates'],
            ['name' => 'Packaging',       'description' => 'Boxes, bags, containers'],
        ];
        $cats = [];
        foreach ($catData as $c) {
            $cats[$c['name']] = InventoryCategory::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $c['name']],
                ['description' => $c['description'], 'is_active' => true]
            );
        }

        // ── 3. Inventory Items ──────────────────────────────────────────────
        // [category, name, sku, cost_price, reorder_level, unit]
        $itemsData = [
            // Dairy & Eggs
            ['Dairy & Eggs',    'Paneer',           'DAI-001', 280,  2,   'kg'],
            ['Dairy & Eggs',    'Butter',           'DAI-002', 480,  1,   'kg'],
            ['Dairy & Eggs',    'Fresh Cream',      'DAI-003', 120,  2,   'L'],
            ['Dairy & Eggs',    'Milk',             'DAI-004', 60,   10,  'L'],
            ['Dairy & Eggs',    'Eggs',             'DAI-005', 7,    24,  'pcs'],
            ['Dairy & Eggs',    'Curd / Yogurt',    'DAI-006', 50,   3,   'kg'],
            // Meat & Poultry
            ['Meat & Poultry',  'Chicken (Boneless)','MEA-001', 220, 3,   'kg'],
            ['Meat & Poultry',  'Mutton',           'MEA-002', 680,  2,   'kg'],
            ['Meat & Poultry',  'Chicken Wings',    'MEA-003', 180,  2,   'kg'],
            // Vegetables
            ['Vegetables',      'Onion',            'VEG-001', 30,   5,   'kg'],
            ['Vegetables',      'Tomato',           'VEG-002', 40,   5,   'kg'],
            ['Vegetables',      'Garlic',           'VEG-003', 120,  1,   'kg'],
            ['Vegetables',      'Ginger',           'VEG-004', 100,  1,   'kg'],
            ['Vegetables',      'Green Chilli',     'VEG-005', 60,   0.5, 'kg'],
            ['Vegetables',      'Capsicum',         'VEG-006', 50,   2,   'kg'],
            ['Vegetables',      'Potato',           'VEG-007', 25,   5,   'kg'],
            // Spices & Masala
            ['Spices & Masala', 'Garam Masala',     'SPI-001', 400,  0.5, 'kg'],
            ['Spices & Masala', 'Turmeric Powder',  'SPI-002', 180,  0.5, 'kg'],
            ['Spices & Masala', 'Red Chilli Powder','SPI-003', 220,  0.5, 'kg'],
            ['Spices & Masala', 'Cumin Seeds',      'SPI-004', 300,  0.5, 'kg'],
            ['Spices & Masala', 'Coriander Powder', 'SPI-005', 160,  0.5, 'kg'],
            ['Spices & Masala', 'Tandoori Masala',  'SPI-006', 350,  0.5, 'kg'],
            // Grains & Flour
            ['Grains & Flour',  'Basmati Rice',     'GRA-001', 90,   10,  'kg'],
            ['Grains & Flour',  'Wheat Flour (Atta)','GRA-002', 45,  10,  'kg'],
            ['Grains & Flour',  'Maida',            'GRA-003', 40,   5,   'kg'],
            ['Grains & Flour',  'Black Lentils (Urad Dal)','GRA-004', 120, 3, 'kg'],
            // Oils & Fats
            ['Oils & Fats',     'Cooking Oil',      'OIL-001', 130,  5,   'L'],
            ['Oils & Fats',     'Ghee',             'OIL-002', 550,  2,   'kg'],
            // Beverages
            ['Beverages',       'Mango Pulp',       'BEV-001', 80,   3,   'kg'],
            ['Beverages',       'Tea Leaves',       'BEV-002', 400,  1,   'kg'],
            ['Beverages',       'Coffee Powder',    'BEV-003', 600,  0.5, 'kg'],
            ['Beverages',       'Soda Water',       'BEV-004', 20,   24,  'btl'],
            // Packaging
            ['Packaging',       'Takeaway Boxes',   'PKG-001', 5,    100, 'pcs'],
            ['Packaging',       'Paper Bags',       'PKG-002', 3,    100, 'pcs'],
        ];

        $items = [];
        foreach ($itemsData as [$catName, $name, $sku, $cost, $reorder, $unitAbbr]) {
            $items[$sku] = InventoryItem::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $name],
                [
                    'category_id'   => $cats[$catName]->id,
                    'unit_id'       => $units[$unitAbbr]->id,
                    'sku'           => $sku,
                    'cost_price'    => $cost,
                    'reorder_level' => $reorder,
                    'is_active'     => true,
                ]
            );
        }

        // ── 4. Inventory Stocks ─────────────────────────────────────────────
        $stockQty = [
            'DAI-001' => 8,   'DAI-002' => 4,   'DAI-003' => 6,   'DAI-004' => 20,
            'DAI-005' => 60,  'DAI-006' => 5,
            'MEA-001' => 10,  'MEA-002' => 6,   'MEA-003' => 5,
            'VEG-001' => 15,  'VEG-002' => 12,  'VEG-003' => 3,   'VEG-004' => 2,
            'VEG-005' => 1,   'VEG-006' => 4,   'VEG-007' => 10,
            'SPI-001' => 2,   'SPI-002' => 1.5, 'SPI-003' => 1.5, 'SPI-004' => 1,
            'SPI-005' => 1,   'SPI-006' => 1,
            'GRA-001' => 25,  'GRA-002' => 20,  'GRA-003' => 10,  'GRA-004' => 8,
            'OIL-001' => 15,  'OIL-002' => 4,
            'BEV-001' => 6,   'BEV-002' => 2,   'BEV-003' => 1,   'BEV-004' => 48,
            'PKG-001' => 300, 'PKG-002' => 200,
        ];
        foreach ($items as $sku => $item) {
            InventoryStock::firstOrCreate(
                ['item_id' => $item->id],
                ['quantity' => $stockQty[$sku] ?? 0, 'last_updated_at' => now()]
            );
        }

        // ── 5. Inventory Movements ──────────────────────────────────────────
        $movementsData = [
            ['DAI-001', 'purchase',    10,   280, 'Opening stock - Paneer'],
            ['DAI-001', 'sale',        -2,   280, 'Used in Paneer Tikka'],
            ['MEA-001', 'purchase',    15,   220, 'Opening stock - Chicken'],
            ['MEA-001', 'sale',        -5,   220, 'Used in Butter Chicken & Tikka'],
            ['GRA-001', 'purchase',    30,   90,  'Opening stock - Basmati Rice'],
            ['GRA-001', 'sale',        -5,   90,  'Used in Biryani'],
            ['OIL-001', 'purchase',    20,   130, 'Opening stock - Cooking Oil'],
            ['OIL-001', 'adjustment',  -5,   130, 'Monthly adjustment'],
            ['VEG-001', 'purchase',    20,   30,  'Weekly vegetable purchase'],
            ['VEG-001', 'waste',       -2,   30,  'Spoilage - onions'],
            ['SPI-001', 'purchase',    3,    400, 'Spice restock'],
            ['PKG-001', 'purchase',    500,  5,   'Packaging restock'],
            ['PKG-001', 'sale',        -200, 5,   'Used for takeaway orders'],
        ];
        foreach ($movementsData as [$sku, $type, $qty, $cost, $notes]) {
            InventoryMovement::create([
                'restaurant_id' => $rid,
                'item_id'       => $items[$sku]->id,
                'user_id'       => $uid,
                'type'          => $type,
                'quantity'      => $qty,
                'cost_price'    => $cost,
                'notes'         => $notes,
            ]);
        }

        // ── 6. Suppliers ────────────────────────────────────────────────────
        $suppliersData = [
            ['name' => 'Fresh Farm Dairy',    'contact_person' => 'Ramesh Patel',   'phone' => '9876543210', 'email' => 'ramesh@freshfarmdairy.com',  'address' => '12 Dairy Colony, Ahmedabad'],
            ['name' => 'Prime Meat Traders',  'contact_person' => 'Suresh Kumar',   'phone' => '9876543211', 'email' => 'suresh@primemeat.com',        'address' => '45 Meat Market, Ahmedabad'],
            ['name' => 'Green Valley Veggies','contact_person' => 'Priya Singh',    'phone' => '9876543212', 'email' => 'priya@greenvalley.com',       'address' => '8 Vegetable Mandi, Ahmedabad'],
            ['name' => 'Spice World',         'contact_person' => 'Anil Sharma',    'phone' => '9876543213', 'email' => 'anil@spiceworld.com',         'address' => '22 Spice Bazaar, Ahmedabad'],
            ['name' => 'Grain Masters',       'contact_person' => 'Vijay Mehta',    'phone' => '9876543214', 'email' => 'vijay@grainmasters.com',      'address' => '5 Grain Market, Ahmedabad'],
        ];
        $suppliers = [];
        foreach ($suppliersData as $s) {
            $suppliers[] = Supplier::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $s['name']],
                array_merge($s, ['is_active' => true, 'notes' => 'Reliable supplier'])
            );
        }
        [$dairySupplier, $meatSupplier, $vegSupplier, $spiceSupplier, $grainSupplier] = $suppliers;

        // ── 7. Purchase Orders ──────────────────────────────────────────────
        $posData = [
            [
                'supplier' => $dairySupplier, 'po_number' => 'PO-2026-001',
                'status' => 'received', 'expected_at' => '2026-03-01',
                'notes' => 'Monthly dairy restock',
                'items' => [
                    ['DAI-001', 10, 280], ['DAI-002', 5, 480], ['DAI-003', 8, 120], ['DAI-004', 20, 60],
                ],
            ],
            [
                'supplier' => $meatSupplier, 'po_number' => 'PO-2026-002',
                'status' => 'received', 'expected_at' => '2026-03-05',
                'notes' => 'Weekly meat order',
                'items' => [
                    ['MEA-001', 15, 220], ['MEA-002', 8, 680], ['MEA-003', 6, 180],
                ],
            ],
            [
                'supplier' => $vegSupplier, 'po_number' => 'PO-2026-003',
                'status' => 'ordered', 'expected_at' => '2026-03-25',
                'notes' => 'Weekly vegetable order',
                'items' => [
                    ['VEG-001', 20, 30], ['VEG-002', 15, 40], ['VEG-003', 3, 120], ['VEG-007', 10, 25],
                ],
            ],
            [
                'supplier' => $spiceSupplier, 'po_number' => 'PO-2026-004',
                'status' => 'draft', 'expected_at' => '2026-03-28',
                'notes' => 'Monthly spice restock',
                'items' => [
                    ['SPI-001', 2, 400], ['SPI-002', 2, 180], ['SPI-003', 2, 220], ['SPI-006', 2, 350],
                ],
            ],
            [
                'supplier' => $grainSupplier, 'po_number' => 'PO-2026-005',
                'status' => 'partial', 'expected_at' => '2026-03-20',
                'notes' => 'Grain and flour order',
                'items' => [
                    ['GRA-001', 50, 90], ['GRA-002', 25, 45], ['GRA-003', 15, 40], ['GRA-004', 10, 120],
                ],
            ],
        ];

        foreach ($posData as $poData) {
            $total = collect($poData['items'])->sum(fn($i) => $i[1] * $i[2]);
            $po = PurchaseOrder::firstOrCreate(
                ['po_number' => $poData['po_number']],
                [
                    'restaurant_id' => $rid,
                    'supplier_id'   => $poData['supplier']->id,
                    'user_id'       => $uid,
                    'status'        => $poData['status'],
                    'total'         => $total,
                    'notes'         => $poData['notes'],
                    'expected_at'   => $poData['expected_at'],
                    'received_at'   => $poData['status'] === 'received' ? now() : null,
                ]
            );
            foreach ($poData['items'] as [$sku, $qty, $price]) {
                PurchaseOrderItem::firstOrCreate(
                    ['purchase_order_id' => $po->id, 'item_id' => $items[$sku]->id],
                    [
                        'quantity'           => $qty,
                        'received_quantity'  => $poData['status'] === 'received' ? $qty : ($poData['status'] === 'partial' ? $qty * 0.5 : 0),
                        'unit_price'         => $price,
                    ]
                );
            }
        }

        // ── 8. Recipes ──────────────────────────────────────────────────────
        $menuItems = MenuItem::where('restaurant_id', $rid)->get()->keyBy('name');

        $recipesData = [
            [
                'name' => 'Butter Chicken Recipe', 'menu_item' => 'Butter Chicken',
                'yield_quantity' => 1, 'yield_unit' => 'pcs',
                'notes' => 'Serves 1 portion',
                'ingredients' => [
                    ['MEA-001', 0.25, 'kg'], ['DAI-002', 0.03, 'kg'], ['DAI-003', 0.05, 'L'],
                    ['VEG-002', 0.1, 'kg'],  ['SPI-001', 0.01, 'kg'], ['OIL-001', 0.02, 'L'],
                ],
            ],
            [
                'name' => 'Paneer Tikka Recipe', 'menu_item' => 'Paneer Tikka',
                'yield_quantity' => 1, 'yield_unit' => 'pcs',
                'notes' => 'Serves 1 portion',
                'ingredients' => [
                    ['DAI-001', 0.2, 'kg'],  ['DAI-006', 0.05, 'kg'], ['SPI-006', 0.01, 'kg'],
                    ['VEG-006', 0.05, 'kg'], ['OIL-001', 0.02, 'L'],
                ],
            ],
            [
                'name' => 'Chicken Biryani Recipe', 'menu_item' => 'Chicken Biryani',
                'yield_quantity' => 1, 'yield_unit' => 'pcs',
                'notes' => 'Serves 1 portion',
                'ingredients' => [
                    ['MEA-001', 0.2, 'kg'],  ['GRA-001', 0.15, 'kg'], ['VEG-001', 0.05, 'kg'],
                    ['SPI-001', 0.01, 'kg'], ['OIL-002', 0.02, 'kg'], ['DAI-006', 0.05, 'kg'],
                ],
            ],
            [
                'name' => 'Dal Makhani Recipe', 'menu_item' => 'Dal Makhani',
                'yield_quantity' => 1, 'yield_unit' => 'pcs',
                'notes' => 'Serves 1 portion',
                'ingredients' => [
                    ['GRA-004', 0.1, 'kg'],  ['DAI-002', 0.03, 'kg'], ['DAI-003', 0.04, 'L'],
                    ['VEG-002', 0.08, 'kg'], ['SPI-001', 0.008, 'kg'],
                ],
            ],
            [
                'name' => 'Butter Naan Recipe', 'menu_item' => 'Butter Naan',
                'yield_quantity' => 1, 'yield_unit' => 'pcs',
                'notes' => 'Per piece',
                'ingredients' => [
                    ['GRA-003', 0.08, 'kg'], ['DAI-002', 0.01, 'kg'], ['DAI-004', 0.03, 'L'],
                ],
            ],
            [
                'name' => 'Mango Lassi Recipe', 'menu_item' => 'Mango Lassi',
                'yield_quantity' => 1, 'yield_unit' => 'pcs',
                'notes' => 'Per glass',
                'ingredients' => [
                    ['DAI-006', 0.15, 'kg'], ['BEV-001', 0.1, 'kg'], ['DAI-004', 0.05, 'L'],
                ],
            ],
        ];

        foreach ($recipesData as $rd) {
            $menuItem = $menuItems[$rd['menu_item']] ?? null;
            $recipe = Recipe::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $rd['name']],
                [
                    'menu_item_id'   => $menuItem?->id,
                    'yield_quantity' => $rd['yield_quantity'],
                    'yield_unit_id'  => $units[$rd['yield_unit']]->id,
                    'notes'          => $rd['notes'],
                ]
            );
            foreach ($rd['ingredients'] as [$sku, $qty, $unitAbbr]) {
                RecipeIngredient::firstOrCreate(
                    ['recipe_id' => $recipe->id, 'item_id' => $items[$sku]->id],
                    ['quantity' => $qty, 'unit_id' => $units[$unitAbbr]->id]
                );
            }
        }

        // ── 9. Batch Inventories ────────────────────────────────────────────
        $batchesData = [
            [
                'batch_number' => 'BAT-2026-001', 'type' => 'production',
                'status' => 'completed', 'notes' => 'Morning prep - Paneer & Chicken marination',
                'processed_at' => now()->subDays(2),
                'items' => [
                    ['DAI-001', 5,   'Paneer prepped for tikka'],
                    ['MEA-001', 8,   'Chicken marinated for tikka & biryani'],
                    ['SPI-006', 0.5, 'Tandoori masala mixed'],
                ],
            ],
            [
                'batch_number' => 'BAT-2026-002', 'type' => 'waste',
                'status' => 'completed', 'notes' => 'End-of-day waste log',
                'processed_at' => now()->subDays(1),
                'items' => [
                    ['VEG-002', 1.5, 'Overripe tomatoes discarded'],
                    ['DAI-004', 2,   'Expired milk disposed'],
                    ['VEG-001', 0.5, 'Spoiled onions'],
                ],
            ],
            [
                'batch_number' => 'BAT-2026-003', 'type' => 'adjustment',
                'status' => 'completed', 'notes' => 'Weekly stock count adjustment',
                'processed_at' => now()->subDays(3),
                'items' => [
                    ['GRA-001', 2,   'Stock count variance - rice'],
                    ['OIL-001', 1,   'Stock count variance - oil'],
                ],
            ],
            [
                'batch_number' => 'BAT-2026-004', 'type' => 'production',
                'status' => 'draft', 'notes' => 'Planned prep for weekend',
                'processed_at' => null,
                'items' => [
                    ['MEA-002', 5,   'Mutton for rogan josh'],
                    ['GRA-001', 10,  'Rice for biryani batch'],
                    ['DAI-001', 3,   'Paneer for butter masala'],
                ],
            ],
        ];

        foreach ($batchesData as $bd) {
            $batch = BatchInventory::firstOrCreate(
                ['batch_number' => $bd['batch_number']],
                [
                    'restaurant_id' => $rid,
                    'user_id'       => $uid,
                    'type'          => $bd['type'],
                    'status'        => $bd['status'],
                    'notes'         => $bd['notes'],
                    'processed_at'  => $bd['processed_at'],
                ]
            );
            foreach ($bd['items'] as [$sku, $qty, $notes]) {
                BatchInventoryItem::firstOrCreate(
                    ['batch_inventory_id' => $batch->id, 'item_id' => $items[$sku]->id],
                    ['quantity' => $qty, 'notes' => $notes]
                );
            }
        }

        $this->command->info("Demo inventory seeded for restaurant: {$restaurant->name}");
        $this->command->info("  Units: " . count($unitsData));
        $this->command->info("  Categories: " . count($catData));
        $this->command->info("  Items: " . count($itemsData));
        $this->command->info("  Stocks: " . count($itemsData));
        $this->command->info("  Movements: " . count($movementsData));
        $this->command->info("  Suppliers: " . count($suppliersData));
        $this->command->info("  Purchase Orders: " . count($posData));
        $this->command->info("  Recipes: " . count($recipesData));
        $this->command->info("  Batch Inventories: " . count($batchesData));
    }
}
