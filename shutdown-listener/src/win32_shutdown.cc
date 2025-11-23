#define NAPI_VERSION 6
#define UNICODE
#define _UNICODE

#include <napi.h>
#include <windows.h>
#include <iostream>

static Napi::ThreadSafeFunction g_tsfn;
static HANDLE g_thread = nullptr;
static bool g_listening = false;

LRESULT CALLBACK MessageOnlyWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    if (msg == WM_QUERYENDSESSION) {
        std::cout << "=== SHUTDOWN DETECTED ===" << std::endl;
        
        if (g_tsfn) {
            auto callback = [](Napi::Env env, Napi::Function jsCallback) {
                jsCallback.Call({});
            };
            g_tsfn.BlockingCall(callback);
        }
        return TRUE;
    }
    
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

DWORD WINAPI MessageOnlyLoop(LPVOID) {
    std::cout << "Message-only window loop started" << std::endl;
    
    HINSTANCE hInstance = GetModuleHandle(nullptr);
    
    WNDCLASS wc = {};
    wc.lpfnWndProc = MessageOnlyWndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = L"MessageOnlyShutdownListener";
    
    RegisterClass(&wc);
    
    // 创建消息专用窗口（完全不可见）
    HWND hWnd = CreateWindowEx(
        0,
        L"MessageOnlyShutdownListener",
        NULL,
        0,
        0, 0, 0, 0,
        HWND_MESSAGE,  // 关键：消息专用窗口，不在任务栏显示
        NULL,
        hInstance,
        NULL
    );
    
    if (!hWnd) {
        std::cout << "Failed to create message-only window" << std::endl;
        return 1;
    }
    
    std::cout << "Message-only window created successfully" << std::endl;
    
    MSG msg;
    while (GetMessage(&msg, nullptr, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
    
    return 0;
}

Napi::Boolean StartShutdownListener(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_listening) return Napi::Boolean::New(env, true);
    
    if (info.Length() < 1 || !info[0].IsFunction()) {
        throw Napi::Error::New(env, "Callback function required");
    }
    
    g_tsfn = Napi::ThreadSafeFunction::New(
        env,
        info[0].As<Napi::Function>(),
        "ShutdownCallback",
        0,
        1
    );
    
    g_thread = CreateThread(nullptr, 0, MessageOnlyLoop, nullptr, 0, nullptr);
    if (g_thread) {
        g_listening = true;
        std::cout << "Message-only shutdown listener started" << std::endl;
        return Napi::Boolean::New(env, true);
    }
    
    return Napi::Boolean::New(env, false);
}

Napi::Boolean StopShutdownListener(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    if (g_thread) {
        TerminateThread(g_thread, 0);
        CloseHandle(g_thread);
        g_thread = nullptr;
    }
    
    if (g_tsfn) {
        g_tsfn.Release();
    }
    
    g_listening = false;
    return Napi::Boolean::New(env, true);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("start", Napi::Function::New(env, StartShutdownListener));
    exports.Set("stop", Napi::Function::New(env, StopShutdownListener));
    return exports;
}

NODE_API_MODULE(shutdownlistener, Init)