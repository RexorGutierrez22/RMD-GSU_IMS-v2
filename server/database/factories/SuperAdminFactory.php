<?php

namespace Database\Factories;

use App\Models\SuperAdmin;
use Illuminate\Database\Eloquent\Factories\Factory;

class SuperAdminFactory extends Factory
{
    protected $model = SuperAdmin::class;

    public function definition()
    {
        return [
            'username' => $this->faker->unique()->userName(),
            'password' => bcrypt('password123'),
            'full_name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
        ];
    }
}

