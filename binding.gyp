{
  "targets": [
    {
      "target_name": "win_shutdown_handler",
      "sources": [
        "native/WinShutdownHandler.cpp",
        "native/main.cpp"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "libraries": [
        "user32.lib"
      ]
    }
  ]
}