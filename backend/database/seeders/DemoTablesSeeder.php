<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Restaurant;
use App\Models\TableArea;
use App\Models\Table;

class DemoTablesSeeder extends Seeder
{
    public function run(): void
    {
        $restaurant = Restaurant::where('slug', 'khushi-shha-41zP')->firstOrFail();
        $rid = $restaurant->id;

        // ── 1. Table Areas ──────────────────────────────────────────────────
        $areasData = [
            ['name' => 'Main Hall',    'description' => 'Central dining area with open seating'],
            ['name' => 'Outdoor Patio','description' => 'Al fresco dining with garden view'],
            ['name' => 'Private Cabins','description' => 'Enclosed cabins for private dining'],
            ['name' => 'Rooftop',      'description' => 'Open-air rooftop seating'],
        ];

        $areas = [];
        foreach ($areasData as $a) {
            $areas[] = TableArea::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $a['name']],
                ['description' => $a['description'], 'is_active' => true]
            );
        }
        [$mainHall, $patio, $cabins, $rooftop] = $areas;

        // ── 2. Tables ───────────────────────────────────────────────────────
        $tablesData = [
            // Main Hall - regular tables
            ['area' => $mainHall, 'name' => 'T-01', 'type' => 'table', 'capacity' => 2],
            ['area' => $mainHall, 'name' => 'T-02', 'type' => 'table', 'capacity' => 2],
            ['area' => $mainHall, 'name' => 'T-03', 'type' => 'table', 'capacity' => 4],
            ['area' => $mainHall, 'name' => 'T-04', 'type' => 'table', 'capacity' => 4],
            ['area' => $mainHall, 'name' => 'T-05', 'type' => 'table', 'capacity' => 4],
            ['area' => $mainHall, 'name' => 'T-06', 'type' => 'table', 'capacity' => 6],
            ['area' => $mainHall, 'name' => 'T-07', 'type' => 'table', 'capacity' => 6],
            ['area' => $mainHall, 'name' => 'T-08', 'type' => 'table', 'capacity' => 8],
            // Outdoor Patio
            ['area' => $patio, 'name' => 'P-01', 'type' => 'table', 'capacity' => 2],
            ['area' => $patio, 'name' => 'P-02', 'type' => 'table', 'capacity' => 2],
            ['area' => $patio, 'name' => 'P-03', 'type' => 'table', 'capacity' => 4],
            ['area' => $patio, 'name' => 'P-04', 'type' => 'table', 'capacity' => 4],
            ['area' => $patio, 'name' => 'P-05', 'type' => 'table', 'capacity' => 6],
            // Private Cabins
            ['area' => $cabins, 'name' => 'C-01', 'type' => 'cabin', 'capacity' => 4,  'description' => 'Cozy cabin for small groups'],
            ['area' => $cabins, 'name' => 'C-02', 'type' => 'cabin', 'capacity' => 6,  'description' => 'Mid-size private cabin'],
            ['area' => $cabins, 'name' => 'C-03', 'type' => 'cabin', 'capacity' => 8,  'description' => 'Large cabin for family gatherings'],
            ['area' => $cabins, 'name' => 'C-04', 'type' => 'cabin', 'capacity' => 10, 'description' => 'Premium cabin with extra privacy'],
            // Rooftop
            ['area' => $rooftop, 'name' => 'R-01', 'type' => 'table', 'capacity' => 2],
            ['area' => $rooftop, 'name' => 'R-02', 'type' => 'table', 'capacity' => 2],
            ['area' => $rooftop, 'name' => 'R-03', 'type' => 'table', 'capacity' => 4],
            ['area' => $rooftop, 'name' => 'R-04', 'type' => 'table', 'capacity' => 4],
            ['area' => $rooftop, 'name' => 'R-05', 'type' => 'table', 'capacity' => 6],
        ];

        $tables = [];
        foreach ($tablesData as $t) {
            $tables[] = Table::firstOrCreate(
                ['restaurant_id' => $rid, 'name' => $t['name']],
                [
                    'area_id'     => $t['area']->id,
                    'type'        => $t['type'],
                    'capacity'    => $t['capacity'],
                    'status'      => 'available',
                    'is_active'   => true,
                    'description' => $t['description'] ?? null,
                ]
            );
        }

        // ── 3. QR Code URLs (stored as qr_code field) ───────────────────────
        $frontendUrl = config('app.frontend_url', 'http://localhost:3000');
        foreach ($tables as $table) {
            if (!$table->qr_code) {
                $table->update([
                    'qr_code' => "{$frontendUrl}/restaurant/{$restaurant->slug}?table={$table->id}",
                ]);
            }
        }

        $this->command->info("Demo tables seeded for restaurant: {$restaurant->name}");
        $this->command->info("  Areas: " . count($areas));
        $this->command->info("  Tables: " . count($tables));
        $this->command->info("  QR codes generated for all tables");
    }
}
