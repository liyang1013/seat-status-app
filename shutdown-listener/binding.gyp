{
  "targets": [
    {
      "target_name": "shutdownlistener",
      "sources": ["src/win32_shutdown.cc"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "defines": [
        "NAPI_CPP_EXCEPTIONS"
      ],
      "libraries": [
        "user32.lib"
      ]
    }
  ]
}