<?php

namespace Database\Factories;

use App\Models\InventoryItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryItemFactory extends Factory
{
    protected $model = InventoryItem::class;

    public function definition()
    {
        $totalQuantity = $this->faker->numberBetween(1, 100);

        return [
            'name' => $this->faker->words(2, true),
            'category' => $this->faker->randomElement(['Electronics', 'Furniture', 'Equipment', 'Supplies']),
            'description' => $this->faker->sentence(),
            'total_quantity' => $totalQuantity,
            'available_quantity' => $this->faker->numberBetween(0, $totalQuantity),
            'type' => $this->faker->randomElement(['consumable', 'non-consumable']),
            'status' => 'active',
            'unit_price' => $this->faker->randomFloat(2, 100, 10000),
            'location' => $this->faker->word(),
            'brand' => $this->faker->company(),
            'model' => $this->faker->word(),
        ];
    }
}

