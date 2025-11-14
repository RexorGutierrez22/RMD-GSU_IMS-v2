<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\InventoryItem;

class InventoryItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $items = [
            [
                'name' => 'iPhone 15 Pro Max',
                'description' => 'A17 Pro chip, ProRAW',
                'size' => '6.7"',
                'color' => 'Natural Titanium',
                'total_quantity' => 50,
                'available_quantity' => 25,
                'unit' => 'pcs',
                'location' => 'Admin Building',
                'category' => 'Electronics',
                'type' => 'usable',
                'status' => 'active',
                'brand' => 'Apple',
                'model' => 'iPhone 15 Pro Max',
                'unit_price' => 1299.99
            ],
            [
                'name' => 'A4 Paper Sheets',
                'description' => 'Premium white paper, 80gsm',
                'size' => 'A4',
                'color' => 'White',
                'total_quantity' => 500,
                'available_quantity' => 150,
                'unit' => 'sheets',
                'location' => 'Office Bodega',
                'category' => 'Office Supplies',
                'type' => 'consumable',
                'status' => 'active',
                'brand' => 'Generic',
                'unit_price' => 0.05
            ],
            [
                'name' => 'Samsung Galaxy S24 Ultra',
                'description' => 'Snapdragon 8 Gen 3',
                'size' => '6.8"',
                'color' => 'Titanium Black',
                'total_quantity' => 30,
                'available_quantity' => 12,
                'unit' => 'pcs',
                'location' => 'Admin Building',
                'category' => 'Electronics',
                'type' => 'usable',
                'status' => 'active',
                'brand' => 'Samsung',
                'model' => 'Galaxy S24 Ultra',
                'unit_price' => 1199.99
            ],
            [
                'name' => 'MacBook Air M2',
                'description' => 'M2 chip, 8GB RAM, 256GB SSD',
                'size' => '13.6"',
                'color' => 'Space Gray',
                'total_quantity' => 15,
                'available_quantity' => 8,
                'unit' => 'pcs',
                'location' => 'Admin Building',
                'category' => 'Computers',
                'type' => 'usable',
                'status' => 'active',
                'brand' => 'Apple',
                'model' => 'MacBook Air M2',
                'unit_price' => 1099.99
            ],
            [
                'name' => 'Ballpoint Pens',
                'description' => 'Blue ink, medium tip',
                'size' => 'Standard',
                'color' => 'Blue',
                'total_quantity' => 100,
                'available_quantity' => 45,
                'unit' => 'pcs',
                'location' => 'Office Bodega',
                'category' => 'Office Supplies',
                'type' => 'consumable',
                'status' => 'active',
                'brand' => 'Generic',
                'unit_price' => 0.50
            ],
            [
                'name' => 'Logitech MX Master 3S',
                'description' => 'Wireless Mouse, 4000 DPI',
                'size' => 'Standard',
                'color' => 'Graphite',
                'total_quantity' => 50,
                'available_quantity' => 35,
                'unit' => 'pcs',
                'location' => 'Admin Building',
                'category' => 'Accessories',
                'type' => 'usable',
                'status' => 'active',
                'brand' => 'Logitech',
                'model' => 'MX Master 3S',
                'unit_price' => 99.99
            ]
        ];

        foreach ($items as $item) {
            InventoryItem::create($item);
        }
    }
}
