<?php

namespace Database\Factories;

use App\Models\BorrowTransaction;
use App\Models\User;
use App\Models\InventoryItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class BorrowTransactionFactory extends Factory
{
    protected $model = BorrowTransaction::class;

    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'inventory_item_id' => InventoryItem::factory(),
            'quantity' => $this->faker->numberBetween(1, 5),
            'borrow_date' => now(),
            'expected_return_date' => now()->addDays(7),
            'purpose' => $this->faker->sentence(),
            'status' => 'pending',
            'borrower_name' => $this->faker->name(),
            'borrower_email' => $this->faker->email(),
        ];
    }

    public function borrowed()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'borrowed',
        ]);
    }

    public function returned()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'returned',
            'actual_return_date' => now(),
        ]);
    }

    public function overdue()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'borrowed',
            'expected_return_date' => now()->subDays(5),
        ]);
    }
}

