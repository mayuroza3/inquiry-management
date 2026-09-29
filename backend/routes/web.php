<?php

use Illuminate\Support\Facades\Route;

Route::get('/{path?}', function () {
    $index = public_path('index.html');

    if (is_file($index)) {
        return response()->file($index);
    }

    return view('welcome');
})->where('path', '^(?!api|up|storage).*$');
