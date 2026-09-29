<?php

namespace App\Support;

final class InputRules
{
    public static function personName(bool $sometimes = false): array
    {
        return [
            $sometimes ? 'sometimes' : 'required',
            'string',
            'max:255',
            'regex:/^[\p{L}][\p{L}\p{M} .\'\-]*$/u',
        ];
    }

    public static function company(): array
    {
        return [
            'nullable',
            'string',
            'max:255',
            'regex:/^[\p{L}\p{N}][\p{L}\p{M}\p{N} .,&\'()\-]*$/u',
        ];
    }

    public static function email(bool $sometimes = false): array
    {
        return [
            $sometimes ? 'sometimes' : 'required',
            'string',
            'max:255',
            'email:filter',
            'regex:/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/',
        ];
    }

    /**
     * @return list<string|\Closure>
     */
    public static function phone(): array
    {
        return [
            'nullable',
            'string',
            'max:50',
            function (string $attribute, mixed $value, \Closure $fail): void {
                if ($value === null || $value === '') {
                    return;
                }

                if (! is_string($value) || ! preg_match('/^[0-9+\-().\s]+$/', $value)) {
                    $fail('Enter a valid phone number.');

                    return;
                }

                $digits = preg_match_all('/\d/', $value);
                if ($digits < 7 || $digits > 15) {
                    $fail('Enter a valid phone number.');
                }
            },
        ];
    }

    public static function prose(int $max = 5000, bool $sometimes = false): array
    {
        $presence = $sometimes ? ['sometimes', 'required'] : ['required'];

        return [
            ...$presence,
            'string',
            'max:'.$max,
            'regex:/^[\p{L}\p{M}\p{N}\s.,;:!?\'"()\/&+\-@#%]*$/u',
        ];
    }

    public static function password(bool $required = true): array
    {
        return [$required ? 'required' : 'nullable', 'string', 'min:8', 'max:128'];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'contact_name.regex' => 'Name can use letters, spaces, apostrophes, hyphens, and periods only.',
            'name.regex' => 'Name can use letters, spaces, apostrophes, hyphens, and periods only.',
            'company.regex' => 'Company can use letters, numbers, and basic punctuation only.',
            'email.email' => 'Enter a valid email.',
            'email.regex' => 'Enter a valid email.',
            'message.regex' => 'Remove unsupported characters from the message.',
            'body.regex' => 'Remove unsupported characters.',
        ];
    }
}
