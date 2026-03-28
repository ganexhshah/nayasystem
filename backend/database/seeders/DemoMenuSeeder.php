<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Restaurant;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\ModifierGroup;
use App\Models\Modifier;
use App\Models\Menu;

class DemoMenuSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::where('slug', 'khushi-shha-41zP')->firstOrFail();
        $rid = $restaurant->id;

        // ── 1. Item Categories ──────────────────────────────────────────────
        $categories = [];
        $categoryData = [
            ['name' => 'Starters',      'description' => 'Appetizers and snacks'],
            ['name' => 'Main Course',   'description' => 'Hearty main dishes'],
            ['name' => 'Breads',        'description' => 'Fresh baked breads'],
            ['name' => 'Rice & Biryani','description' => 'Rice dishes and biryanis'],
            ['name' => 'Desserts',      'description' => 'Sweet treats'],
            ['name' => 'Beverages',     'description' => 'Drinks and refreshments'],
        ];
        foreach ($categoryData as $i => $cat) {
            $categories[] = MenuCategory::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $cat['name']],
                ['description' => $cat['description'], 'sort_order' => $i + 1]
            );
        }
        [$starters, $mains, $breads, $rice, $desserts, $beverages] = $categories;

        // ── 2. Modifier Groups ──────────────────────────────────────────────
        $spiceGroup = ModifierGroup::firstOrCreate(
            ['restaurant_id' => $rid, 'name' => 'Spice Level'],
            ['min_select' => 1, 'max_select' => 1, 'is_required' => true]
        );
        $portionGroup = ModifierGroup::firstOrCreate(
            ['restaurant_id' => $rid, 'name' => 'Portion Size'],
            ['min_select' => 1, 'max_select' => 1, 'is_required' => true]
        );
        $addonsGroup = ModifierGroup::firstOrCreate(
            ['restaurant_id' => $rid, 'name' => 'Add-ons'],
            ['min_select' => 0, 'max_select' => 3, 'is_required' => false]
        );
        $drinkTempGroup = ModifierGroup::firstOrCreate(
            ['restaurant_id' => $rid, 'name' => 'Temperature'],
            ['min_select' => 1, 'max_select' => 1, 'is_required' => true]
        );

        // ── 3. Modifiers ────────────────────────────────────────────────────
        $spiceModifiers = [
            ['name' => 'Mild',        'price' => 0],
            ['name' => 'Medium',      'price' => 0],
            ['name' => 'Hot',         'price' => 0],
            ['name' => 'Extra Hot',   'price' => 0],
        ];
        foreach ($spiceModifiers as $m) {
            Modifier::firstOrCreate(['modifier_group_id' => $spiceGroup->id, 'name' => $m['name']], ['price' => $m['price']]);
        }

        $portionModifiers = [
            ['name' => 'Half',   'price' => 0],
            ['name' => 'Full',   'price' => 80],
        ];
        foreach ($portionModifiers as $m) {
            Modifier::firstOrCreate(['modifier_group_id' => $portionGroup->id, 'name' => $m['name']], ['price' => $m['price']]);
        }

        $addonModifiers = [
            ['name' => 'Extra Cheese',  'price' => 30],
            ['name' => 'Extra Sauce',   'price' => 20],
            ['name' => 'Extra Butter',  'price' => 15],
            ['name' => 'Raita',         'price' => 40],
        ];
        foreach ($addonModifiers as $m) {
            Modifier::firstOrCreate(['modifier_group_id' => $addonsGroup->id, 'name' => $m['name']], ['price' => $m['price']]);
        }

        $tempModifiers = [
            ['name' => 'Hot',  'price' => 0],
            ['name' => 'Cold', 'price' => 0],
        ];
        foreach ($tempModifiers as $m) {
            Modifier::firstOrCreate(['modifier_group_id' => $drinkTempGroup->id, 'name' => $m['name']], ['price' => $m['price']]);
        }

        // ── 4. Menu Items ───────────────────────────────────────────────────
        $itemsData = [
            // Starters
            ['category' => $starters, 'name' => 'Paneer Tikka',        'price' => 220, 'is_veg' => true,  'description' => 'Grilled cottage cheese with spices', 'prep' => 15, 'groups' => [$spiceGroup, $addonsGroup]],
            ['category' => $starters, 'name' => 'Chicken Tikka',       'price' => 280, 'is_veg' => false, 'description' => 'Tender chicken marinated and grilled', 'prep' => 20, 'groups' => [$spiceGroup, $addonsGroup]],
            ['category' => $starters, 'name' => 'Veg Spring Rolls',    'price' => 160, 'is_veg' => true,  'description' => 'Crispy rolls with vegetable filling', 'prep' => 12, 'groups' => [$addonsGroup]],
            ['category' => $starters, 'name' => 'Chicken Wings',       'price' => 320, 'is_veg' => false, 'description' => 'Spicy fried chicken wings', 'prep' => 18, 'groups' => [$spiceGroup]],
            // Main Course
            ['category' => $mains, 'name' => 'Butter Chicken',         'price' => 340, 'is_veg' => false, 'description' => 'Creamy tomato-based chicken curry', 'prep' => 25, 'groups' => [$spiceGroup, $portionGroup, $addonsGroup]],
            ['category' => $mains, 'name' => 'Paneer Butter Masala',   'price' => 280, 'is_veg' => true,  'description' => 'Rich paneer in buttery tomato gravy', 'prep' => 20, 'groups' => [$spiceGroup, $portionGroup, $addonsGroup]],
            ['category' => $mains, 'name' => 'Dal Makhani',            'price' => 220, 'is_veg' => true,  'description' => 'Slow-cooked black lentils in cream', 'prep' => 20, 'groups' => [$portionGroup]],
            ['category' => $mains, 'name' => 'Mutton Rogan Josh',      'price' => 420, 'is_veg' => false, 'description' => 'Aromatic Kashmiri mutton curry', 'prep' => 35, 'groups' => [$spiceGroup, $portionGroup]],
            // Breads
            ['category' => $breads, 'name' => 'Butter Naan',           'price' => 50,  'is_veg' => true,  'description' => 'Soft leavened bread with butter', 'prep' => 8, 'groups' => [$addonsGroup]],
            ['category' => $breads, 'name' => 'Garlic Naan',           'price' => 60,  'is_veg' => true,  'description' => 'Naan topped with garlic and herbs', 'prep' => 8, 'groups' => []],
            ['category' => $breads, 'name' => 'Tandoori Roti',         'price' => 35,  'is_veg' => true,  'description' => 'Whole wheat bread from tandoor', 'prep' => 6, 'groups' => []],
            ['category' => $breads, 'name' => 'Stuffed Paratha',       'price' => 90,  'is_veg' => true,  'description' => 'Layered bread stuffed with potato', 'prep' => 12, 'groups' => [$addonsGroup]],
            // Rice & Biryani
            ['category' => $rice, 'name' => 'Chicken Biryani',         'price' => 360, 'is_veg' => false, 'description' => 'Fragrant basmati rice with chicken', 'prep' => 30, 'groups' => [$spiceGroup, $portionGroup, $addonsGroup]],
            ['category' => $rice, 'name' => 'Veg Biryani',             'price' => 260, 'is_veg' => true,  'description' => 'Aromatic rice with mixed vegetables', 'prep' => 25, 'groups' => [$spiceGroup, $portionGroup]],
            ['category' => $rice, 'name' => 'Mutton Biryani',          'price' => 440, 'is_veg' => false, 'description' => 'Slow-cooked mutton with basmati rice', 'prep' => 40, 'groups' => [$spiceGroup, $portionGroup]],
            ['category' => $rice, 'name' => 'Jeera Rice',              'price' => 140, 'is_veg' => true,  'description' => 'Steamed rice tempered with cumin', 'prep' => 15, 'groups' => []],
            // Desserts
            ['category' => $desserts, 'name' => 'Gulab Jamun',         'price' => 80,  'is_veg' => true,  'description' => 'Soft milk dumplings in sugar syrup', 'prep' => 5, 'groups' => []],
            ['category' => $desserts, 'name' => 'Rasmalai',            'price' => 100, 'is_veg' => true,  'description' => 'Cottage cheese in sweetened milk', 'prep' => 5, 'groups' => []],
            ['category' => $desserts, 'name' => 'Kulfi',               'price' => 90,  'is_veg' => true,  'description' => 'Traditional Indian ice cream', 'prep' => 3, 'groups' => []],
            // Beverages
            ['category' => $beverages, 'name' => 'Mango Lassi',        'price' => 100, 'is_veg' => true,  'description' => 'Chilled mango yogurt drink', 'prep' => 5, 'groups' => [$drinkTempGroup]],
            ['category' => $beverages, 'name' => 'Masala Chai',        'price' => 60,  'is_veg' => true,  'description' => 'Spiced Indian tea', 'prep' => 5, 'groups' => [$drinkTempGroup]],
            ['category' => $beverages, 'name' => 'Fresh Lime Soda',    'price' => 70,  'is_veg' => true,  'description' => 'Refreshing lime with soda', 'prep' => 3, 'groups' => [$drinkTempGroup]],
            ['category' => $beverages, 'name' => 'Cold Coffee',        'price' => 120, 'is_veg' => true,  'description' => 'Chilled blended coffee', 'prep' => 5, 'groups' => []],
        ];

        $allItems = [];
        foreach ($itemsData as $data) {
            $item = MenuItem::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $data['name']],
                [
                    'category_id'      => $data['category']->id,
                    'description'      => $data['description'],
                    'price'            => $data['price'],
                    'is_veg'           => $data['is_veg'],
                    'is_available'     => true,
                    'preparation_time' => $data['prep'],
                    'tax_rate'         => 5.00,
                ]
            );
            if (!empty($data['groups'])) {
                $item->modifierGroups()->syncWithoutDetaching(
                    collect($data['groups'])->pluck('id')->toArray()
                );
            }
            $allItems[] = $item;
        }

        // ── 5. Menus ────────────────────────────────────────────────────────
        $allItemIds = collect($allItems)->pluck('id')->toArray();
        $vegItemIds = collect($allItems)->filter(fn($i) => $i->is_veg)->pluck('id')->toArray();
        $nonVegItemIds = collect($allItems)->filter(fn($i) => !$i->is_veg)->pluck('id')->toArray();

        $menusData = [
            ['name' => 'Full Menu',    'description' => 'Complete menu with all items',    'items' => $allItemIds],
            ['name' => 'Veg Menu',     'description' => 'Pure vegetarian menu',            'items' => $vegItemIds],
            ['name' => 'Non-Veg Menu', 'description' => 'Non-vegetarian specialties',      'items' => $nonVegItemIds],
            ['name' => 'Lunch Special','description' => 'Curated lunch offerings',         'items' => array_slice($allItemIds, 4, 8)],
        ];

        foreach ($menusData as $menuData) {
            $menu = Menu::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $menuData['name']],
                ['description' => $menuData['description']]
            );
            $menu->items()->syncWithoutDetaching($menuData['items']);
        }

        $this->command->info("Demo data seeded for restaurant: {$restaurant->name} (slug: {$restaurant->slug})");
        $this->command->info("  Categories: " . count($categories));
        $this->command->info("  Items: " . count($allItems));
        $this->command->info("  Modifier Groups: 4 | Modifiers: " . (count($spiceModifiers) + count($portionModifiers) + count($addonModifiers) + count($tempModifiers)));
        $this->command->info("  Menus: " . count($menusData));
    }
}
