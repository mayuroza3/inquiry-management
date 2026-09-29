<?php

namespace Database\Factories;

use App\Models\Inquiry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Inquiry>
 */
class InquiryFactory extends Factory
{
    protected $model = Inquiry::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'contact_name' => fake()->name(),
            'email' => fake()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'company' => fake()->company(),
            'message' => fake()->paragraph(),
            'status' => 'new',
            'assigned_to' => User::factory(),
            'lead_source_id' => null,
        ];
    }
}
